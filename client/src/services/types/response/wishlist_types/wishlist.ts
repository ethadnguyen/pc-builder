import { ProductBriefRes } from '../product_types/product_brief';

export interface WishlistItemRes {
  id: number;
  userId: string;
  productId: number;
  product: ProductBriefRes;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistListRes {
  items: WishlistItemRes[];
}

export interface WishlistCheckRes {
  inWishlist: boolean;
}
