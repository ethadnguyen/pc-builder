import { AddressResponse } from './address.res';
import { PaginationRes } from './pagination-res';

export interface UserResponse {
  id: number;
  user_name: string;
  email: string;
  phone: string;
  address: AddressResponse;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse extends PaginationRes {
  users: UserResponse[];
}
