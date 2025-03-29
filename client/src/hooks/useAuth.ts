'use client';

import { useUserStore } from '@/store/useUserStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { user, loading } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Nếu đang ở trang chủ, không chuyển hướng
    if (pathname === '/') {
      return;
    }

    if (!loading && requireAuth && !user) {
      // Nếu yêu cầu xác thực nhưng không có user, chuyển hướng đến trang đăng nhập
      router.push('/auth/sign-in');
    } else if (!loading && !requireAuth && user) {
      // Nếu không yêu cầu xác thực nhưng đã có user, chuyển hướng về trang chủ
      router.push('/');
    }
  }, [user, loading, requireAuth, router, pathname]);

  return { user, loading, isAuthenticated: !!user };
}
