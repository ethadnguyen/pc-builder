import { get, post, del } from '../api_client';
import { AddToWishlistReq } from '../types/request/wishlist_types/wishlist.req';
import {
  WishlistCheckRes,
  WishlistItemRes,
  WishlistListRes,
} from '../types/response/wishlist_types/wishlist';

export const getUserWishlist = async (): Promise<WishlistListRes> => {
  const response = await get('/wishlist');
  return response.data;
};

export const addToWishlist = async (
  productId: number
): Promise<WishlistItemRes> => {
  const input: AddToWishlistReq = { productId };
  const response = await post('/wishlist', input);
  return response.data;
};

export const removeFromWishlist = async (productId: number): Promise<void> => {
  await del(`/wishlist/${productId}`);
};

export const checkInWishlist = async (
  productId: number
): Promise<WishlistCheckRes> => {
  const response = await get(`/wishlist/check/${productId}`);
  return response.data;
};
