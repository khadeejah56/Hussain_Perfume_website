import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus, StockChangeType } from "@hussain/database";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";
import { ProductSortBy, type QueryProductDto } from "./dto/query-product.dto";
import type { CreateProductVariantDto } from "./dto/product-variant.dto";
import type { UpdateProductVariantDto } from "./dto/update-product-variant.dto";

const PRODUCT_INCLUDE = {
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { volumeMl: "asc" as const } },
  category: true,
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductDto, options: { isAdmin: boolean }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProductWhereInput = {};

    if (!options.isAdmin) {
      where.status = ProductStatus.PUBLISHED;
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }
    if (query.gender) {
      where.gender = query.gender;
    }
    if (query.concentration) {
      where.concentration = query.concentration;
    }
    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }
    if (query.isTrending !== undefined) {
      where.isTrending = query.isTrending;
    }
    if (query.isNewArrival !== undefined) {
      where.isNewArrival = query.isNewArrival;
    }
    if (query.isLimitedEdition !== undefined) {
      where.isLimitedEdition = query.isLimitedEdition;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            gte: query.minPrice,
            lte: query.maxPrice,
          },
        },
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sortBy === ProductSortBy.NAME_ASC
        ? { name: "asc" }
        : query.sortBy === ProductSortBy.NAME_DESC
          ? { name: "desc" }
          : { createdAt: "desc" };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findBySlug(slug: string, options: { isAdmin: boolean }) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });

    if (!product || (!options.isAdmin && product.status !== ProductStatus.PUBLISHED)) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.assertSlugAvailable(dto.slug);

    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          brand: dto.brand,
          description: dto.description,
          shortDescription: dto.shortDescription,
          gender: dto.gender,
          concentration: dto.concentration,
          topNotes: dto.topNotes ?? [],
          middleNotes: dto.middleNotes ?? [],
          baseNotes: dto.baseNotes ?? [],
          longevity: dto.longevity,
          projection: dto.projection,
          occasion: dto.occasion ?? [],
          season: dto.season ?? [],
          status: dto.status,
          isFeatured: dto.isFeatured,
          isTrending: dto.isTrending,
          isNewArrival: dto.isNewArrival,
          isLimitedEdition: dto.isLimitedEdition,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          categoryId: dto.categoryId,
          images: dto.images?.length ? { create: dto.images } : undefined,
          variants: { create: dto.variants },
        },
        include: PRODUCT_INCLUDE,
      });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
        include: PRODUCT_INCLUDE,
      });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.product.delete({ where: { id } });
  }

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    await this.findById(productId);

    try {
      return await this.prisma.productVariant.create({ data: { ...dto, productId } });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async updateVariant(variantId: string, dto: UpdateProductVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException(`Product variant with id "${variantId}" not found`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.productVariant.update({ where: { id: variantId }, data: dto });

        if (dto.stock !== undefined && dto.stock !== variant.stock) {
          await tx.stockLog.create({
            data: {
              variantId,
              changeType: StockChangeType.ADJUSTMENT,
              quantityChange: dto.stock - variant.stock,
              resultingStock: dto.stock,
              reason: "Manual stock adjustment via product update",
            },
          });
        }

        return updated;
      });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async removeVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundException(`Product variant with id "${variantId}" not found`);
    }
    await this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Product with slug "${slug}" already exists`);
    }
  }

  private mapKnownError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return new ConflictException(`A record with this ${target} already exists`);
    }
    return error;
  }
}
