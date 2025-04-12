import { PaginationRes } from './pagination-res';
import { PermissionRes } from './permission.res';

export interface RoleRes {
  name: string;
  description: string;
  permissions: PermissionRes[];
  created_at: Date;
  updated_at: Date;
}

export interface RoleListRes extends PaginationRes {
  roles: RoleRes[];
}
