'use client';
import { InputSearch } from '@/components/custom/input-search';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationPopover } from '@/components/custom/notification-popover';

const AdminHeader = () => {
  return (
    <header className='sticky top-0 z-50 bg-sidebar border-b'>
      <div className='container mx-auto flex items-center justify-between py-2 px-4'>
        <div className='text-2xl font-bold dark:text-white flex gap-4'>
          <SidebarTrigger />
          <p className='font-medium text-xl'>Admin E-thad-commerce</p>
        </div>

        <div className='flex items-center gap-4'>
          <InputSearch className='pl-4 lg:w-[260px]' />
          <NotificationPopover />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
