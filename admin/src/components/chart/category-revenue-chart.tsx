'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryRevenue } from '@/services/modules/dashboard.service';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CategoryRevenueChartProps {
  categoryRevenue: CategoryRevenue[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#8dd1e1',
  '#a4de6c',
  '#d0ed57',
];

export function CategoryRevenueChart({
  categoryRevenue,
}: CategoryRevenueChartProps) {
  if (!categoryRevenue || categoryRevenue.length === 0) return null;

  // Chuyển đổi dữ liệu cho biểu đồ
  const data = categoryRevenue.map((item) => ({
    name: item.name,
    value: item.revenue,
  }));

  // Format tiền tệ VND
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Card className='col-span-full'>
      <CardHeader>
        <CardTitle>Doanh thu theo danh mục</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-96'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                labelLine={true}
                outerRadius={120}
                fill='#8884d8'
                dataKey='value'
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatCurrency(value as number),
                  'Doanh thu',
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
