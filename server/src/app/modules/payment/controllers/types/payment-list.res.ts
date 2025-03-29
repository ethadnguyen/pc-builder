import { PaginationRes } from 'src/common/types/pagination_types/pagination.res';
import { PaymentRes } from './payment.res';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentListRes extends PaginationRes {
  @ApiProperty({ type: [PaymentRes] })
  @Type(() => PaymentRes)
  payments: PaymentRes[];
}
