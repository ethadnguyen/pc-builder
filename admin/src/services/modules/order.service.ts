import { get, put } from '../api_client';
import { UpdateOrderReq } from '../types/request/order.req';

interface GetOrdersParams {
  page?: number;
  size?: number;
  user_id?: number;
}

export const updateOrder = async (data: UpdateOrderReq) => {
  const response = await put(`/orders/update`, data);
  return response.data;
};

export const getAllOrders = async (params: GetOrdersParams) => {
  const response = await get(`/orders/all`, params);
  return response.data;
};

export const getOrderById = async (id: number) => {
  const response = await get(`/orders/${id}`);
  return response.data;
};
