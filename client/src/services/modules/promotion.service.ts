import { get } from '../api_client';

export interface PromotionParams {
  page?: number;
  size?: number;
}

export const getPromotionById = async (id: number) => {
  const response = await get(`/promotions/${id}`);
  return response.data;
};

export const getAllPromotions = async (params: PromotionParams) => {
  const response = await get('/promotions/all', { params });
  return response.data;
};
