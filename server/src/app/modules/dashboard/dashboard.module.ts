import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OrderModule } from '../orders/order.module';
import { ProductModule } from '../products/products.module';
import { CategoryModule } from '../categories/categories.module';
import { PromotionModule } from '../promotions/promotion.module';

@Module({
  imports: [OrderModule, ProductModule, CategoryModule, PromotionModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
