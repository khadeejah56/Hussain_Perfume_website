import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { WishlistService } from "./wishlist.service";

@ApiTags("wishlist")
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.findAll(user.sub);
  }

  @Post(":productId")
  add(@CurrentUser() user: JwtPayload, @Param("productId") productId: string) {
    return this.wishlistService.add(user.sub, productId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":productId")
  remove(@CurrentUser() user: JwtPayload, @Param("productId") productId: string) {
    return this.wishlistService.remove(user.sub, productId);
  }
}
