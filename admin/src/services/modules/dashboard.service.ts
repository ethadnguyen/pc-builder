import { get } from '../api_client';

// Kiểu dữ liệu trả về
export interface RevenueOverview {
  todayRevenue: number;
  thisMonthRevenue: number;
  totalOrders: number;
  revenueChange: number;
}

export interface OrderStatistics {
  ordersByStatus: {
    pending: number;
    shipping: number;
    completed: number;
    cancelled: number;
    paid: number;
  };
  ordersByDay: {
    date: string;
    count: number;
  }[];
}

export interface ProductStatistics {
  totalProducts: number;
  topSellingProducts: {
    id: number;
    name: string;
    image: string | null;
    price: number;
    quantity: number;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    stock: number;
    price: number;
    image: string | null;
  }[];
}

export interface CategoryRevenue {
  categoryId: number;
  name: string;
  revenue: number;
}

export interface ActivePromotion {
  id: number;
  code: string;
  discount: number;
  discount_type: string;
  usage_count: number;
  usage_limit: number | null;
  start_date: string;
  end_date: string;
  daysLeft: number;
}

export interface RecentActivity {
  type: string;
  action: string;
  time: Date;
  id: number;
}

export const DashboardService = {
  getRevenueOverview: async (): Promise<RevenueOverview> => {
    const response = await get('/dashboard/revenue-overview');
    return response.data;
  },

  getOrderStatistics: async (): Promise<OrderStatistics> => {
    const response = await get('/dashboard/order-statistics');
    return response.data;
  },

  getProductStatistics: async (): Promise<ProductStatistics> => {
    const response = await get('/dashboard/product-statistics');
    return response.data;
  },

  getCategoryRevenue: async (): Promise<CategoryRevenue[]> => {
    const response = await get('/dashboard/category-revenue');
    return response.data;
  },

  getActivePromotions: async (): Promise<ActivePromotion[]> => {
    const response = await get('/dashboard/active-promotions');
    return response.data;
  },

  getRecentActivities: async (): Promise<RecentActivity[]> => {
    const response = await get('/dashboard/recent-activities');
    return response.data;
  },
};
