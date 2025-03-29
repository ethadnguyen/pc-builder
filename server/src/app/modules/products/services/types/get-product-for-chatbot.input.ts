import { PaginationInput } from 'src/common/types/pagination_types/pagination.input';

export interface GetProductsForChatbotInput extends PaginationInput {
  name?: string;
  description?: string;
  min_price?: number;
  max_price?: number;
  is_sale?: boolean;
  brand?: string;
  category?: string;
}
