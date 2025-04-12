'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AdminGuard } from '@/components/custom/admin-guard';
import { DataTable } from '@/components/tables/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  getAllPermissions,
  deletePermission,
} from '@/services/modules/permission.service';
import { PlusIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionDialog } from './permission-dialog';
import { Badge } from '@/components/ui/badge';
import { PermissionRes } from '@/services/types/response/permission.res';
import PaginationWrapper from '@/components/custom/pagination-wrapper';
import { PageBody } from '@/components/custom/page-body';
import CustomBreadcrumb from '@/components/custom/custom-breadcrumb';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function PermissionPage() {
  const [permissions, setPermissions] = useState<PermissionRes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionRes | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const pageSize = 10;

  const columns: ColumnDef<PermissionRes>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue('id')}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Tên quyền',
      cell: ({ row }) => {
        const name = row.getValue('name') as string;
        return <Badge variant='outline'>{name}</Badge>;
      },
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
    },
    {
      accessorKey: 'created_at',
      header: 'Ngày tạo',
      cell: ({ row }) => {
        return new Date(row.getValue('created_at')).toLocaleDateString('vi-VN');
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleEditPermission(permission)}
            >
              Sửa
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => {
                setSelectedPermission(permission);
                setOpenConfirmDialog(true);
              }}
            >
              Xóa
            </Button>
          </div>
        );
      },
    },
  ];

  const fetchPermissions = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await getAllPermissions({
        page,
        size: pageSize,
        search: searchKey,
      });

      setPermissions(response.permissions || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(Number(response.currentPage) || 1);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Không thể tải danh sách quyền');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions(currentPage);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPermissions(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddPermission = () => {
    setSelectedPermission(null);
    setOpenDialog(true);
  };

  const handleEditPermission = (permission: PermissionRes) => {
    setSelectedPermission(permission);
    setOpenDialog(true);
  };

  const handleDeletePermission = async (id: number) => {
    try {
      await deletePermission(id);
      toast.success('Xóa quyền thành công');
      fetchPermissions(currentPage);
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Không thể xóa quyền');
    }
  };

  const handleDialogClose = (refresh: boolean = false) => {
    setOpenDialog(false);
    if (refresh) {
      fetchPermissions(currentPage);
    }
  };

  return (
    <AdminGuard>
      <>
        <PermissionDialog
          open={openDialog}
          onClose={handleDialogClose}
          permission={selectedPermission}
        />

        <ConfirmDialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          title='Xác nhận xóa'
          description='Bạn có chắc chắn muốn xóa quyền này không? Hành động này không thể hoàn tác.'
          onConfirm={() => {
            if (selectedPermission) {
              handleDeletePermission(selectedPermission.id);
              setOpenConfirmDialog(false);
            }
          }}
        />

        <PageBody>
          <div className='flex flex-col gap-4 col-span-12 md:col-span-12'>
            <CustomBreadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Quản lý quyền hạn' },
              ]}
            />
            <h1 className='text-xl font-medium'>Quản lý quyền hạn</h1>

            <div>
              <div className='grid grid-cols-12'>
                <div className='relative w-full col-span-6'>
                  <Input
                    className='pl-9'
                    placeholder='Tìm kiếm quyền...'
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                  <Search className='absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground' />
                </div>
                <div className='col-span-6 flex justify-end'>
                  <Button onClick={handleAddPermission}>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Thêm quyền mới
                  </Button>
                </div>
              </div>

              <div className='mt-4'>
                <div className='rounded-md border'>
                  {isLoading ? (
                    <div className='flex items-center justify-center h-32 text-muted-foreground'>
                      Đang tải...
                    </div>
                  ) : !permissions || permissions.length === 0 ? (
                    <div className='flex items-center justify-center h-32 text-muted-foreground'>
                      Chưa có quyền nào
                    </div>
                  ) : (
                    <DataTable
                      columns={columns}
                      data={permissions}
                      isLoading={isLoading}
                      searchPlaceholder='Tìm kiếm quyền...'
                      searchColumn='name'
                    />
                  )}
                </div>
                {totalPages > 1 && (
                  <PaginationWrapper
                    className='justify-end mt-4'
                    totalPage={totalPages}
                    selectedPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </div>
          </div>
        </PageBody>
      </>
    </AdminGuard>
  );
}
