import { get } from '../api_client';

export const getUserById = async (id: number) => {
  const response = await get(`/user/${id}`);
  return response.data;
};
