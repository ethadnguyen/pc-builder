'use client';

import {
  Box,
  LayoutDashboard,
  Package,
  Percent,
  ShoppingCart,
  Tags,
  Users,
  Factory,
  UserCircle,
  UserRound,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Tổng quan',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Vai trò',
    href: '/role',
    icon: UserRound,
  },
  {
    title: 'Quyền',
    href: '/permission',
    icon: KeyRound,
  },
  {
    title: 'Sản phẩm',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Hãng sản xuất',
    href: '/brand',
    icon: Factory,
  },
  {
    title: 'Danh mục',
    href: '/categories',
    icon: Tags,
  },
  {
    title: 'Đơn hàng',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Khuyến mãi',
    href: '/promotions',
    icon: Percent,
  },
  {
    title: 'Thông tin cá nhân',
    href: '/profile',
    icon: UserCircle,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className='border-b px-6 py-3'>
        <Link href='/' className='flex items-center gap-2 font-semibold'>
          <Box className='h-6 w-6' />
          <span>Quản trị</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className='flex items-center gap-2'
              >
                <Link href={item.href}>
                  <item.icon className='h-4 w-4' />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
