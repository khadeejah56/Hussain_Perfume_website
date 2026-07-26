import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class CreateProductImageDto {
  @ApiProperty({ example: "https://res.cloudinary.com/demo/image/upload/oud-royale.jpg" })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
