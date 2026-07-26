import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { volumeMl: "asc" } } },
        },
      },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      throw new NotFoundException(`Product with id "${productId}" not found`);
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      throw new ConflictException("Product is already in your wishlist");
    }

    return this.prisma.wishlistItem.create({ data: { userId, productId } });
  }

  async remove(userId: string, productId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) {
      throw new NotFoundException("Product is not in your wishlist");
    }
    await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
  }
}
