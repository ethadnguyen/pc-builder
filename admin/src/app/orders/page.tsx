'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaginationWrapper from '@/components/custom/pagination-wrapper';
import {
  OrderStatus,
  OrderResponse,
} from '@/services/types/response/order.res';
import { getAllOrders, updateOrder } from '@/services/modules/order.service';
import { OrderDialog } from './order-dialog';
import { useNotification } from '@/hooks/use-notification';
import { AdminGuard } from '@/components/custom/admin-guard';
import CustomBreadcrumb from '@/components/custom/custom-breadcrumb';
import { PageBody } from '@/components/custom/page-body';

export default function OrdersPage() {
  const { toast } = useToast();
  const { notifications } = useNotification();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const pageSize = 10;

  const fetchOrders = async (page: number) => {
    try {
      setIsLoading(true);

      const params: {
        page: number;
        size: number;
        status?: string;
        searchAddress?: string;
      } = {
        page,
        size: pageSize,
      };

      // Thêm param status nếu không phải 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Thêm param searchAddress nếu có
      if (searchAddress.trim()) {
        params.searchAddress = searchAddress.trim();
      }

      const response = await getAllOrders(params);
      setOrders(response.orders || []);
      setTotalPages(Math.ceil((response.total || 0) / pageSize));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lấy danh sách đơn hàng',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, statusFilter]);

  // Khi người dùng nhấn tìm kiếm theo địa chỉ
  const handleSearchAddress = () => {
    setCurrentPage(1); // Reset về trang 1
    fetchOrders(1);
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      if (!latestNotification.read) {
        fetchOrders(currentPage);
      }
    }
  }, [notifications, currentPage]);

  const handleUpdateStatus = async (
    orderId: number,
    newStatus: OrderStatus
  ) => {
    try {
      await updateOrder({
        id: orderId,
        status: newStatus,
      });

      fetchOrders(currentPage);

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái đơn hàng',
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái đơn hàng',
        variant: 'destructive',
      });
    }
  };

  const openOrderDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderDialogOpen(true);
  };

  const closeOrderDialog = () => {
    setIsOrderDialogOpen(false);
    setSelectedOrderId(null);
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

  if (isLoading) {
    return (
      <AdminGuard>
        <PageBody>
          <div className='flex-1 space-y-4 pt-6'>
            <CustomBreadcrumb
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Quản lý đơn hàng' },
              ]}
            />
            <div className='flex items-center justify-center h-[400px]'>
              <Loader2 className='h-8 w-8 animate-spin' />
            </div>
          </div>
        </PageBody>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <PageBody>
        <div className='flex-1 space-y-4 pt-6'>
          <CustomBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Quản lý đơn hàng' },
            ]}
          />

          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-xl font-medium'>Quản lý đơn hàng</h2>
          </div>

          <div className='flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:gap-4 mb-4'>
            {/* Filter theo status */}
            <div className='md:w-[200px]'>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Lọc theo trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value={OrderStatus.PENDING}>Chờ xử lý</SelectItem>
                  <SelectItem value={OrderStatus.SHIPPING}>
                    Đang giao
                  </SelectItem>
                  <SelectItem value={OrderStatus.COMPLETED}>
                    Hoàn thành
                  </SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tìm kiếm theo địa chỉ */}
            <div className='flex-1 relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm theo địa chỉ...'
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className='pl-8'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchAddress();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearchAddress}>Tìm kiếm</Button>
          </div>

          <div className='border rounded-lg'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Thông tin khách hàng</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-medium'>ID: {order.user_id}</p>
                        <p className='text-sm text-muted-foreground'>
                          SĐT: {order.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate'>
                      {order.address
                        ? `${order.address.province}, ${order.address.district}, ${order.address.ward}, ${order.address.street}`
                        : 'Không có địa chỉ'}
                    </TableCell>
                    <TableCell>
                      {order.total_price?.toLocaleString()}đ
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openOrderDetails(order.id)}
                        >
                          Chi tiết
                        </Button>
                        {order.status !== OrderStatus.CANCELLED && (
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              handleUpdateStatus(order.id, value as OrderStatus)
                            }
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
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center'>
                      Không có đơn hàng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationWrapper
            totalPage={totalPages}
            onPageChange={setCurrentPage}
            selectedPage={currentPage}
          />

          <OrderDialog
            open={isOrderDialogOpen}
            onClose={closeOrderDialog}
            orderId={selectedOrderId}
            onOrderUpdated={() => fetchOrders(currentPage)}
          />
        </div>
      </PageBody>
    </AdminGuard>
  );
}
