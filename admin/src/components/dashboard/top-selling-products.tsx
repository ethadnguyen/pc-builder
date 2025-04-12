'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductStatistics } from '@/services/modules/dashboard.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarIcon } from 'lucide-react';

interface TopSellingProductsProps {
  productStats: ProductStatistics;
}

export function TopSellingProducts({ productStats }: TopSellingProductsProps) {
  if (
    !productStats ||
    !productStats.topSellingProducts ||
    productStats.topSellingProducts.length === 0
  )
    return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle className='text-lg'>Top sản phẩm bán chạy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {productStats.topSellingProducts.map((product) => (
            <div key={product.id} className='flex items-center space-x-4'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src={product.image || ''} alt={product.name} />
                <AvatarFallback className='bg-primary-50'>
                  {product.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium leading-none'>
                    {product.name}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {product.quantity} đã bán
                  </p>
                </div>
                <div className='flex items-center text-amber-500'>
                  <StarIcon className='mr-1 h-3 w-3' />
                  <p className='text-xs'>{formatCurrency(product.price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
