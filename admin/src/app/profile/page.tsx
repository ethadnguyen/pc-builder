'use client';

import { useAuth } from '@/hooks/use-auth';
import { getUserById } from '@/services/modules/user.service';
import { useEffect, useState } from 'react';
import { User, Phone, Mail, Calendar } from 'lucide-react';

interface UserProfile {
  user_id: string;
  user_name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  role: Array<{
    name: string;
    description: string;
    permissions: Array<{
      id: string;
      name: string;
      description: string;
    }>;
  }>;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserProfile() {
      if (user?.id) {
        try {
          const userData = await getUserById(user.id);
          setProfileData(userData);
        } catch (error) {
          console.error('Không thể lấy thông tin người dùng:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [user]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full'></div>
        <span className='ml-2'>Đang tải thông tin...</span>
      </div>
    );
  }

  if (!profileData && !user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <span className='text-red-500'>
          Không tìm thấy thông tin người dùng
        </span>
      </div>
    );
  }

  // Sử dụng profileData từ API hoặc sử dụng user từ auth
  const displayData = profileData || {
    user_id: user?.id.toString(),
    user_name: user?.user_name || '',
    email: user?.email || '',
    phone: '',
    avatar: null,
    status: '',
    createdAt: '',
    updatedAt: '',
    role: user?.role
      ? [
          {
            name: user.role.name,
            description: user.role.description,
            permissions: user.permissions.map((p) => ({
              id: p.id.toString(),
              name: p.name,
              description: p.description,
            })),
          },
        ]
      : [],
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Thông tin cá nhân</h1>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='w-full md:w-1/3 mb-6 p-6 bg-white rounded-lg shadow'>
          <div className='flex flex-col items-center'>
            <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4'>
              <User size={40} />
            </div>
            <h2 className='text-xl font-semibold'>{displayData.user_name}</h2>
            <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mt-2'>
              {displayData.role?.[0]?.name || 'Không có vai trò'}
            </span>
            <div className='mt-4 w-full'>
              <div className='flex items-center gap-2 text-gray-600 mb-2'>
                <Mail size={16} />
                <span>{displayData.email || 'Chưa cập nhật'}</span>
              </div>
              <div className='flex items-center gap-2 text-gray-600 mb-2'>
                <Phone size={16} />
                <span>{displayData.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className='flex items-center gap-2 text-gray-600'>
                <Calendar size={16} />
                <span>Tham gia: {formatDate(displayData.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className='w-full md:w-2/3 bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-medium mb-4'>Thông tin chi tiết</h3>
          <div className='space-y-4 border rounded-lg p-4'>
            <div className='grid grid-cols-3 gap-4 py-2 border-b'>
              <span className='font-medium'>ID</span>
              <span className='col-span-2'>{displayData.user_id}</span>
            </div>
            <div className='grid grid-cols-3 gap-4 py-2 border-b'>
              <span className='font-medium'>Tên người dùng</span>
              <span className='col-span-2'>{displayData.user_name}</span>
            </div>
            <div className='grid grid-cols-3 gap-4 py-2 border-b'>
              <span className='font-medium'>Email</span>
              <span className='col-span-2'>
                {displayData.email || 'Chưa cập nhật'}
              </span>
            </div>
            <div className='grid grid-cols-3 gap-4 py-2 border-b'>
              <span className='font-medium'>Số điện thoại</span>
              <span className='col-span-2'>
                {displayData.phone || 'Chưa cập nhật'}
              </span>
            </div>
            <div className='grid grid-cols-3 gap-4 py-2 border-b'>
              <span className='font-medium'>Vai trò</span>
              <span className='col-span-2'>
                {displayData.role?.[0]?.name || 'Không có vai trò'}
              </span>
            </div>
            <div className='grid grid-cols-3 gap-4 py-2'>
              <span className='font-medium'>Trạng thái</span>
              <span
                className={`col-span-2 ${
                  displayData.status === 'ENABLE'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {displayData.status === 'ENABLE'
                  ? 'Đang hoạt động'
                  : displayData.status || 'Không xác định'}
              </span>
            </div>
          </div>

          <div className='mt-6'>
            <h3 className='text-lg font-medium mb-4 border-b pb-2'>
              Quyền hạn
            </h3>
            <div className='flex flex-wrap gap-2 mt-4'>
              {displayData.role?.[0]?.permissions?.map((permission, index) => (
                <div
                  key={index}
                  className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm'
                >
                  {permission.name}
                  {permission.description && (
                    <span className='text-xs ml-1 text-green-600'>
                      ({permission.description})
                    </span>
                  )}
                </div>
              ))}
              {(!displayData.role?.[0]?.permissions ||
                displayData.role[0].permissions.length === 0) && (
                <span className='text-gray-500'>Không có quyền nào</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
