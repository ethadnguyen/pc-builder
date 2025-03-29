import { ProductType } from 'src/app/modules/products/enums/product-type.enum';

export interface ComponentIdInput {
  product_id: number;
  product_type: ProductType;
}

export interface CreateConfigurationInput {
  user_id: number;
  name: string;
  description?: string;
  component_ids: ComponentIdInput[];
  is_public?: boolean;
}
