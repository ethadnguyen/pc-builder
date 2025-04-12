import { CategoryRes } from '../category_types/category.res';
import { ProductRes } from '../product_types/product.res';

export interface PromotionRes {
  id: number;
  name: string;
  description: string;
  discount_value: number;
  discount_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  products: ProductRes[];
  categories: CategoryRes[];
  usage_count: number;
  usage_limit: number;
  minimum_order_amount: number;
  maximum_discount_amount: number;
  created_at: Date;
  updated_at: Date;
}
