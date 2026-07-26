import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@hussain/database";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ModerateReviewDto } from "./dto/moderate-review.dto";
import { QueryReviewsDto } from "./dto/query-reviews.dto";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get("product/:productId")
  findApprovedForProduct(@Param("productId") productId: string) {
    return this.reviewsService.findApprovedForProduct(productId);
  }

  @Get("me")
  findOwn(@CurrentUser() user: JwtPayload) {
    return this.reviewsService.findOwn(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get("admin")
  findAllAdmin(@Query() query: QueryReviewsDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch("admin/:id")
  moderate(@Param("id") id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderate(id, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(user.sub, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.reviewsService.remove(user.sub, id);
  }
}
