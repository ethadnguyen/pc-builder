'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatistics } from '@/services/modules/dashboard.service';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface WeeklyOrdersChartProps {
  orderStatistics: OrderStatistics;
}

export function WeeklyOrdersChart({ orderStatistics }: WeeklyOrdersChartProps) {
  if (!orderStatistics) return null;

  const { ordersByDay } = orderStatistics;

  // Định dạng ngày tháng để hiển thị
  const data = ordersByDay.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <Card className='col-span-2'>
      <CardHeader>
        <CardTitle>Đơn hàng trong 7 ngày gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' tickFormatter={(value) => value} />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} đơn hàng`, '']}
                labelFormatter={(value) => `Ngày ${value}`}
              />
              <Bar
                dataKey='count'
                name='Số đơn hàng'
                fill='#8884d8'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
