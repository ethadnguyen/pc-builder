import { ProductType } from '../../../../services/types/response/product_types/product.res';
import { ProductRes } from '../product_types/product.res';

interface ComponentDTO {
  product_id: number;
  product_type: ProductType;
  product: ProductRes;
}

interface CompatibilityResult {
  messages: string[];
  isCompatible: boolean;
}

interface UserDTO {
  user_id: string;
  user_name: string;
  email: string;
  password: string;
  phone: string;
  avatar: string | null;
  provider: string | null;
  provider_id: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationRes {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  user_id: string;
  component_ids: ComponentDTO[];
  compatibility_result: CompatibilityResult;
  total_price: number;
  created_at: string;
  updated_at: string;
  user: UserDTO;
}
