import { ChatMessage } from '@/types/chat';

const RASA_URL = 'http://localhost:5005';

export const sendMessageToRasa = async (
  message: string,
  sender: string = 'user'
) => {
  try {
    const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Không thể kết nối đến Rasa server');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn đến Rasa:', error);
    throw error;
  }
};

const getStorageKey = (userId: string) => `rasaChatHistory_${userId}`;

export const chatHistoryStorage = {
  getHistory: (userId: string): ChatMessage[] => {
    if (typeof window !== 'undefined') {
      try {
        const history = localStorage.getItem(getStorageKey(userId));
        if (history) {
          const parsedHistory = JSON.parse(history);
          if (Array.isArray(parsedHistory)) {
            return parsedHistory;
          }
        }
      } catch (error) {
        console.error('Lỗi khi đọc lịch sử chat:', error);
      }
    }
    return [];
  },

  saveHistory: (userId: string, messages: ChatMessage[]): void => {
    if (typeof window !== 'undefined') {
      try {
        const limitedMessages = messages.slice(-50);
        localStorage.setItem(
          getStorageKey(userId),
          JSON.stringify(limitedMessages)
        );
      } catch (error) {
        console.error('Lỗi khi lưu lịch sử chat:', error);
      }
    }
  },

  clearHistory: (userId: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey(userId));
    }
  },
};
