'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import {
  useNotification,
  Notification,
  OrderNotification,
  PromotionNotification,
} from '@/hooks/use-notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const OrderNotificationItem = ({
  notification,
  onRead,
}: {
  notification: OrderNotification;
  onRead: () => void;
}) => {
  return (
    <Link
      href={`/orders`}
      onClick={onRead}
      className={`
        flex flex-col gap-1 p-3 text-sm border-b 
        ${notification.read ? 'bg-white' : 'bg-muted'}
        hover:bg-gray-50 transition-colors
      `}
    >
      <div className='font-medium'>
        {notification.read ? (
          <span>Đơn hàng mới - SĐT: {notification.contactPhone}</span>
        ) : (
          <div className='flex items-center gap-2'>
            <span>Đơn hàng mới - SĐT: {notification.contactPhone}</span>
            <Badge variant='default' className='px-1 h-5 bg-primary'>
              Mới
            </Badge>
          </div>
        )}
      </div>
      {notification.customerName && (
        <div className='text-muted-foreground'>
          Khách hàng: {notification.customerName}
        </div>
      )}
      {notification.customerEmail && (
        <div className='text-muted-foreground text-xs'>
          Email: {notification.customerEmail}
        </div>
      )}
      {notification.orderTotal && (
        <div className='text-muted-foreground'>
          Tổng giá trị: {notification.orderTotal.toLocaleString()}đ
        </div>
      )}
      <div className='text-xs text-muted-foreground'>
        {formatDistanceToNow(new Date(notification.time), {
          addSuffix: true,
          locale: vi,
        })}
      </div>
    </Link>
  );
};

const PromotionNotificationItem = ({
  notification,
  onRead,
}: {
  notification: PromotionNotification;
  onRead: () => void;
}) => {
  return (
    <Link
      href={`/promotions`}
      onClick={onRead}
      className={`
        flex flex-col gap-1 p-3 text-sm border-b 
        ${notification.read ? 'bg-white' : 'bg-muted'}
        hover:bg-gray-50 transition-colors
      `}
    >
      <div className='font-medium'>
        {notification.read ? (
          <span>Khuyến mãi sắp hết hạn</span>
        ) : (
          <div className='flex items-center gap-2'>
            <span>Khuyến mãi sắp hết hạn</span>
            <Badge variant='destructive' className='px-1 h-5'>
              Cảnh báo
            </Badge>
          </div>
        )}
      </div>

      <div className='text-muted-foreground'>
        {notification.promotions.length} khuyến mãi sắp hết hạn
      </div>

      <div className='space-y-1 mt-1'>
        {notification.promotions.slice(0, 2).map((promo) => (
          <div key={promo.id} className='text-xs bg-muted p-1 rounded'>
            <div className='font-medium'>
              {promo.name} ({promo.code})
            </div>
            <div>
              Còn {promo.daysRemaining} ngày (
              {new Date(promo.expiryDate).toLocaleDateString('vi-VN')})
            </div>
          </div>
        ))}
        {notification.promotions.length > 2 && (
          <div className='text-xs text-muted-foreground'>
            và {notification.promotions.length - 2} khuyến mãi khác...
          </div>
        )}
      </div>

      <div className='text-xs text-muted-foreground mt-1'>
        {formatDistanceToNow(new Date(notification.time), {
          addSuffix: true,
          locale: vi,
        })}
      </div>
    </Link>
  );
};

const NotificationItem = ({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) => {
  if (notification.type === 'order') {
    return (
      <OrderNotificationItem notification={notification} onRead={onRead} />
    );
  } else if (notification.type === 'promotion') {
    return (
      <PromotionNotificationItem notification={notification} onRead={onRead} />
    );
  }
  return null;
};

export const NotificationPopover = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotification();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 px-1.5 h-5 min-w-5 flex items-center justify-center'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='flex items-center justify-between p-3 border-b'>
          <h4 className='font-medium'>Thông báo</h4>
          {unreadCount > 0 && (
            <Button variant='ghost' size='sm' onClick={markAllAsRead}>
              Đánh dấu đã đọc tất cả
            </Button>
          )}
        </div>
        <ScrollArea className='h-[400px]'>
          {notifications.length === 0 ? (
            <div className='flex items-center justify-center h-full p-4 text-muted-foreground'>
              Không có thông báo nào
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={`${notification.id}-${notification.time}`}
                notification={notification}
                onRead={() => markAsRead(notification.id)}
              />
            ))
          )}
          <ScrollBar />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
