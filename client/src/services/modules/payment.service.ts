import { get, post, put, del } from '../api_client';
import {
  CreatePaymentReq,
  PaymentMethod,
  UpdatePaymentReq,
} from '../types/request/payment_types/payment.req';
import { PaymentRes } from '../types/response/payment_types/payment.res';

interface PaymentParams {
  page?: number;
  size?: number;
  status?: string;
  payment_method?: PaymentMethod;
  order_id?: number;
}

export const createPayment = async (
  data: CreatePaymentReq
): Promise<PaymentRes> => {
  const res = await post('/payments', data);
  return res.data;
};

export const getAllPayments = async (params: PaymentParams) => {
  const res = await get('/payments/all', params);
  return res.data;
};

export const getPaymentById = async (id: number): Promise<PaymentRes> => {
  const res = await get(`/payments/${id}`);
  return res.data;
};

export const updatePaymentStatus = async (data: UpdatePaymentReq) => {
  const res = await put('/payments/update', data);
  return res.data;
};

export const deletePayment = async (id: number): Promise<void> => {
  await del(`/payments/${id}`);
};

export const createVnpayPaymentUrl = async (
  paymentId: number,
  returnUrl?: string
): Promise<{ paymentUrl: string }> => {
  const res = await post(`/payments/${paymentId}/vnpay/create-payment`, {
    returnUrl,
  });
  return res.data;
};

// Truy vấn thông tin giao dịch VNPay
export const queryVnpayTransaction = async (
  paymentId: number
): Promise<Record<string, unknown>> => {
  const res = await post(`/payments/${paymentId}/vnpay/query`);
  return res.data;
};

// Hoàn tiền giao dịch VNPay
export const refundVnpayTransaction = async (
  paymentId: number,
  amount: number,
  user: string
): Promise<Record<string, unknown>> => {
  const res = await post(`/payments/${paymentId}/vnpay/refund`, {
    amount,
    user,
  });
  return res.data;
};

// Xử lý callback từ VNPay
export const processVnpayReturn = async (
  vnpParams: Record<string, string>
): Promise<PaymentRes> => {
  const queryString = new URLSearchParams(vnpParams).toString();
  const res = await get(`/payments/vnpay/return?${queryString}`);
  return res.data;
};
