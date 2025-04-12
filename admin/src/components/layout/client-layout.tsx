'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/menu/admin-sidebar';
import AdminHeader from '@/components/custom/admin-header';
import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/hooks/use-notification';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isStaticResourcePath =
    pathname?.includes('.png') ||
    pathname?.includes('.jpg') ||
    pathname?.includes('.jpeg') ||
    pathname?.includes('.svg') ||
    pathname?.includes('.css') ||
    pathname?.includes('.js');

  const actualPathname = isStaticResourcePath ? '/' : pathname;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log('ClientLayout - Auth Status:', {
        isAuthenticated,
        loading,
        pathname: actualPathname,
        user: user ? 'User exists' : 'No user',
        mounted,
      });
    }
  }, [isAuthenticated, loading, actualPathname, mounted, user]);

  const isAuthRoute =
    actualPathname === '/login' || actualPathname?.startsWith('/(auth)');

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (isAuthRoute || !isAuthenticated) {
    return <div className='w-full'>{children}</div>;
  }

  return (
    <NotificationProvider>
      <SidebarProvider className='w-full'>
        <AdminSidebar />
        <div className='w-full'>
          <AdminHeader />
          {children}
          <Toaster />
        </div>
      </SidebarProvider>
    </NotificationProvider>
  );
}
