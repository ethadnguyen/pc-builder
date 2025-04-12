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
import {
  createPermission,
  updatePermission,
  Permission,
} from '@/services/modules/permission.service';

interface PermissionDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  permission: Permission | null;
}

export function PermissionDialog({
  open,
  onClose,
  permission,
}: PermissionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && permission) {
      setName(permission.name);
      setDescription(permission.description);
    } else if (open) {
      setName('');
      setDescription('');
    }
  }, [open, permission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên quyền không được để trống');
      return;
    }

    setIsLoading(true);
    try {
      if (permission) {
        await updatePermission({
          id: permission.id,
          name,
          description,
        });
        toast.success('Cập nhật quyền thành công');
      } else {
        await createPermission({
          name,
          description,
        });
        toast.success('Tạo quyền thành công');
      }
      onClose(true);
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error('Lỗi khi lưu quyền');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {permission ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='name' className='text-right'>
                Tên quyền
              </Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='col-span-3'
                placeholder='Nhập tên quyền'
                disabled={isLoading}
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
                placeholder='Nhập mô tả quyền'
                disabled={isLoading}
              />
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
