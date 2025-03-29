'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/useUserStore';
import { getUserById } from '@/services/modules/user.service';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { setTokens, setUser } = useUserStore();

  useEffect(() => {
    const processOAuthLogin = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        toast({
          title: 'Đăng nhập thất bại',
          description: 'Không thể nhận thông tin xác thực từ nhà cung cấp.',
          variant: 'destructive',
        });
        router.push('/auth/sign-in');
        return;
      }

      setTokens(accessToken, refreshToken);

      try {
        const payloadParam = searchParams.get('payload');
        if (payloadParam) {
          const payload = JSON.parse(decodeURIComponent(payloadParam));

          if (payload.user_id) {
            const userInfo = await getUserById(Number(payload.user_id));
            if (userInfo) {
              setUser(userInfo);
            }
          }
        }

        toast({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng bạn quay trở lại!',
        });

        router.push('/');
      } catch (error) {
        console.error('Lỗi khi xử lý đăng nhập OAuth:', error);
        toast({
          title: 'Đăng nhập thất bại',
          description: 'Có lỗi xảy ra khi xử lý thông tin người dùng.',
          variant: 'destructive',
        });
      }
    };

    processOAuthLogin();
  }, [searchParams, router, toast, setTokens, setUser]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold mb-4'>Đang xử lý đăng nhập...</h1>
        <p className='text-muted-foreground'>
          Vui lòng đợi trong khi chúng tôi hoàn tất quá trình đăng nhập của bạn.
        </p>
      </div>
    </div>
  );
}
