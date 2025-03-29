import { PaymentStatus } from '../../enums/payment-status.enum';

export interface UpdatePaymentInput {
  id: number;
  status: PaymentStatus;
  payment_details?: string;
}
