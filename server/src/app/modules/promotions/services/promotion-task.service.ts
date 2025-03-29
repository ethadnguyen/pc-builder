import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PromotionService } from './promotion.service';

@Injectable()
export class PromotionTaskService {
  private readonly logger = new Logger(PromotionTaskService.name);

  constructor(private readonly promotionService: PromotionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleCheckExpiringPromotions() {
    this.logger.log('Đang kiểm tra khuyến mãi sắp hết hạn...');
    try {
      const result = await this.promotionService.checkExpiringPromotions();
      if (result.success) {
        if (result.count > 0) {
          this.logger.log(
            `Đã gửi thông báo cho ${result.count} khuyến mãi sắp hết hạn`,
          );
        } else {
          this.logger.log('Không có khuyến mãi nào sắp hết hạn');
        }
      } else {
        this.logger.error(`Lỗi khi kiểm tra khuyến mãi: ${result.message}`);
      }
    } catch (error) {
      this.logger.error(
        'Lỗi khi thực hiện kiểm tra khuyến mãi sắp hết hạn',
        error.stack,
      );
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyPromotionCheck() {
    this.logger.log('Đang thực hiện kiểm tra khuyến mãi hàng tháng...');
    try {
      await this.handleCheckExpiringPromotions();
    } catch (error) {
      this.logger.error(
        'Lỗi khi thực hiện kiểm tra khuyến mãi hàng tháng',
        error.stack,
      );
    }
  }
}
