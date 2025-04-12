import { PermissionRes } from './permission.res';
import { RoleRes } from './role.res';

export interface AdminUserRes {
  id: number;
  user_name: string;
  email: string;
  password?: string;
  role: RoleRes;
  permissions: PermissionRes[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginRes {
  access_token: string;
  refresh_token: string;
  user: AdminUserRes;
}
