'use client';

import { useAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !isAdmin()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className='flex justify-center items-center h-[calc(100vh-150px)]'>
        <Alert variant='destructive' className='max-w-lg'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Không có quyền truy cập</AlertTitle>
          <AlertDescription>
            Chỉ quản trị viên (Admin) mới có quyền truy cập vào chức năng này.
            Vui lòng liên hệ với quản trị viên hệ thống để biết thêm chi tiết.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
