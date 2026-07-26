import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@ApiTags("cart")
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getOrCreateCart(user.sub);
  }

  @Post("items")
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch("items/:itemId")
  updateItem(@CurrentUser() user: JwtPayload, @Param("itemId") itemId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(user.sub, itemId, dto);
  }

  @Delete("items/:itemId")
  removeItem(@CurrentUser() user: JwtPayload, @Param("itemId") itemId: string) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  @Delete()
  clear(@CurrentUser() user: JwtPayload) {
    return this.cartService.clear(user.sub);
  }
}
