export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
  formattedText?: boolean;
}

export interface RasaBotResponse {
  recipient_id: string;
  text?: string;
  image?: string;
  buttons?: {
    title: string;
    payload: string;
  }[];
  custom?: Record<string, unknown>;
}
