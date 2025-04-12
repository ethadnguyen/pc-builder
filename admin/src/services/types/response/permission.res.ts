import { PaginationRes } from './pagination-res';

export interface PermissionRes {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionListRes extends PaginationRes {
  permissions: PermissionRes[];
}
