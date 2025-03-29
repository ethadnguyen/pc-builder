import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessage } from '@/types/chat';
import { Bot, User } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
}

// Hàm chuyển đổi markdown đơn giản sang JSX
const formatMessageText = (text: string) => {
  if (!text) return null;

  // Chuyển đổi các ký tự emoji để hiển thị đúng
  const formattedText = text
    // Thay thế bold markdown (**text**) với các thẻ strong
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

  // Chuyển đổi các dòng thành đoạn văn
  return (
    <>
      {formattedText.map((part, index) => {
        if (React.isValidElement(part)) {
          return part;
        }

        // Xử lý xuống dòng
        const lines = String(part).split('\n');
        return lines.map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const hasImage = !!message.image;
  const isFormattedText = message.formattedText;

  return (
    <div
      className={cn(
        'flex w-full items-start gap-2 py-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className='h-8 w-8'>
          <AvatarFallback className='bg-primary text-white'>
            <Bot className='h-4 w-4' />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'rounded-lg px-4 py-2 flex flex-col',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
          hasImage ? 'max-w-[85%]' : 'max-w-[80%]',
          isFormattedText && 'space-y-1.5'
        )}
      >
        {/* Nội dung tin nhắn */}
        <div
          className={cn('text-sm', isFormattedText && 'whitespace-pre-line')}
        >
          {isFormattedText ? formatMessageText(message.text) : message.text}
        </div>

        {/* Hiển thị hình ảnh nếu có */}
        {hasImage && (
          <div className='mt-2 rounded-md overflow-hidden'>
            <a
              href={message.image}
              target='_blank'
              rel='noopener noreferrer'
              className='block'
            >
              <img
                src={message.image}
                alt='Hình ảnh sản phẩm'
                className='w-full h-auto max-h-48 object-contain bg-white'
              />
            </a>
          </div>
        )}

        {/* Thời gian gửi tin nhắn */}
        <div className='text-xs opacity-50 mt-1'>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {isUser && (
        <Avatar className='h-8 w-8'>
          <AvatarFallback className='bg-secondary text-secondary-foreground'>
            <User className='h-4 w-4' />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
