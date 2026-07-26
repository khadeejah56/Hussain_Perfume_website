import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateSettingsDto } from "./dto/update-settings.dto";

const DEFAULTS: Record<string, string> = {
  shippingBannerText: "Complimentary shipping on all orders over Rs 15,000",
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteSetting.findMany();
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return { ...DEFAULTS, ...values };
  }

  async update(dto: UpdateSettingsDto): Promise<Record<string, string>> {
    const entries = Object.entries(dto).filter(([, value]) => value !== undefined) as [string, string][];

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
    );

    return this.getAll();
  }
}
