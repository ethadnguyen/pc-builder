'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PaymentStatus } from '@/services/types/request/payment_types/payment.req';
import { updateOrder } from '@/services/modules/order.service';
import { updatePaymentStatus } from '@/services/modules/payment.service';
import { useCartStore } from '@/store/useCartStore';

export default function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { clearCart } = useCartStore();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAttemptedReload, setHasAttemptedReload] = useState(false);

  const hasParams = searchParams.toString().length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!hasParams && !hasAttemptedReload) {
      setHasAttemptedReload(true);

      const timer = setTimeout(() => {
        window.location.reload();
      }, 1000);

      return () => clearTimeout(timer);
    }

    const processPaymentResult = async () => {
      try {
        setIsLoading(true);

        const orderId = searchParams.get('orderId');
        const vnpResponseCode = searchParams.get('vnp_ResponseCode');
        const vnpTxnRef = searchParams.get('vnp_TxnRef');
        const vnpAmount = searchParams.get('vnp_Amount');
        const vnpBankCode = searchParams.get('vnp_BankCode');
        const vnpPayDate = searchParams.get('vnp_PayDate');
        const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
        const vnpTransactionNo = searchParams.get('vnp_TransactionNo');

        console.log('Tham số URL:', {
          orderId,
          vnpResponseCode,
          vnpTxnRef,
          vnpAmount,
          vnpBankCode,
          vnpPayDate,
          vnpOrderInfo,
          vnpTransactionNo,
        });

        const finalOrderId = orderId;
        if (finalOrderId) {
          setOrderId(finalOrderId);
        } else {
          if (!hasAttemptedReload) {
            setHasAttemptedReload(true);
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }, 1000);
            return;
          }

          setIsLoading(false);
          setPaymentStatus(PaymentStatus.FAILED);
          setErrorMessage('Không tìm thấy mã đơn hàng.');
          toast({
            title: 'Lỗi',
            description: 'Không tìm thấy mã đơn hàng.',
            variant: 'destructive',
          });
          return;
        }

        let isSuccess = false;
        if (vnpResponseCode) {
          isSuccess = vnpResponseCode === '00';
          const status = isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED;
          setPaymentStatus(status);
        }

        let finalPaymentId = null;
        if (vnpTxnRef) {
          const parts = vnpTxnRef.split('_');
          if (parts.length > 0) {
            finalPaymentId = parts[0];
            console.log(
              'Đã trích xuất paymentId từ vnp_TxnRef:',
              finalPaymentId
            );
            setPaymentId(finalPaymentId);
          }
        }

        if (!finalPaymentId) {
          if (!hasAttemptedReload) {
            setHasAttemptedReload(true);
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }, 1000);
            return;
          }

          setIsLoading(false);
          setPaymentStatus(PaymentStatus.FAILED);
          setErrorMessage('Không tìm thấy mã thanh toán.');
          toast({
            title: 'Lỗi',
            description: 'Không tìm thấy mã thanh toán.',
            variant: 'destructive',
          });
          return;
        }

        const paymentDetails = JSON.stringify(
          Object.fromEntries(searchParams.entries())
        );

        try {
          await updatePaymentStatus({
            id: Number(finalPaymentId),
            status: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
            payment_details: paymentDetails,
          });

          await updateOrder({
            id: Number(finalOrderId),
            payment_status: isSuccess
              ? PaymentStatus.PAID
              : PaymentStatus.UNPAID,
          });

          if (isSuccess) {
            await clearCart();
            toast({
              title: 'Thanh toán thành công',
              description: 'Đơn hàng của bạn đã được thanh toán thành công.',
            });
          } else {
            setErrorMessage('Thanh toán thất bại. Vui lòng thử lại sau.');
            toast({
              title: 'Thanh toán thất bại',
              description: 'Đã xảy ra lỗi trong quá trình thanh toán.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
          setErrorMessage('Không thể cập nhật trạng thái thanh toán.');
          toast({
            title: 'Lỗi',
            description: 'Không thể cập nhật trạng thái thanh toán.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Lỗi khi xử lý kết quả thanh toán:', error);
        setPaymentStatus(PaymentStatus.FAILED);
        setErrorMessage('Đã xảy ra lỗi trong quá trình xử lý thanh toán.');
        toast({
          title: 'Lỗi',
          description: 'Không thể xử lý kết quả thanh toán.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (hasParams) {
      processPaymentResult();
    }
  }, [searchParams, toast, clearCart, hasParams, hasAttemptedReload]);

  if (isLoading) {
    return (
      <div className='container py-12 flex flex-col items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-12 w-12 animate-spin mb-4' />
        <p className='text-lg'>Đang xử lý kết quả thanh toán...</p>
        {hasAttemptedReload && (
          <p className='text-sm text-muted-foreground mt-2'>
            Đang tải lại thông tin thanh toán...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='container py-12'>
      <Card className='max-w-md mx-auto'>
        <CardContent className='pt-6 text-center'>
          {paymentStatus === PaymentStatus.PAID ? (
            <>
              <div className='rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-6'>
                <CheckCircle2 className='h-8 w-8 text-green-600' />
              </div>
              <h1 className='text-2xl font-bold mb-2'>
                Thanh toán thành công!
              </h1>
              <p className='text-muted-foreground mb-6'>
                Cảm ơn bạn đã đặt hàng. Chúng tôi đã gửi email xác nhận đơn hàng
                đến địa chỉ email của bạn.
              </p>
              <div className='bg-muted p-4 rounded-lg mb-6'>
                <p className='font-medium'>Mã đơn hàng: #{orderId}</p>
                {paymentId && (
                  <p className='text-sm text-muted-foreground'>
                    Mã thanh toán: #{paymentId}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className='rounded-full bg-red-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-6'>
                <XCircle className='h-8 w-8 text-red-600' />
              </div>
              <h1 className='text-2xl font-bold mb-2'>Thanh toán thất bại</h1>
              <p className='text-muted-foreground mb-6'>
                {errorMessage || 'Đã xảy ra lỗi trong quá trình thanh toán.'}
              </p>
              {orderId && (
                <div className='bg-muted p-4 rounded-lg mb-6'>
                  <p className='font-medium'>Mã đơn hàng: #{orderId}</p>
                </div>
              )}
            </>
          )}

          <div className='flex flex-col gap-4'>
            {orderId && (
              <Button asChild>
                <Link href={`/orders/${orderId}`}>Xem chi tiết đơn hàng</Link>
              </Button>
            )}
            <Button variant='outline' asChild>
              <Link href='/'>Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
