import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSettingsDto {
  @ApiProperty({ required: false, example: "Complimentary shipping on all orders over Rs 15,000" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shippingBannerText?: string;
}
