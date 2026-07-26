import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { PaymentMethod } from "@hussain/database";

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  shippingAddressId!: string;

  @ApiProperty({ required: false, description: "Defaults to the shipping address when omitted" })
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerNote?: string;
}
