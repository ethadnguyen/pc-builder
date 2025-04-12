'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentActivity } from '@/services/modules/dashboard.service';
import { ActivityIcon, BoxIcon, PackageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  if (!activities || activities.length === 0) return null;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} ngày trước`;
    } else if (diffHours > 0) {
      return `${diffHours} giờ trước`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <PackageIcon className='h-4 w-4 text-blue-500' />;
      case 'product':
        return <BoxIcon className='h-4 w-4 text-purple-500' />;
      default:
        return <ActivityIcon className='h-4 w-4 text-gray-500' />;
    }
  };

  return (
    <Card className='col-span-full'>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <ActivityIcon className='mr-2 h-5 w-5 text-blue-500' />
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[300px]'>
          <div className='space-y-4'>
            {activities.map((activity, index) => (
              <div key={index} className='flex items-start space-x-4'>
                <div className='rounded-full bg-muted p-2'>
                  {getActivityIcon(activity.type)}
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>{activity.action}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(new Date(activity.time))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
