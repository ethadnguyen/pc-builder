import { PromotionRes } from '../promotion_types/promotion.res';

export interface CartRes {
  items: CartItemRes[];
  total: number;
  item_count: number;
}

export interface CartItemRes {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
    slug: string;
    images: string[];
    is_sale?: boolean;
    sale_price?: number;
    promotions?: PromotionRes[];
  };
}
