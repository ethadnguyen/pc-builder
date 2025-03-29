import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentRepository } from './repositories/payment.repositories';
import { PaymentService } from './services/payment.service';
import { VnpayService } from './services/vnpay.service';
import { PaymentController } from './controllers/payment.controller';
import { ConfigModule } from '@nestjs/config';
import vnpayConfig from 'src/config/vnpay/vnpay.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ConfigModule.forFeature(vnpayConfig),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, VnpayService, PaymentRepository],
  exports: [PaymentService, VnpayService, PaymentRepository],
})
export class PaymentModule {}
