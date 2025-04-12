'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatistics } from "@/services/modules/dashboard.service";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface OrderStatusChartProps {
  orderStatistics: OrderStatistics;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function OrderStatusChart({ orderStatistics }: OrderStatusChartProps) {
  if (!orderStatistics) return null;

  const { ordersByStatus } = orderStatistics;

  const data = [
    { name: 'Đang xử lý', value: ordersByStatus.pending },
    { name: 'Đang giao', value: ordersByStatus.shipping },
    { name: 'Đã thanh toán', value: ordersByStatus.paid },
    { name: 'Đã hoàn thành', value: ordersByStatus.completed },
    { name: 'Đã hủy', value: ordersByStatus.cancelled },
  ];

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Trạng thái đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} đơn hàng`, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 