import { PrismaClient, Role, Gender, Concentration, ProductStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "hussainirshad5432@gmail.com" },
    update: {},
    create: {
      email: "hussainirshad5432@gmail.com",
      passwordHash: adminPasswordHash,
      firstName: "Hussain",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  const menCategory = await prisma.category.upsert({
    where: { slug: "men" },
    update: {},
    create: { name: "Men", slug: "men", description: "Fragrances for men" },
  });

  const womenCategory = await prisma.category.upsert({
    where: { slug: "women" },
    update: {},
    create: { name: "Women", slug: "women", description: "Fragrances for women" },
  });

  const product = await prisma.product.upsert({
    where: { slug: "hussain-oud-royale" },
    update: {},
    create: {
      name: "Oud Royale",
      slug: "hussain-oud-royale",
      brand: "Hussain",
      description:
        "A regal oud composition blending smoky agarwood, rich amber and a whisper of rose, crafted for those who command attention.",
      shortDescription: "Regal oud with amber and rose.",
      gender: Gender.UNISEX,
      concentration: Concentration.EDP,
      topNotes: ["Saffron", "Bergamot"],
      middleNotes: ["Rose", "Oud"],
      baseNotes: ["Amber", "Musk", "Sandalwood"],
      longevity: "8-10 hours",
      projection: "Strong",
      occasion: ["Evening", "Special Occasion"],
      season: ["Fall", "Winter"],
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      isNewArrival: true,
      categoryId: menCategory.id,
      images: {
        create: [{ url: "https://placehold.co/800x800.png?text=Oud+Royale", position: 0 }],
      },
      variants: {
        create: [
          { sku: "HUS-OUDR-50", volumeMl: 50, price: 24900, stock: 25 },
          { sku: "HUS-OUDR-100", volumeMl: 100, price: 41900, stock: 15 },
        ],
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "shippingBannerText" },
    update: {},
    create: { key: "shippingBannerText", value: "Complimentary shipping on all orders over Rs 15,000" },
  });

  console.log({ admin: admin.email, categories: [menCategory.slug, womenCategory.slug], product: product.slug });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
