import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { PaymentStatus } from '../../enums/payment-status.enum';

export class PaymentRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  status: PaymentStatus;

  @ApiProperty()
  payment_method: PaymentMethod;

  @ApiProperty()
  total_price: number;

  @ApiProperty()
  transaction_id: string;

  @ApiProperty()
  payment_details: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}
