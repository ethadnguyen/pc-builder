import { ProductType } from '../../../types/response/product_types/product.res';

interface ComponentIdDto {
  product_id: number;
  product_type: ProductType;
}

export interface CreateConfigurationReq {
  name: string;
  description: string;
  component_ids: ComponentIdDto[];
  is_public: boolean;
}
