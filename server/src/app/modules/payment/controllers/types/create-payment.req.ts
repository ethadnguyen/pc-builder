import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { PaymentStatus } from '../../enums/payment-status.enum';

export class CreatePaymentReq {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  order_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  total_price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  transaction_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  payment_details?: string;
}
