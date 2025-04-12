'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AdminGuard } from '@/components/custom/admin-guard';
import { DataTable } from '@/components/tables/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { getAllRoles, deleteRole } from '@/services/modules/role.service';
import { PlusIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import { RoleDialog } from './role-dialog';
import { Badge } from '@/components/ui/badge';
import { RoleRes } from '@/services/types/response/role.res';
import PaginationWrapper from '@/components/custom/pagination-wrapper';
import { PageBody } from '@/components/custom/page-body';
import CustomBreadcrumb from '@/components/custom/custom-breadcrumb';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function RolePage() {
  const [roles, setRoles] = useState<RoleRes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleRes | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const pageSize = 10;

  const toggleRowExpanded = (name: string) => {
    setExpandedRows((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const columns: ColumnDef<RoleRes>[] = [
    {
      id: 'expand',
      cell: ({ row }) => {
        const role = row.original;
        const isExpanded = expandedRows.includes(role.name);

        return (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => toggleRowExpanded(role.name)}
            className={role.permissions.length === 0 ? 'opacity-30' : ''}
            disabled={role.permissions.length === 0}
          >
            {isExpanded ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Tên vai trò',
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
        const role = row.original;
        return (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleEditRole(role)}
            >
              Sửa
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => {
                setSelectedRole(role);
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

  const fetchRoles = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await getAllRoles({
        page,
        size: pageSize,
        search: searchKey,
      });

      setRoles(response.data.roles || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(Number(response.data.currentPage) || 1);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Không thể tải danh sách vai trò');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(currentPage);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRoles(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setOpenDialog(true);
  };

  const handleEditRole = (role: RoleRes) => {
    setSelectedRole(role);
    setOpenDialog(true);
  };

  const handleDeleteRole = async (name: string) => {
    try {
      await deleteRole(name);
      toast.success('Xóa vai trò thành công');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Không thể xóa vai trò');
    }
  };

  const handleDialogClose = (refresh: boolean = false) => {
    setOpenDialog(false);
    if (refresh) {
      fetchRoles();
    }
  };

  const RolePermissions = ({ role }: { role: RoleRes }) => {
    if (role.permissions.length === 0) {
      return (
        <div className='px-6 py-3 text-sm text-muted-foreground'>
          Không có quyền nào được cấp
        </div>
      );
    }

    return (
      <div className='px-6 py-3'>
        <h3 className='font-medium mb-2'>Danh sách quyền:</h3>
        <div className='flex flex-wrap gap-1 max-w-full'>
          {role.permissions.map((permission) => (
            <Badge key={permission.id} variant='outline' className='mb-1'>
              {permission.name}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AdminGuard>
      <>
        <RoleDialog
          open={openDialog}
          onClose={handleDialogClose}
          role={selectedRole}
        />

        <ConfirmDialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          title='Xác nhận xóa'
          description='Bạn có chắc chắn muốn xóa vai trò này không? Hành động này không thể hoàn tác.'
          onConfirm={() => {
            if (selectedRole) {
              handleDeleteRole(selectedRole.name);
              setOpenConfirmDialog(false);
            }
          }}
        />

        <PageBody>
          <div className='flex flex-col gap-4 col-span-12 md:col-span-12'>
            <CustomBreadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Quản lý vai trò' },
              ]}
            />
            <h1 className='text-xl font-medium'>Quản lý vai trò</h1>

            <div>
              <div className='grid grid-cols-12'>
                <div className='relative w-full col-span-6'>
                  <Input
                    className='pl-9'
                    placeholder='Tìm kiếm vai trò...'
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
                  <Button onClick={handleAddRole}>
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Thêm vai trò mới
                  </Button>
                </div>
              </div>

              <div className='mt-4'>
                <div className='rounded-md border'>
                  {isLoading ? (
                    <div className='flex items-center justify-center h-32 text-muted-foreground'>
                      Đang tải...
                    </div>
                  ) : !roles || roles.length === 0 ? (
                    <div className='flex items-center justify-center h-32 text-muted-foreground'>
                      Chưa có vai trò nào
                    </div>
                  ) : (
                    <DataTable
                      columns={columns}
                      data={roles}
                      isLoading={isLoading}
                      searchPlaceholder='Tìm kiếm vai trò...'
                      searchColumn='name'
                    />
                  )}
                </div>

                {/* Hiển thị permissions của role được chọn */}
                <div className='space-y-2 mt-4'>
                  {roles
                    .filter((role) => expandedRows.includes(role.name))
                    .map((role) => (
                      <div
                        key={role.name}
                        className='border rounded-md mb-2 overflow-hidden'
                      >
                        <div className='bg-muted/40 px-4 py-2 font-medium flex justify-between items-center'>
                          <span>Quyền của vai trò: {role.name}</span>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => toggleRowExpanded(role.name)}
                          >
                            <ChevronUp className='h-4 w-4' />
                          </Button>
                        </div>
                        <RolePermissions role={role} />
                      </div>
                    ))}
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
