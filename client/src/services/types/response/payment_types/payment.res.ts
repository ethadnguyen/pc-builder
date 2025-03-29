export interface PaymentRes {
  id: number;
  quantity: number;
  status: string;
  payment_method: string;
  total_price: number;
  transaction_id: string;
  order_id: number;
  payment_details: string;
  created_at: string;
  updated_at: string;
}
