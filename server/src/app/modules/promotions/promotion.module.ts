import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { PromotionService } from './services/promotion.service';
import { PromotionRepository } from './repositories/promotion.repositories';
import { ProductModule } from '../products/products.module';
import { CategoryModule } from '../categories/categories.module';
import { PromotionController } from './controllers/promotion.controller';
import { PromotionTaskService } from './services/promotion-task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion]),
    forwardRef(() => ProductModule),
    CategoryModule,
  ],
  controllers: [PromotionController],
  providers: [PromotionRepository, PromotionService, PromotionTaskService],
  exports: [PromotionRepository, PromotionService],
})
export class PromotionModule {}
