import { PaymentMethod } from '../../enums/payment-method.enum';
import { PaymentStatus } from '../../enums/payment-status.enum';

export interface CreatePaymentInput {
  quantity: number;
  total_price: number;
  order_id: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  payment_details?: string;
}
