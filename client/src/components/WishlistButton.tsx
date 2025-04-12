'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
} from '@/services/modules/wishlist.service';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: number;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  variant = 'outline',
  size = 'icon',
  showText = false,
  className,
}: WishlistButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { checkAuth } = useUserStore();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const isAuth = await checkAuth();
        if (!isAuth) {
          setIsLoading(false);
          return;
        }

        const response = await checkInWishlist(productId);
        setIsInWishlist(response.inWishlist);
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWishlistStatus();
  }, [productId, checkAuth]);

  const handleToggleWishlist = async () => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        toast({
          title: 'Cần đăng nhập',
          description: 'Vui lòng đăng nhập để sử dụng tính năng này',
          variant: 'default',
        });
        router.push('/auth/sign-in');
        return;
      }

      setIsLoading(true);

      if (isInWishlist) {
        await removeFromWishlist(productId);
        setIsInWishlist(false);
        toast({
          title: 'Đã xóa',
          description: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
        });
      } else {
        await addToWishlist(productId);
        setIsInWishlist(true);
        toast({
          title: 'Đã thêm',
          description: 'Đã thêm sản phẩm vào danh sách yêu thích',
        });
      }
    } catch (error) {
      console.error('Lỗi khi thao tác với danh sách yêu thích:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi thực hiện thao tác',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading}
      onClick={handleToggleWishlist}
      className={`group ${isInWishlist ? 'text-red-500' : ''} ${
        className || ''
      }`}
    >
      <Heart
        className={`h-5 w-5 ${
          isInWishlist
            ? 'fill-red-500 text-red-500'
            : 'fill-none group-hover:fill-red-500 group-hover:text-red-500 transition-colors'
        }`}
      />
      {showText && (
        <span className='ml-2'>
          {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </Button>
  );
}
