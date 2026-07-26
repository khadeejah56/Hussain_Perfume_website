import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import type { AddCartItemDto } from "./dto/add-cart-item.dto";
import type { UpdateCartItemDto } from "./dto/update-cart-item.dto";

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { position: "asc" as const }, take: 1 } },
          },
        },
      },
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: CART_INCLUDE,
    });
    return this.withTotals(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant || !variant.isActive) {
      throw new NotFoundException(`Product variant with id "${dto.variantId}" not found`);
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });
    const desiredQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

    if (desiredQuantity > variant.stock) {
      throw new BadRequestException(`Only ${variant.stock} unit(s) of this item are in stock`);
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
      create: { cartId: cart.id, variantId: dto.variantId, quantity: desiredQuantity },
      update: { quantity: desiredQuantity },
    });

    return this.getOrCreateCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.findOwnedItem(userId, itemId);

    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException(`Only ${item.variant.stock} unit(s) of this item are in stock`);
    }

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    return this.getOrCreateCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    await this.findOwnedItem(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return this.getOrCreateCart(userId);
  }

  private async findOwnedItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, variant: true },
    });
    if (!item) {
      throw new NotFoundException(`Cart item with id "${itemId}" not found`);
    }
    if (item.cart.userId !== userId) {
      throw new ForbiddenException("You do not have access to this cart item");
    }
    return item;
  }

  private withTotals<T extends { items: Array<{ quantity: number; variant: { price: Prisma.Decimal; salePrice: Prisma.Decimal | null } }> }>(
    cart: T,
  ) {
    const subtotal = cart.items.reduce((sum, item) => {
      const unitPrice = item.variant.salePrice ?? item.variant.price;
      return sum + Number(unitPrice) * item.quantity;
    }, 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return { ...cart, subtotal, itemCount };
  }
}
