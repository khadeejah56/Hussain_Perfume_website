import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@hussain/database";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdatePaymentStatusDto } from "./dto/update-payment-status.dto";
import { DispatchOrderDto } from "./dto/dispatch-order.dto";
import { QueryOrdersDto } from "./dto/query-orders.dto";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.checkout(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAllForUser(user.sub, query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get("admin")
  findAllAdmin(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get("admin/stats")
  getStats() {
    return this.ordersService.getStats();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get("admin/:id")
  findOneAdmin(@Param("id") id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch("admin/:id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch("admin/:id/payment")
  updatePaymentStatus(@Param("id") id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.ordersService.updatePaymentStatus(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch("admin/:id/dispatch")
  dispatch(@Param("id") id: string, @Body() dto: DispatchOrderDto) {
    return this.ordersService.dispatch(id, dto);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ordersService.findOneForUser(user.sub, id);
  }
}
