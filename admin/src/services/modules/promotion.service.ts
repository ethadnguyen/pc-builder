import { del, get, post, put } from '../api_client';
import { PromotionRes } from '../types/response/promotion-res';

interface PromotionParams {
  page?: number;
  size?: number;
  search?: string;
  product_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  discount_type?: string;
}

export const fetchAllPromotions = (params?: PromotionParams) => {
  return get('/promotions/all', params);
};

export const fetchPromotionById = (id: number) => {
  return get(`/promotions/${id}`);
};

export const createPromotion = (data: Partial<PromotionRes>) => {
  return post('/promotions', data);
};

export const updatePromotion = (data: Partial<PromotionRes>) => {
  return put(`/promotions/update`, data);
};

export const deletePromotion = (id: number) => {
  return del(`/promotions/${id}`);
};

export const checkExpiringPromotions = () => {
  return get('/promotions/check-expiring');
};
