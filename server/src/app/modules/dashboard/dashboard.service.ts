import { Injectable } from '@nestjs/common';
import { OrderService } from '../orders/services/order.service';
import { ProductService } from '../products/services/products.service';
import { CategoryService } from '../categories/services/categories.service';
import { PromotionService } from '../promotions/services/promotion.service';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly promotionService: PromotionService,
  ) {}

  async getRevenueOverview() {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);

    const lastMonth = subDays(firstDayOfMonth, 1);
    const firstDayOfLastMonth = startOfMonth(lastMonth);
    const lastDayOfLastMonth = endOfMonth(lastMonth);

    const allOrders = await this.orderService.getAllOrders({
      status: OrderStatus.COMPLETED,
      page: 1,
      size: 9999,
    });

    const todayOrders = allOrders.orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfToday && orderDate <= endOfToday;
    });
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + order.total_price,
      0,
    );

    const thisMonthOrders = allOrders.orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
    });
    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, order) => sum + order.total_price,
      0,
    );

    const lastMonthOrders = allOrders.orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        orderDate >= firstDayOfLastMonth && orderDate <= lastDayOfLastMonth
      );
    });
    const lastMonthRevenue = lastMonthOrders.reduce(
      (sum, order) => sum + order.total_price,
      0,
    );

    const revenueChange =
      lastMonthRevenue === 0
        ? 100
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    const totalOrders = allOrders.total;

    return {
      todayRevenue,
      thisMonthRevenue,
      totalOrders,
      revenueChange,
    };
  }

  async getOrderStatistics() {
    const allOrders = await this.orderService.getAllOrders({
      page: 1,
      size: 9999,
    });

    const ordersByStatus = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.SHIPPING]: 0,
      [OrderStatus.COMPLETED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.PAID]: 0,
    };

    allOrders.orders.forEach((order) => {
      ordersByStatus[order.status]++;
    });

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const ordersByDay = last7Days.map((day) => {
      const count = allOrders.orders.filter((order) => {
        const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd');
        return orderDate === day;
      }).length;

      return {
        date: day,
        count,
      };
    });

    return {
      ordersByStatus,
      ordersByDay,
    };
  }

  async getProductStatistics() {
    const products = await this.productService.getAllProducts({
      page: 1,
      size: 9999,
    });
    const totalProducts = products.total;

    const orders = await this.orderService.getAllOrders({
      status: OrderStatus.COMPLETED,
      page: 1,
      size: 9999,
    });

    const productSales = {};
    orders.orders.forEach((order) => {
      order.order_items.forEach((item) => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = 0;
        }
        productSales[productId] += item.quantity;
      });
    });

    const productSalesArray = Object.entries(productSales).map(
      ([productId, quantity]) => ({
        productId: parseInt(productId),
        quantity,
      }),
    );

    productSalesArray.sort(
      (a, b) => (b.quantity as number) - (a.quantity as number),
    );

    const top5Products = [];
    for (let i = 0; i < Math.min(5, productSalesArray.length); i++) {
      const { productId, quantity } = productSalesArray[i];
      const product = await this.productService.getProductById(productId);
      top5Products.push({
        id: product.id,
        name: product.name,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : null,
        price: product.price,
        quantity,
      });
    }

    const lowStockProducts = products.products
      .filter((product) => product.stock < 10 && product.stock > 0)
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        price: product.price,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : null,
      }));

    return {
      totalProducts,
      topSellingProducts: top5Products,
      lowStockProducts,
    };
  }

  async getCategoryRevenue() {
    const categories = await this.categoryService.getAllCategories({
      page: 1,
      size: 9999,
    });

    const orders = await this.orderService.getAllOrders({
      status: OrderStatus.COMPLETED,
      page: 1,
      size: 9999,
    });

    const categoryRevenue = {};
    const categoryNames = {};

    categories.categories.forEach((category) => {
      categoryRevenue[category.id] = 0;
      categoryNames[category.id] = category.name;
    });

    for (const order of orders.orders) {
      for (const item of order.order_items) {
        const product = await this.productService.getProductById(
          item.product.id,
        );
        if (product && product.categories && product.categories.length > 0) {
          categoryRevenue[product.categories[0].id] +=
            item.price * item.quantity;
        }
      }
    }

    const result = Object.entries(categoryRevenue)
      .map(([categoryId, revenue]) => ({
        categoryId: parseInt(categoryId),
        name: categoryNames[categoryId],
        revenue: revenue as number,
      }))
      .filter((item) => (item.revenue as number) > 0)
      .sort((a, b) => (b.revenue as number) - (a.revenue as number));

    return result;
  }

  async getActivePromotions() {
    const now = new Date();

    const promotions = await this.promotionService.findAllPromotions({
      page: 1,
      size: 9999,
    });

    // Lọc khuyến mãi đang hoạt động
    const activePromotions = promotions.promotions
      .filter((promo) => {
        const startDate = new Date(promo.start_date);
        const endDate = new Date(promo.end_date);
        return startDate <= now && endDate >= now;
      })
      .map((promo) => {
        const endDate = new Date(promo.end_date);
        const timeLeft = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

        return {
          id: promo.id,
          code: promo.name,
          discount: promo.discount_value,
          discount_type: promo.discount_type,
          usage_count: promo.used_count || 0,
          usage_limit: promo.usage_limit,
          start_date: promo.start_date,
          end_date: promo.end_date,
          daysLeft,
        };
      });

    return activePromotions;
  }

  async getRecentActivities(limit = 10) {
    const recentOrders = await this.orderService.getAllOrders({
      page: 1,
      size: 9999,
    });

    const recentProducts = await this.productService.getAllProducts({
      page: 1,
      size: limit,
    });

    const activities = [
      ...recentOrders.orders.map((order) => ({
        type: 'order',
        action: `Đơn hàng #${order.id} được cập nhật sang trạng thái ${order.status}`,
        time: new Date(order.updated_at || order.created_at),
        id: order.id,
      })),
      ...recentProducts.products.map((product) => ({
        type: 'product',
        action: `Sản phẩm "${product.name}" được cập nhật`,
        time: new Date(product.updated_at || product.created_at),
        id: product.id,
      })),
    ];

    activities.sort((a, b) => b.time.getTime() - a.time.getTime());

    return activities.slice(0, limit);
  }
}
