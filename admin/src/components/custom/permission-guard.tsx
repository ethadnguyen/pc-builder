'use client';

import { useAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { checkPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated || !checkPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className='flex justify-center items-center h-[calc(100vh-150px)]'>
        <Alert variant='destructive' className='max-w-lg'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Không có quyền truy cập</AlertTitle>
          <AlertDescription>
            Bạn không có quyền truy cập vào chức năng này. Vui lòng liên hệ với
            quản trị viên để biết thêm chi tiết.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
