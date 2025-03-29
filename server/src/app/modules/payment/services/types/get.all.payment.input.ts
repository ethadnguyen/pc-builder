import { PaginationInput } from 'src/common/types/pagination_types/pagination.input';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { PaymentStatus } from '../../enums/payment-status.enum';

export interface GetAllPaymentInput extends PaginationInput {
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  order_id?: number;
}
