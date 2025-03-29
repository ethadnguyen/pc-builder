import { PaginationReq } from 'src/common/types/pagination_types/pagination.req';
import { PaymentStatus } from '../../enums/payment-status.enum';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { IsEnum, IsNumber } from 'class-validator';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAllPaymentReq extends PaginationReq {
  @ApiProperty()
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty()
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  order_id?: number;
}
