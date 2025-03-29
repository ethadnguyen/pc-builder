import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex items-center gap-2 p-2 border-t'
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder='Nhập tin nhắn của bạn...'
        disabled={disabled}
        className='flex-1'
      />
      <Button type='submit' size='icon' disabled={disabled || !message.trim()}>
        <Send className='h-4 w-4' />
      </Button>
    </form>
  );
};
