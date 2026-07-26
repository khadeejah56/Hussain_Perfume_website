import { ConflictException, NotFoundException } from "@nestjs/common";
import { Concentration, Gender, ProductStatus, StockChangeType } from "@hussain/database";
import { ProductsService } from "./products.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProductSortBy } from "./dto/query-product.dto";

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: any;

  const product = {
    id: "product-1",
    slug: "hussain-oud-royale",
    status: ProductStatus.PUBLISHED,
  };

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productVariant: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      stockLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((arg: unknown) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        return (arg as (tx: unknown) => Promise<unknown>)(prisma);
      }),
    };

    service = new ProductsService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("forces PUBLISHED status for non-admin callers regardless of query.status", async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);
      prisma.product.count.mockResolvedValueOnce(0);

      await service.findAll({ status: ProductStatus.DRAFT, page: 1, limit: 20 } as any, { isAdmin: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ProductStatus.PUBLISHED }) }),
      );
    });

    it("lets admins filter by an explicit status", async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);
      prisma.product.count.mockResolvedValueOnce(0);

      await service.findAll({ status: ProductStatus.DRAFT, page: 1, limit: 20 } as any, { isAdmin: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ProductStatus.DRAFT }) }),
      );
    });

    it("computes pagination metadata", async () => {
      prisma.product.findMany.mockResolvedValueOnce([product]);
      prisma.product.count.mockResolvedValueOnce(45);

      const result = await service.findAll({ page: 2, limit: 20 } as any, { isAdmin: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 20 }));
      expect(result.meta).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
    });

    it("applies a price range filter across variants", async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);
      prisma.product.count.mockResolvedValueOnce(0);

      await service.findAll({ minPrice: 50, maxPrice: 150, page: 1, limit: 20 } as any, { isAdmin: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            variants: { some: { price: { gte: 50, lte: 150 } } },
          }),
        }),
      );
    });

    it("sorts by name when requested", async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);
      prisma.product.count.mockResolvedValueOnce(0);

      await service.findAll({ sortBy: ProductSortBy.NAME_ASC, page: 1, limit: 20 } as any, { isAdmin: false });

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { name: "asc" } }));
    });
  });

  describe("findBySlug", () => {
    it("returns a published product to a non-admin caller", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(product);

      await expect(service.findBySlug(product.slug, { isAdmin: false })).resolves.toBe(product);
    });

    it("hides a draft product from non-admin callers", async () => {
      prisma.product.findUnique.mockResolvedValueOnce({ ...product, status: ProductStatus.DRAFT });

      await expect(service.findBySlug(product.slug, { isAdmin: false })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("lets admins see a draft product", async () => {
      const draft = { ...product, status: ProductStatus.DRAFT };
      prisma.product.findUnique.mockResolvedValueOnce(draft);

      await expect(service.findBySlug(product.slug, { isAdmin: true })).resolves.toBe(draft);
    });

    it("throws 404 for a missing slug", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.findBySlug("missing", { isAdmin: true })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  const createDto = {
    name: "Oud Royale",
    slug: "hussain-oud-royale",
    description: "desc",
    gender: Gender.UNISEX,
    concentration: Concentration.EDP,
    variants: [{ sku: "SKU-1", volumeMl: 50, price: 89, stock: 10 }],
  };

  describe("create", () => {
    it("rejects a duplicate slug", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(product);

      await expect(service.create(createDto as any)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it("creates the product with nested variants", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);
      prisma.product.create.mockResolvedValueOnce(product);

      const result = await service.create(createDto as any);

      expect(result).toBe(product);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ variants: { create: createDto.variants } }),
        }),
      );
    });
  });

  describe("update", () => {
    it("throws 404 when the product doesn't exist", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.update("missing-id", { name: "x" } as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("rejects renaming the slug to one already in use by another product", async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce(product) // findById
        .mockResolvedValueOnce({ id: "other-product" }); // assertSlugAvailable

      await expect(service.update(product.id, { slug: "taken-slug" } as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("remove", () => {
    it("throws 404 when the product doesn't exist", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove("missing-id")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("deletes an existing product", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(product);
      prisma.product.delete.mockResolvedValueOnce(product);

      await service.remove(product.id);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: product.id } });
    });
  });

  describe("updateVariant", () => {
    const variant = { id: "variant-1", productId: product.id, stock: 10 };

    it("throws 404 for an unknown variant", async () => {
      prisma.productVariant.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateVariant("missing", { stock: 5 } as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("writes a stock log entry when stock changes", async () => {
      prisma.productVariant.findUnique.mockResolvedValueOnce(variant);
      prisma.productVariant.update.mockResolvedValueOnce({ ...variant, stock: 25 });

      await service.updateVariant(variant.id, { stock: 25 } as any);

      expect(prisma.stockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variantId: variant.id,
            changeType: StockChangeType.ADJUSTMENT,
            quantityChange: 15,
            resultingStock: 25,
          }),
        }),
      );
    });

    it("does not write a stock log entry when stock is unchanged", async () => {
      prisma.productVariant.findUnique.mockResolvedValueOnce(variant);
      prisma.productVariant.update.mockResolvedValueOnce(variant);

      await service.updateVariant(variant.id, { barcode: "123" } as any);

      expect(prisma.stockLog.create).not.toHaveBeenCalled();
    });
  });
});
