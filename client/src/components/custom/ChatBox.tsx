import React, { useState, useEffect, useRef } from 'react';
import { ChatInput } from './ChatInput';
import { ChatBubble } from './ChatBubble';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, X, MessageCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ChatMessage, RasaBotResponse } from '@/types/chat';
import { useUserStore } from '@/store/useUserStore';
import {
  sendMessageToRasa,
  chatHistoryStorage,
} from '@/services/modules/rasa.service';

export const ChatBox = () => {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedMessages = chatHistoryStorage.getHistory(
        user?.user_id?.toString() || 'anonymous'
      );
      if (storedMessages.length > 0) {
        const formattedMessages = storedMessages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));

        setMessages(formattedMessages);
      } else {
        addBotMessage('Xin chào! Tôi là bot trợ giúp. Bạn cần giúp gì?');
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử chat:', error);
      if (messages.length === 0) {
        addBotMessage('Xin chào! Tôi là bot trợ giúp. Bạn cần giúp gì?');
      }
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (messages.length > 0) {
      chatHistoryStorage.saveHistory(
        user?.user_id?.toString() || 'anonymous',
        messages
      );

      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && !isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isOpen, user?.user_id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const addMessage = (
    text: string,
    sender: 'user' | 'bot',
    imageUrl?: string,
    formattedText?: boolean
  ) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      sender,
      timestamp: new Date(),
      image: imageUrl,
      formattedText: formattedText,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const addBotMessage = (
    text: string,
    imageUrl?: string,
    formattedText?: boolean
  ) => {
    addMessage(text, 'bot', imageUrl, formattedText);
  };

  // Phân tích tin nhắn để tìm URL hình ảnh
  const parseMessageForImage = (
    text: string
  ): { text: string; imageUrl?: string; isFormatted: boolean } => {
    // Kiểm tra nếu tin nhắn có định dạng markdown
    const hasMarkdown =
      text.includes('**') ||
      text.includes('📌') ||
      text.includes('💰') ||
      text.includes('🏭');

    // Tìm URL hình ảnh trong tin nhắn (định dạng: [Text](URL))
    const imageRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const imageMatches = [...text.matchAll(imageRegex)];

    let processedText = text;
    let imageUrl: string | undefined;

    // Nếu có URL hình ảnh, trích xuất và chỉnh sửa văn bản
    if (imageMatches.length > 0) {
      for (const match of imageMatches) {
        const linkText = match[1];
        const url = match[2];
        // Nếu là hình ảnh (thường có "Xem hình" hoặc kết thúc bằng .jpg, .png, v.v.)
        if (
          linkText.includes('Xem hình') ||
          url.match(/\.(jpeg|jpg|gif|png)$/)
        ) {
          imageUrl = url;
          // Xóa phần liên kết hình ảnh khỏi văn bản
          processedText = processedText.replace(match[0], '');
        }
      }
    }

    return {
      text: processedText,
      imageUrl,
      isFormatted: hasMarkdown,
    };
  };

  const handleSendMessage = async (text: string) => {
    // Thêm tin nhắn của người dùng vào chat
    addMessage(text, 'user');

    // Gửi tin nhắn tới Rasa
    setIsLoading(true);
    try {
      const botResponses = await sendMessageToRasa(text);

      if (botResponses.length === 0) {
        // Không có phản hồi từ bot
        addBotMessage(
          'Xin lỗi, tôi không thể xử lý yêu cầu của bạn vào lúc này.'
        );
      } else {
        // Xử lý từng phản hồi từ bot
        botResponses.forEach((response: RasaBotResponse) => {
          if (response.text) {
            // Phân tích tin nhắn để tìm hình ảnh và kiểm tra định dạng
            const { text, imageUrl, isFormatted } = parseMessageForImage(
              response.text
            );
            addBotMessage(text, imageUrl, isFormatted);
          } else if (response.image) {
            // Nếu response có trường image riêng
            addBotMessage('', response.image, false);
          }
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn đến Rasa:', error);
      addBotMessage(
        'Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    chatHistoryStorage.clearHistory(user?.user_id?.toString() || 'anonymous');
    setMessages([]);
    addBotMessage('Xin chào! Tôi là bot trợ giúp. Bạn cần giúp gì?');
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={toggleChat}
        className='fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all z-50'
        aria-label='Mở chatbot'
      >
        <MessageCircle className='h-6 w-6' />
        {unreadCount > 0 && (
          <Badge className='absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0'>
            {unreadCount}
          </Badge>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className='fixed bottom-24 right-6 z-50 w-full max-w-[350px] sm:max-w-[400px] shadow-lg'>
          <div className='flex flex-col h-[500px] w-full border rounded-lg overflow-hidden bg-background animate-in slide-in-from-bottom-5 duration-300'>
            <div className='flex items-center justify-between p-3 border-b bg-primary/10'>
              <h2 className='font-semibold'>Bot Trợ Giúp</h2>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={clearChat}
                  className='h-8 w-8'
                >
                  <RefreshCw className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={toggleChat}
                  className='h-8 w-8'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto p-3'>
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className='flex justify-center py-2'>
                  <Loader2 className='h-6 w-6 animate-spin text-primary' />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      )}
    </>
  );
};
