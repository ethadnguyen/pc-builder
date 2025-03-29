import { del, get, post, put } from '../api_client';
import { ConfigurationRes } from '../types/response/configuration_types/configuration.res';
import { CreateConfigurationReq } from '../types/request/configuration_types/create-configuration.req';
import { UpdateConfigurationReq } from '../types/request/configuration_types/update-configuration.req';
import { ConfigurationListRes } from '../types/response/configuration_types/configuration-list.res';

interface ConfigurationQueryParams {
  page?: number;
  size?: number;
}

export const configurationService = {
  getUserConfigurations: async (
    params: ConfigurationQueryParams = { page: 1, size: 10 }
  ): Promise<ConfigurationListRes> => {
    const { page = 1, size = 10 } = params;
    const response = await get('/configurations', { params: { page, size } });
    return response.data;
  },

  getPublicConfigurations: async (
    params: ConfigurationQueryParams = { page: 1, size: 10 }
  ): Promise<ConfigurationListRes> => {
    const { page = 1, size = 10 } = params;
    const response = await get('/configurations/public', {
      params: { page, size },
    });
    return response.data;
  },

  getConfigurationById: async (id: number): Promise<ConfigurationRes> => {
    const response = await get(`/configurations/${id}`);
    return response.data;
  },

  createConfiguration: async (
    data: CreateConfigurationReq
  ): Promise<ConfigurationRes> => {
    const response = await post('/configurations', data);
    return response.data;
  },

  updateConfiguration: async (
    data: UpdateConfigurationReq
  ): Promise<ConfigurationRes> => {
    const response = await put('/configurations/update', data);
    return response.data;
  },

  deleteConfiguration: async (id: number): Promise<void> => {
    await del(`/configurations/${id}`);
  },

  moveToCart: async (id: number): Promise<void> => {
    await post(`/configurations/${id}/move-to-cart`);
  },
};
