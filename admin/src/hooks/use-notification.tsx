'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';

export interface OrderNotification {
  id: number;
  contactPhone: string;
  orderTotal?: number;
  customerName?: string;
  customerEmail?: string;
  userId?: number;
  items?: number;
  status?: string;
  time: string;
  read: boolean;
  type: 'order';
}

export interface PromotionNotification {
  id: string;
  promotions: {
    id: number;
    name: string;
    code: string;
    expiryDate: string;
    daysRemaining: number;
    discountValue: number;
  }[];
  time: string;
  read: boolean;
  type: 'promotion';
}

export type Notification = OrderNotification | PromotionNotification;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('admin-notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'admin-notifications',
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('Error saving notifications to localStorage', error);
    }
  }, [notifications]);

  useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
    const newSocket = io(`${SOCKET_URL}/admin`, {
      withCredentials: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    console.log('Setting up socket event listeners');

    const handleNewOrder = (data: OrderNotification) => {
      console.log('Received new order notification:', data);
      setNotifications((prev) => [data, ...prev.slice(0, 19)]);
    };

    const handleExpiringPromotions = (data: PromotionNotification) => {
      console.log('Received promotion notification:', data);
      setNotifications((prev) => [data, ...prev.slice(0, 19)]);
    };

    // Add connection status listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('new-order', handleNewOrder);
    socket.on('expiring-promotions', handleExpiringPromotions);

    return () => {
      console.log('Cleaning up socket event listeners');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('new-order', handleNewOrder);
      socket.off('expiring-promotions', handleExpiringPromotions);
    };
  }, [socket]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = useCallback((id: string | number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
