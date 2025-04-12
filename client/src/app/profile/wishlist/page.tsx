'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/useUserStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  ShoppingCart,
  Trash2,
  PcCase,
} from 'lucide-react';
import {
  getUserWishlist,
  removeFromWishlist,
} from '@/services/modules/wishlist.service';
import { WishlistItemRes } from '@/services/types/response/wishlist_types/wishlist';
import { formatCurrency } from '@/lib/utils';

export default function WishlistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, checkAuth, logout } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItemRes[]>([]);

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push('/auth/sign-in');
        return;
      }

      try {
        const data = await getUserWishlist();
        setWishlistItems(data.items);
      } catch (error) {
        console.error('Lỗi khi tải danh sách yêu thích:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách sản phẩm yêu thích',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [checkAuth, router, toast]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Đăng xuất thành công',
      description: 'Bạn đã đăng xuất khỏi tài khoản',
    });
    router.push('/');
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
      setWishlistItems((prevItems) =>
        prevItems.filter((item) => item.productId !== productId)
      );
      toast({
        title: 'Thành công',
        description: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
      });
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa sản phẩm khỏi danh sách yêu thích',
        variant: 'destructive',
      });
    }
  };

  // Lấy chữ cái đầu của tên người dùng cho avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';

    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className='container py-10'>
        <div className='flex justify-center items-center min-h-[400px]'>
          <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full'></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='container py-10'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-10'>
            <User className='h-12 w-12 text-gray-400 mb-4' />
            <p className='text-xl font-medium mb-2'>Bạn chưa đăng nhập</p>
            <p className='text-gray-500 mb-4 text-center'>
              Vui lòng đăng nhập để xem thông tin tài khoản
            </p>
            <Button onClick={() => router.push('/auth/sign-in')}>
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container py-10'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {/* Sidebar */}
        <div className='md:col-span-1'>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex flex-col items-center'>
                <Avatar className='h-24 w-24 mb-4'>
                  <AvatarImage src='' alt={user.user_name || 'User'} />
                  <AvatarFallback className='text-lg'>
                    {getInitials(user.user_name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className='text-xl text-center'>
                  {user.user_name || 'Người dùng'}
                </CardTitle>
                <CardDescription className='text-center'>
                  {user.email || 'Không có email'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <nav className='space-y-2'>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href='/profile'>
                    <User className='mr-2 h-4 w-4' />
                    Thông tin cá nhân
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href='/profile/address'>
                    <MapPin className='mr-2 h-4 w-4' />
                    Địa chỉ của tôi
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href='/orders'>
                    <ShoppingBag className='mr-2 h-4 w-4' />
                    Đơn hàng của tôi
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href='/configuration'>
                    <PcCase className='mr-2 h-4 w-4' />
                    Cấu hình PC đã lưu
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start font-medium text-primary'
                  asChild
                >
                  <Link href='/profile/wishlist'>
                    <Heart className='mr-2 h-4 w-4 fill-primary' />
                    Sản phẩm yêu thích
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href='/profile/settings'>
                    <Settings className='mr-2 h-4 w-4' />
                    Cài đặt tài khoản
                  </Link>
                </Button>
              </nav>
            </CardContent>
            <CardFooter>
              <Button
                variant='destructive'
                className='w-full'
                onClick={handleLogout}
              >
                <LogOut className='mr-2 h-4 w-4' />
                Đăng xuất
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Content */}
        <div className='md:col-span-3'>
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm yêu thích</CardTitle>
              <CardDescription>
                Danh sách các sản phẩm bạn đã đánh dấu yêu thích
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wishlistItems.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-10'>
                  <Heart className='h-12 w-12 text-gray-400 mb-4' />
                  <p className='text-xl font-medium mb-2'>
                    Chưa có sản phẩm yêu thích
                  </p>
                  <p className='text-gray-500 mb-4 text-center'>
                    Hãy khám phá các sản phẩm và thêm vào danh sách yêu thích
                    của bạn
                  </p>
                  <Button onClick={() => router.push('/category/all')}>
                    Khám phá sản phẩm
                  </Button>
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-4'>
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className='border rounded-lg p-4 flex flex-col md:flex-row gap-4'
                    >
                      <div className='w-full md:w-1/4 aspect-square relative'>
                        <Link href={`/product/${item.product.slug}`}>
                          <Image
                            src={item.product.images[0] || '/placeholder.jpg'}
                            alt={item.product.name}
                            fill
                            className='object-cover rounded-md'
                          />
                        </Link>
                      </div>
                      <div className='flex flex-col flex-grow'>
                        <Link
                          href={`/product/${item.product.slug}`}
                          className='text-lg font-medium hover:text-primary transition-colors'
                        >
                          {item.product.name}
                        </Link>
                        <p className='text-sm text-gray-500 mb-2'>
                          Thương hiệu:{' '}
                          {item.product.brand?.name || 'Không có thông tin'}
                        </p>
                        <div className='mt-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-2'>
                          <div>
                            {item.product.discount &&
                            item.product.discount > 0 ? (
                              <>
                                <p className='text-lg font-bold text-primary'>
                                  {formatCurrency(
                                    item.product.price *
                                      (1 - (item.product.discount || 0) / 100)
                                  )}
                                </p>
                                <p className='text-sm text-gray-500 line-through'>
                                  {formatCurrency(item.product.price)}
                                </p>
                              </>
                            ) : (
                              <p className='text-lg font-bold text-primary'>
                                {formatCurrency(item.product.price)}
                              </p>
                            )}
                          </div>
                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              Xóa
                            </Button>
                            <Button size='sm' asChild>
                              <Link href={`/cart?add=${item.productId}`}>
                                <ShoppingCart className='h-4 w-4 mr-2' />
                                Thêm vào giỏ
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
