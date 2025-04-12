import { get, post, put, del } from '../api_client';
import {
  PermissionListRes,
  PermissionRes,
} from '../types/response/permission.res';

export const getAllPermissions = async (params: {
  page?: number;
  size?: number;
  search?: string;
}): Promise<PermissionListRes> => {
  const response = await get('/permission/all', params);
  return response.data;
};

export const getPermissionById = async (id: number): Promise<PermissionRes> => {
  const response = await get(`/permission/${id}`);
  return response.data;
};

export const createPermission = async (data: {
  name: string;
  description: string;
}): Promise<PermissionRes> => {
  const response = await post('/permission', data);
  return response.data;
};

export const updatePermission = async (data: {
  id: number;
  name: string;
  description: string;
}): Promise<PermissionRes> => {
  const response = await put('/permission/update', data);
  return response.data;
};

export const deletePermission = async (id: number): Promise<void> => {
  await del(`/permission/${id}`);
};
