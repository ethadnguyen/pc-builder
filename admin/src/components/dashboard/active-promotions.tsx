'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivePromotion } from '@/services/modules/dashboard.service';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TagIcon } from 'lucide-react';

interface ActivePromotionsProps {
  promotions: ActivePromotion[];
}

export function ActivePromotions({ promotions }: ActivePromotionsProps) {
  if (!promotions || promotions.length === 0) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card className='col-span-2'>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <TagIcon className='mr-2 h-5 w-5 text-green-500' />
          Khuyến mãi đang hoạt động
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-5'>
          {promotions.map((promo) => (
            <div key={promo.id} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Badge className='mr-2 bg-green-100 text-green-800 hover:bg-green-200'>
                    {promo.code}
                  </Badge>
                  <span className='text-sm font-medium'>
                    {promo.discount_type === 'percentage'
                      ? `Giảm ${promo.discount}%`
                      : `Giảm ${promo.discount.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <span className='text-sm text-muted-foreground'>
                  Còn {promo.daysLeft} ngày
                </span>
              </div>

              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>Đã sử dụng: {promo.usage_count} lần</span>
                {promo.usage_limit && (
                  <span>Giới hạn: {promo.usage_limit} lần</span>
                )}
              </div>

              {promo.usage_limit && (
                <Progress
                  value={(promo.usage_count / promo.usage_limit) * 100}
                  className='h-1.5'
                />
              )}

              <div className='text-xs text-muted-foreground mt-1'>
                {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
