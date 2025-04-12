export interface ProductBriefRes {
  id: number;
  name: string;
  slug: string;
  price: number;
  discount?: number;
  sale_price?: number;
  brand: {
    id: number;
    name: string;
  };
  images: string[];
}
