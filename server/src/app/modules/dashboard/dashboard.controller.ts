import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('Dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/revenue-overview')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lấy tổng quan về doanh thu' })
  @ApiResponse({
    status: 200,
    description: 'Trả về tổng quan về doanh thu',
  })
  async getRevenueOverview() {
    return this.dashboardService.getRevenueOverview();
  }

  @Get('/order-statistics')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lấy thống kê đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thống kê đơn hàng',
  })
  async getOrderStatistics() {
    return this.dashboardService.getOrderStatistics();
  }

  @Get('/product-statistics')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lấy thống kê sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thống kê sản phẩm',
  })
  async getProductStatistics() {
    return this.dashboardService.getProductStatistics();
  }

  @Get('/category-revenue')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lấy doanh thu theo danh mục' })
  @ApiResponse({
    status: 200,
    description: 'Trả về doanh thu theo danh mục',
  })
  async getCategoryRevenue() {
    return this.dashboardService.getCategoryRevenue();
  }

  @Get('/active-promotions')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lấy danh sách khuyến mãi đang hoạt động' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách khuyến mãi đang hoạt động',
  })
  async getActivePromotions() {
    return this.dashboardService.getActivePromotions();
  }

  @Get('/recent-activities')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lấy hoạt động gần đây' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hoạt động gần đây',
  })
  async getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }
}
