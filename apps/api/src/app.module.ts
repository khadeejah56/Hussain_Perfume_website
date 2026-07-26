import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { UsersModule } from "./users/users.module";
import { AddressesModule } from "./addresses/addresses.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { CartModule } from "./cart/cart.module";
import { CouponsModule } from "./coupons/coupons.module";
import { OrdersModule } from "./orders/orders.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { UploadsModule } from "./uploads/uploads.module";
import { SettingsModule } from "./settings/settings.module";
import { HealthController } from "./health/health.controller";

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    UsersModule,
    AddressesModule,
    WishlistModule,
    CartModule,
    CouponsModule,
    OrdersModule,
    ReviewsModule,
    UploadsModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
