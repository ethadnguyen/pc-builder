'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  OrderStatus,
  OrderResponse,
  PaymentStatus,
  PaymentMethod,
} from '@/services/types/response/order.res';
import { getOrderById, updateOrder } from '@/services/modules/order.service';
import { getUserById } from '@/services/modules/user.service';
import { UserResponse } from '@/services/types/response/user.res';

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number | null;
  onOrderUpdated: () => void;
}

export function OrderDialog({
  open,
  onClose,
  orderId,
  onOrderUpdated,
}: OrderDialogProps) {
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails(orderId);
    } else {
      setOrder(null);
      setUserData(null);
    }
  }, [open, orderId]);

  useEffect(() => {
    if (order && order.user_id) {
      fetchUserData(order.user_id);
    } else {
      setUserData(null);
    }
  }, [order]);

  const fetchUserData = async (userId: number) => {
    try {
      const data = await getUserById(userId);
      setUserData(data as unknown as UserResponse);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
    }
  };

  const fetchOrderDetails = async (id: number) => {
    try {
      setIsLoading(true);
      const data = await getOrderById(id);
      setOrder(data);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin đơn hàng:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lấy thông tin đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      setIsUpdating(true);
      await updateOrder({
        id: order.id,
        status: newStatus,
      });

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái đơn hàng',
      });

      fetchOrderDetails(order.id);
      onOrderUpdated();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge
            variant='outline'
            className='bg-yellow-50 text-yellow-700 border-yellow-200'
          >
            Chờ xử lý
          </Badge>
        );
      case OrderStatus.SHIPPING:
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200'
          >
            Đang giao hàng
          </Badge>
        );
      case OrderStatus.COMPLETED:
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            Hoàn thành
          </Badge>
        );
      case OrderStatus.CANCELLED:
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-200'
          >
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant='outline'>Không xác định</Badge>;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold'>
            Chi tiết đơn hàng {order && `#${order.id}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center h-[300px]'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : !order ? (
          <div className='text-center py-10'>
            Không tìm thấy thông tin đơn hàng
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h3 className='font-medium text-sm text-muted-foreground mb-1'>
                  Trạng thái đơn hàng
                </h3>
                <div className='flex items-center space-x-2'>
                  {getStatusBadge(order.status)}
                  {order.status !== OrderStatus.CANCELLED && (
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleUpdateStatus(value as OrderStatus)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className='w-[140px]'>
                        <SelectValue placeholder='Cập nhật' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OrderStatus.PENDING}>
                          Chờ xử lý
                        </SelectItem>
                        <SelectItem value={OrderStatus.SHIPPING}>
                          Đang giao
                        </SelectItem>
                        <SelectItem value={OrderStatus.COMPLETED}>
                          Hoàn thành
                        </SelectItem>
                        <SelectItem value={OrderStatus.CANCELLED}>
                          Hủy đơn
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div>
                <h3 className='font-medium text-sm text-muted-foreground mb-1'>
                  Thời gian đặt
                </h3>
                <p>
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', {
                    locale: vi,
                  })}
                </p>
              </div>

              <div>
                <h3 className='font-medium text-sm text-muted-foreground mb-1'>
                  Trạng thái thanh toán
                </h3>
                <Badge
                  variant='outline'
                  className={
                    order.payment_status === PaymentStatus.PAID
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }
                >
                  {order.payment_status === PaymentStatus.PAID
                    ? 'Đã thanh toán'
                    : 'Chưa thanh toán'}
                </Badge>
              </div>

              <div>
                <h3 className='font-medium text-sm text-muted-foreground mb-1'>
                  Phương thức thanh toán
                </h3>
                <p>
                  {order.payment_method === PaymentMethod.COD
                    ? 'Thanh toán khi nhận hàng'
                    : order.payment_method === PaymentMethod.VNPAY
                    ? 'VNPAY'
                    : order.payment_method === PaymentMethod.MOMO
                    ? 'MoMo'
                    : order.payment_method}
                </p>
              </div>
            </div>

            <div>
              <h3 className='font-medium text-sm text-muted-foreground mb-1'>
                Thông tin khách hàng
              </h3>
              <div className='space-y-1'>
                <p>
                  <span className='font-medium'>Tên:</span>{' '}
                  {userData ? userData.user_name : 'Khách vãng lai'}
                </p>
                <p>
                  <span className='font-medium'>Email:</span>{' '}
                  {userData ? userData.email : '—'}
                </p>
                <p>
                  <span className='font-medium'>Số điện thoại:</span>{' '}
                  {order.phone}
                </p>
              </div>
            </div>

            <div>
              <h3 className='font-medium text-sm text-muted-foreground mb-1'>
                Địa chỉ giao hàng
              </h3>
              <p>
                {order.address ? (
                  <>
                    {order.address.street}, {order.address.ward},{' '}
                    {order.address.district}, {order.address.province}
                  </>
                ) : (
                  'Không có thông tin địa chỉ'
                )}
              </p>
            </div>

            <div>
              <h3 className='font-medium mb-2'>Sản phẩm</h3>
              <div className='border rounded-md overflow-hidden'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th
                        scope='col'
                        className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Sản phẩm
                      </th>
                      <th
                        scope='col'
                        className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Giá
                      </th>
                      <th
                        scope='col'
                        className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Số lượng
                      </th>
                      <th
                        scope='col'
                        className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Tổng
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          {item.product?.name}
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          {item.price.toLocaleString()}đ
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          {item.quantity}
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          {(item.price * item.quantity).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='border-t pt-4'>
              <div className='flex justify-between items-center'>
                <div className='font-medium text-sm'>Tổng tiền hàng:</div>
                <div>{order.original_price?.toLocaleString()}đ</div>
              </div>
              {order.discount_amount > 0 && (
                <div className='flex justify-between items-center mt-2'>
                  <div className='font-medium text-sm'>Giảm giá:</div>
                  <div>-{order.discount_amount.toLocaleString()}đ</div>
                </div>
              )}
              <div className='flex justify-between items-center mt-2'>
                <div className='font-medium text-base'>Tổng thanh toán:</div>
                <div className='font-bold text-lg'>
                  {order.total_price.toLocaleString()}đ
                </div>
              </div>
            </div>

            <div className='flex justify-end space-x-2 pt-2'>
              <DialogClose asChild>
                <Button variant='outline'>Đóng</Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
