'use client';
import { InputSearch } from '@/components/custom/input-search';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationPopover } from '@/components/custom/notification-popover';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { User, LogOut, UserCircle } from 'lucide-react';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setShowDropdown(false));

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
          <div className='relative' ref={dropdownRef}>
            <div
              className='flex items-center gap-2 cursor-pointer rounded-full p-1 hover:bg-gray-200'
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
                <User size={18} />
              </div>
              <span className='hidden md:inline'>{user?.user_name}</span>
            </div>

            {showDropdown && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10'>
                <Link
                  href='/profile'
                  className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  onClick={() => setShowDropdown(false)}
                >
                  <UserCircle size={16} className='mr-2' />
                  Thông tin cá nhân
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className='flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <LogOut size={16} className='mr-2' />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
