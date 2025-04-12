'use client';

import { useEffect, useState } from 'react';
import { CategoryRevenueChart } from '@/components/chart/category-revenue-chart';
import { OrderStatusChart } from '@/components/chart/order-status-chart';
import { WeeklyOrdersChart } from '@/components/chart/weekly-orders-chart';
import { ActivePromotions } from '@/components/dashboard/active-promotions';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { RevenueOverviewCards } from '@/components/dashboard/revenue-overview';
import { TopSellingProducts } from '@/components/dashboard/top-selling-products';
import {
  DashboardService,
  RevenueOverview,
  OrderStatistics,
  ProductStatistics,
  CategoryRevenue,
  ActivePromotion,
  RecentActivity,
} from '@/services/modules/dashboard.service';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBody } from '@/components/custom/page-body';
import CustomBreadcrumb from '@/components/custom/custom-breadcrumb';
import { AdminGuard } from '@/components/custom/admin-guard';

export default function DashboardPage() {
  const [revenueData, setRevenueData] = useState<RevenueOverview | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [productStats, setProductStats] = useState<ProductStatistics | null>(
    null
  );
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [activePromotions, setActivePromotions] = useState<ActivePromotion[]>(
    []
  );
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Gọi tất cả API cùng lúc
        const [
          revenueResponse,
          orderStatsResponse,
          productStatsResponse,
          categoryRevenueResponse,
          activePromotionsResponse,
          recentActivitiesResponse,
        ] = await Promise.all([
          DashboardService.getRevenueOverview(),
          DashboardService.getOrderStatistics(),
          DashboardService.getProductStatistics(),
          DashboardService.getCategoryRevenue(),
          DashboardService.getActivePromotions(),
          DashboardService.getRecentActivities(),
        ]);

        setRevenueData(revenueResponse);
        setOrderStats(orderStatsResponse);
        setProductStats(productStatsResponse);
        setCategoryRevenue(categoryRevenueResponse);
        setActivePromotions(activePromotionsResponse);
        setRecentActivities(recentActivitiesResponse);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <AdminGuard>
      <PageBody>
        <div className='py-6'>
          <CustomBreadcrumb
            items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dashboard' }]}
          />

          <h1 className='text-xl font-medium mt-4 mb-6'>Dashboard</h1>

          {/* Revenue Overview */}
          <RevenueOverviewCards revenueData={revenueData!} />

          {/* Order Statistics */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <OrderStatusChart orderStatistics={orderStats!} />
            <WeeklyOrdersChart orderStatistics={orderStats!} />
          </div>

          {/* Products */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <TopSellingProducts productStats={productStats!} />
            <LowStockProducts productStats={productStats!} />
          </div>

          {/* Category Revenue */}
          <div className='mb-6'>
            <CategoryRevenueChart categoryRevenue={categoryRevenue} />
          </div>

          {/* Active Promotions and Recent Activities */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <ActivePromotions promotions={activePromotions} />
            <div className='col-span-2'>
              <RecentActivities activities={recentActivities} />
            </div>
          </div>
        </div>
      </PageBody>
    </AdminGuard>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <AdminGuard>
      <PageBody>
        <div className='py-6'>
          <CustomBreadcrumb
            items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dashboard' }]}
          />

          <Skeleton className='h-8 w-48 mt-4 mb-6' />

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-36 w-full' />
              </div>
            ))}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <Skeleton className='h-80 w-full' />
            <Skeleton className='h-80 w-full col-span-2' />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <Skeleton className='h-96 w-full' />
            <Skeleton className='h-96 w-full' />
          </div>

          <Skeleton className='h-96 w-full mb-6' />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <Skeleton className='h-80 w-full' />
            <Skeleton className='h-80 w-full col-span-2' />
          </div>
        </div>
      </PageBody>
    </AdminGuard>
  );
}
