import { PartialType } from "@nestjs/swagger";
import { CreateProductVariantDto } from "./product-variant.dto";

export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {}
