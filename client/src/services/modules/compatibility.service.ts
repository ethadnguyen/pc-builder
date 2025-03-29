import { post } from '../api_client';
import { CompatibilityRequest } from '../types/request/compatibility_types/compatibility.req';
import type {
  CompatibilityMessage,
  CompatibilityResponse,
} from '../types/response/compatibility_types/compatibility.res';

export const compatibilityService = {
  checkCompatibility: async (
    request: CompatibilityRequest
  ): Promise<CompatibilityResponse> => {
    const response = await post('/compatibility/check', request);

    // Biến đổi các message từ server thành object có type và text
    const transformedMessages: CompatibilityMessage[] =
      response.data.messages.map((message: string) => {
        if (message.startsWith('LỖI:')) {
          return {
            type: 'error',
            text: message.substring(5).trim(),
          };
        } else if (message.startsWith('CẢNH BÁO:')) {
          return {
            type: 'warning',
            text: message.substring(10).trim(),
          };
        } else if (message.startsWith('THÔNG TIN:')) {
          return {
            type: 'info',
            text: message.substring(11).trim(),
          };
        } else {
          // Mặc định coi là info nếu không có tiền tố
          return {
            type: 'info',
            text: message,
          };
        }
      });

    return {
      isCompatible: response.data.isCompatible,
      messages: transformedMessages,
    };
  },
};
