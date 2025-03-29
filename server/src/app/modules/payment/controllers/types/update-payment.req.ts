import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { PaymentStatus } from '../../enums/payment-status.enum';

export class UpdatePaymentReq {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  payment_details?: string;
}
