'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueOverview } from '@/services/modules/dashboard.service';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  LucideIcon,
  PackageCheckIcon,
  ShoppingCartIcon,
} from 'lucide-react';

interface RevenueOverviewCardProps {
  revenueData: RevenueOverview;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  changePercentage?: number;
  iconColor?: string;
  description?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  changePercentage,
  iconColor = 'text-blue-500',
  description,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className={`${iconColor} rounded-full p-2 bg-opacity-10`}>
          <Icon className='h-4 w-4' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {changePercentage !== undefined && (
          <p className='text-xs text-muted-foreground flex items-center'>
            {changePercentage > 0 ? (
              <ArrowUpIcon className='mr-1 h-4 w-4 text-green-500' />
            ) : (
              <ArrowDownIcon className='mr-1 h-4 w-4 text-red-500' />
            )}
            <span
              className={
                changePercentage > 0 ? 'text-green-500' : 'text-red-500'
              }
            >
              {Math.abs(changePercentage).toFixed(1)}%
            </span>
            <span className='ml-1'>{description || 'so với kỳ trước'}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function RevenueOverviewCards({
  revenueData,
}: RevenueOverviewCardProps) {
  if (!revenueData) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
      <StatCard
        title='Doanh thu hôm nay'
        value={formatCurrency(revenueData.todayRevenue)}
        icon={CalendarIcon}
        iconColor='text-green-500'
      />

      <StatCard
        title='Doanh thu tháng này'
        value={formatCurrency(revenueData.thisMonthRevenue)}
        icon={CalendarIcon}
        changePercentage={revenueData.revenueChange}
        iconColor='text-blue-500'
      />

      <StatCard
        title='Tổng đơn hàng'
        value={revenueData.totalOrders.toString()}
        icon={ShoppingCartIcon}
        iconColor='text-purple-500'
      />

      <StatCard
        title='Tỷ lệ đơn thành công'
        value='87%'
        icon={PackageCheckIcon}
        changePercentage={5.2}
        iconColor='text-yellow-500'
        description='so với tháng trước'
      />
    </div>
  );
}
