import { AddressResponse } from './address.res';
import { PaginationRes } from './pagination-res';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
}
export interface OrderItemResponse {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
    images?: string[];
    [key: string]: unknown;
  };
}

export interface OrderResponse {
  id: number;
  order_items: OrderItemResponse[];
  total_price: number;
  original_price: number;
  discount_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at: string;
  phone: string;
  created_at: string;
  updated_at: string;
  address: AddressResponse;
  user_id: number;
}

export interface OrderListResponse extends PaginationRes {
  orders: OrderResponse[];
}
