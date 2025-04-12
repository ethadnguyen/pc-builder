'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductStatistics } from '@/services/modules/dashboard.service';
import { Badge } from '@/components/ui/badge';
import { AlertCircleIcon } from 'lucide-react';

interface LowStockProductsProps {
  productStats: ProductStatistics;
}

export function LowStockProducts({ productStats }: LowStockProductsProps) {
  if (
    !productStats ||
    !productStats.lowStockProducts ||
    productStats.lowStockProducts.length === 0
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
        <CardTitle className='text-lg flex items-center'>
          <AlertCircleIcon className='mr-2 h-5 w-5 text-amber-500' />
          Sản phẩm sắp hết hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {productStats.lowStockProducts.map((product) => (
            <div
              key={product.id}
              className='flex justify-between items-center border-b pb-2'
            >
              <div>
                <p className='font-medium'>{product.name}</p>
                <p className='text-sm text-muted-foreground'>
                  {formatCurrency(product.price)}
                </p>
              </div>
              <div className='flex items-center'>
                <Badge
                  variant={product.inventory < 5 ? 'destructive' : 'secondary'}
                  className='mr-2'
                >
                  {product.inventory} sản phẩm
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {productStats.lowStockProducts.length > 5 && (
          <div className='mt-4 text-center'>
            <button className='text-sm text-blue-500 hover:underline'>
              Xem tất cả ({productStats.lowStockProducts.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
