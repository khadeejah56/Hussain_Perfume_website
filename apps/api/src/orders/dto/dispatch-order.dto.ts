import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class DispatchOrderDto {
  @ApiProperty({ example: "Leopards Courier" })
  @IsString()
  @MinLength(1)
  courierName!: string;

  @ApiProperty({ example: "LC123456789" })
  @IsString()
  @MinLength(1)
  trackingNumber!: string;
}
