export interface AddToWishlistInput {
  userId: string;
  productId: number;
}

export interface RemoveFromWishlistInput {
  userId: string;
  productId: number;
}

export interface CheckWishlistInput {
  userId: string;
  productId: number;
}
