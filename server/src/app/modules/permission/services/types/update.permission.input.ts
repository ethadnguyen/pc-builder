import { CreatePermissionInput } from './create.permission.input';

export interface UpdatePermissionInput extends Partial<CreatePermissionInput> {
  id: number;
}
