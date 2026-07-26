import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentMethod, PaymentStatus, StockChangeType } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import { CartService } from "../cart/cart.service";
import { CouponsService } from "../coupons/coupons.service";
import type { CreateOrderDto } from "./dto/create-order.dto";
import type { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import type { UpdatePaymentStatusDto } from "./dto/update-payment-status.dto";
import type { DispatchOrderDto } from "./dto/dispatch-order.dto";
import type { QueryOrdersDto } from "./dto/query-orders.dto";

const ORDER_INCLUDE = {
  items: true,
  payments: { orderBy: { createdAt: "desc" as const } },
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
};

const TERMINAL_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
  ) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getOrCreateCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException("Your cart is empty");
    }

    for (const item of cart.items) {
      if (item.quantity > item.variant.stock) {
        throw new BadRequestException(`Insufficient stock for ${item.variant.product.name} (${item.variant.volumeMl}ml)`);
      }
    }

    const shippingAddress = await this.prisma.address.findFirst({
      where: { id: dto.shippingAddressId, userId },
    });
    if (!shippingAddress) {
      throw new NotFoundException("Shipping address not found");
    }

    const billingAddress = dto.billingAddressId
      ? await this.prisma.address.findFirst({ where: { id: dto.billingAddressId, userId } })
      : shippingAddress;
    if (dto.billingAddressId && !billingAddress) {
      throw new NotFoundException("Billing address not found");
    }

    const subtotal = cart.subtotal;
    let discountAmount = 0;
    let couponId: string | undefined;

    if (dto.couponCode) {
      const result = await this.couponsService.validate(userId, dto.couponCode, subtotal);
      discountAmount = result.discountAmount;
      couponId = result.coupon.id;
    }

    const shippingAmount = 0;
    const taxAmount = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          couponId,
          shippingFullName: shippingAddress.fullName,
          shippingPhone: shippingAddress.phone,
          shippingLine1: shippingAddress.line1,
          shippingLine2: shippingAddress.line2,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingPostalCode: shippingAddress.postalCode,
          shippingCountry: shippingAddress.country,
          billingSameAsShipping: !dto.billingAddressId,
          billingFullName: billingAddress?.fullName,
          billingPhone: billingAddress?.phone,
          billingLine1: billingAddress?.line1,
          billingLine2: billingAddress?.line2,
          billingCity: billingAddress?.city,
          billingState: billingAddress?.state,
          billingPostalCode: billingAddress?.postalCode,
          billingCountry: billingAddress?.country,
          customerNote: dto.customerNote,
          items: {
            create: cart.items.map((item) => {
              const unitPrice = Number(item.variant.salePrice ?? item.variant.price);
              return {
                variantId: item.variantId,
                productName: item.variant.product.name,
                variantLabel: `${item.variant.volumeMl}ml`,
                sku: item.variant.sku,
                unitPrice,
                quantity: item.quantity,
                totalPrice: unitPrice * item.quantity,
              };
            }),
          },
          payments: {
            create: { provider: dto.paymentMethod, status: PaymentStatus.PENDING, amount: totalAmount },
          },
        },
        include: ORDER_INCLUDE,
      });

      for (const item of cart.items) {
        const resultingStock = item.variant.stock - item.quantity;
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: resultingStock } });
        await tx.stockLog.create({
          data: {
            variantId: item.variantId,
            changeType: StockChangeType.SALE,
            quantityChange: -item.quantity,
            resultingStock,
            reason: `Order ${created.orderNumber}`,
          },
        });
      }

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async findAllForUser(userId: string, query: QueryOrdersDto) {
    return this.paginate({ userId, ...(query.status ? { status: query.status } : {}) }, query);
  }

  async findOneForUser(userId: string, id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }
    return order;
  }

  async findAllAdmin(query: QueryOrdersDto) {
    return this.paginate(query.status ? { status: query.status } : {}, query);
  }

  async findOneAdmin(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    if (TERMINAL_STATUSES.includes(order.status) && order.status !== dto.status) {
      throw new BadRequestException(`Cannot change status of an order that is already ${order.status.toLowerCase()}`);
    }

    if (order.status === dto.status) {
      return this.findOneAdmin(id);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant) continue;
          const resultingStock = variant.stock + item.quantity;
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: resultingStock } });
          await tx.stockLog.create({
            data: {
              variantId: item.variantId,
              changeType: StockChangeType.RETURN,
              quantityChange: item.quantity,
              resultingStock,
              reason: `Order ${order.orderNumber} cancelled`,
            },
          });
        }
      }

      const paymentStatus =
        dto.status === OrderStatus.DELIVERED && order.paymentMethod === PaymentMethod.COD
          ? PaymentStatus.PAID
          : dto.status === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.PAID
            ? PaymentStatus.REFUNDED
            : order.paymentStatus;

      if (paymentStatus !== order.paymentStatus) {
        await tx.payment.updateMany({ where: { orderId: id }, data: { status: paymentStatus } });
      }

      await tx.order.update({ where: { id }, data: { status: dto.status, paymentStatus } });

      return tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE });
    });
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    await this.prisma.$transaction([
      this.prisma.order.update({ where: { id }, data: { paymentStatus: dto.status } }),
      this.prisma.payment.updateMany({ where: { orderId: id }, data: { status: dto.status } }),
    ]);

    return this.findOneAdmin(id);
  }

  async dispatch(id: string, dto: DispatchOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }
    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(`Cannot dispatch an order that is already ${order.status.toLowerCase()}`);
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        courierName: dto.courierName,
        trackingNumber: dto.trackingNumber,
        dispatchedAt: new Date(),
        status: OrderStatus.SHIPPED,
      },
    });

    return this.findOneAdmin(id);
  }

  async getStats() {
    const [statusCounts, salesAgg, totalOrders] = await Promise.all([
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.order.aggregate({ where: { paymentStatus: PaymentStatus.PAID }, _sum: { totalAmount: true } }),
      this.prisma.order.count(),
    ]);

    const countFor = (statuses: OrderStatus[]) =>
      statusCounts
        .filter((row) => statuses.includes(row.status))
        .reduce((sum, row) => sum + row._count._all, 0);

    return {
      totalSales: Number(salesAgg._sum.totalAmount ?? 0),
      totalOrders,
      incompleteOrders: countFor([OrderStatus.PENDING]),
      processingOrders: countFor([OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PACKED]),
      dispatchedOrders: countFor([OrderStatus.SHIPPED]),
      deliveredOrders: countFor([OrderStatus.DELIVERED]),
      returnedOrders: countFor([OrderStatus.RETURNED, OrderStatus.REFUNDED]),
      cancelledOrders: countFor([OrderStatus.CANCELLED]),
    };
  }

  private async paginate(where: Record<string, unknown>, query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `HP-${timestamp}-${random}`;
  }
}
