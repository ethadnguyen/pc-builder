import { get, post, put, del } from '../api_client';
import { RoleRes } from '../types/response/role.res';

export const getAllRoles = async (params: {
  page?: number;
  size?: number;
  search?: string;
}) => {
  return await get('/role/all', params);
};

export const getRoleByName = async (name: string): Promise<RoleRes> => {
  const response = await get(`/role/${name}`);
  return response.data;
};

export const createRole = async (data: {
  name: string;
  description: string;
  permission_ids: number[];
}): Promise<RoleRes> => {
  const response = await post('/role', data);
  return response.data;
};

export const updateRole = async (data: {
  name: string;
  description: string;
  permission_ids: number[];
}) => {
  return await put('/role/update', data);
};

export const deleteRole = async (name: string): Promise<void> => {
  await del(`/role/${name}`);
};
