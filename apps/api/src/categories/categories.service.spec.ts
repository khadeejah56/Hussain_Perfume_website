import { ConflictException, NotFoundException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { PrismaService } from "../prisma/prisma.service";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let prisma: any;

  const category = { id: "cat-1", slug: "men", name: "Men", isActive: true };

  beforeEach(() => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new CategoriesService(prisma as unknown as PrismaService);
  });

  it("only returns active categories by default", async () => {
    prisma.category.findMany.mockResolvedValueOnce([category]);

    await service.findAll();

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it("includes inactive categories when explicitly requested", async () => {
    prisma.category.findMany.mockResolvedValueOnce([category]);

    await service.findAll({ includeInactive: true });

    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });

  it("throws 404 for an unknown slug", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);

    await expect(service.findBySlug("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects creating a category with a duplicate slug", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(category);

    await expect(service.create({ name: "Men", slug: "men" } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("creates a category with a unique slug", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);
    prisma.category.create.mockResolvedValueOnce(category);

    await expect(service.create({ name: "Men", slug: "men" } as any)).resolves.toBe(category);
  });

  it("rejects updating to a slug already used by another category", async () => {
    prisma.category.findUnique
      .mockResolvedValueOnce(category) // findById
      .mockResolvedValueOnce({ id: "other-cat", slug: "women" }); // slug check

    await expect(service.update(category.id, { slug: "women" } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("deletes an existing category", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(category);
    prisma.category.delete.mockResolvedValueOnce(category);

    await service.remove(category.id);

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: category.id } });
  });
});
