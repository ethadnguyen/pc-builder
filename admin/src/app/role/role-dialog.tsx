'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createRole, updateRole, Role } from '@/services/modules/role.service';
import {
  getAllPermissions,
  Permission,
} from '@/services/modules/permission.service';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface RoleDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  role: Role | null;
}

export function RoleDialog({ open, onClose, role }: RoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchPermissions();
      if (role) {
        setName(role.name);
        setDescription(role.description);
        setSelectedPermissions(role.permissions.map((p) => p.id));
      } else {
        setName('');
        setDescription('');
        setSelectedPermissions([]);
      }
    }
  }, [open, role]);

  const fetchPermissions = async () => {
    try {
      const response = await getAllPermissions({ size: 1000 });
      setPermissions(response.permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Không thể tải danh sách quyền');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên vai trò không được để trống');
      return;
    }

    setIsLoading(true);
    try {
      const permissionIds = selectedPermissions.map((id) => Number(id));

      const data = {
        name,
        description,
        permission_ids: permissionIds,
      };

      if (role) {
        await updateRole(data);
        toast.success('Cập nhật vai trò thành công');
      } else {
        await createRole(data);
        toast.success('Tạo vai trò thành công');
      }
      onClose(true);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Lỗi khi lưu vai trò');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {role ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='name' className='text-right'>
                Tên vai trò
              </Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='col-span-3'
                placeholder='Nhập tên vai trò'
                disabled={isLoading || (!!role && !!role.id)}
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='description' className='text-right'>
                Mô tả
              </Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='col-span-3'
                placeholder='Nhập mô tả vai trò'
                disabled={isLoading}
              />
            </div>
            <div className='grid grid-cols-4 gap-4'>
              <Label className='text-right pt-2'>Quyền hạn</Label>
              <div className='col-span-3 space-y-4'>
                <Input
                  placeholder='Tìm kiếm quyền...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='mb-2'
                />

                {selectedPermissions.length > 0 && (
                  <div className='flex flex-wrap gap-1 mb-2'>
                    {permissions
                      .filter((p) => selectedPermissions.includes(p.id))
                      .map((p) => (
                        <Badge
                          key={p.id}
                          variant='secondary'
                          className='px-2 py-1'
                        >
                          {p.name}
                        </Badge>
                      ))}
                  </div>
                )}

                <div className='h-40 overflow-y-auto p-2 border rounded'>
                  {filteredPermissions.length > 0 ? (
                    filteredPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className='flex items-center space-x-2 py-1 border-b last:border-0'
                      >
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() =>
                            handlePermissionChange(permission.id)
                          }
                          disabled={isLoading}
                        />
                        <div className='space-y-1 flex-1'>
                          <Label
                            htmlFor={`permission-${permission.id}`}
                            className='text-sm font-medium'
                          >
                            {permission.name}
                          </Label>
                          <p className='text-xs text-muted-foreground'>
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className='text-center text-sm text-muted-foreground py-4'>
                      {searchQuery
                        ? 'Không tìm thấy quyền phù hợp'
                        : 'Chưa có quyền nào'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              type='button'
              onClick={() => onClose()}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
