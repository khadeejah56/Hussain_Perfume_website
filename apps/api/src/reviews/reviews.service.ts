import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, ReviewStatus } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateReviewDto } from "./dto/create-review.dto";
import type { UpdateReviewDto } from "./dto/update-review.dto";
import type { ModerateReviewDto } from "./dto/moderate-review.dto";
import type { QueryReviewsDto } from "./dto/query-reviews.dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedForProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async findOwn(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, select: { id: true } });
    if (!product) {
      throw new NotFoundException(`Product with id "${dto.productId}" not found`);
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });
    if (existing) {
      throw new ConflictException("You have already reviewed this product");
    }

    const isVerified = await this.hasVerifiedPurchase(userId, dto.productId);

    return this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        images: dto.images ?? [],
        isVerified,
        status: ReviewStatus.PENDING,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.findOwnedOrThrow(userId, id);

    return this.prisma.review.update({
      where: { id: review.id },
      data: { ...dto, status: ReviewStatus.PENDING, adminReply: null },
    });
  }

  async remove(userId: string, id: string) {
    const review = await this.findOwnedOrThrow(userId, id);
    await this.prisma.review.delete({ where: { id: review.id } });
  }

  async findAllAdmin(query: QueryReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async moderate(id: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    return this.prisma.review.update({
      where: { id },
      data: { status: dto.status, adminReply: dto.adminReply },
    });
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }
    if (review.userId !== userId) {
      throw new ForbiddenException("You do not have access to this review");
    }
    return review;
  }

  private async hasVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        order: { userId, status: OrderStatus.DELIVERED },
        variant: { productId },
      },
    });
    return orderItem !== null;
  }
}
