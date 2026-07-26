import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CouponType, OrderStatus } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateCouponDto } from "./dto/create-coupon.dto";
import type { UpdateCouponDto } from "./dto/update-coupon.dto";

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }
    return coupon;
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Coupon with code "${dto.code}" already exists`);
    }
    return this.prisma.coupon.create({ data: dto });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findById(id);
    if (dto.code) {
      const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Coupon with code "${dto.code}" already exists`);
      }
    }
    return this.prisma.coupon.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.coupon.delete({ where: { id } });
  }

  async validate(userId: string, code: string, orderAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Coupon code is invalid");
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException("Coupon is not active yet");
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException("Coupon has expired");
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("Coupon usage limit has been reached");
    }
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
    }

    if (coupon.perCustomerLimit) {
      const timesUsed = await this.prisma.order.count({
        where: { userId, couponId: coupon.id, status: { not: OrderStatus.CANCELLED } },
      });
      if (timesUsed >= coupon.perCustomerLimit) {
        throw new BadRequestException("You have already used this coupon the maximum number of times");
      }
    }

    let discountAmount =
      coupon.type === CouponType.PERCENTAGE ? (orderAmount * Number(coupon.value)) / 100 : Number(coupon.value);

    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
    }
    discountAmount = Math.min(discountAmount, orderAmount);

    return { coupon, discountAmount: Math.round(discountAmount * 100) / 100 };
  }
}
