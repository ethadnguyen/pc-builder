'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Component {
  id: string;
  type: string;
  name: string;
  image: string;
  price: number;
  compatibility: string[];
  brand?: {
    id: number;
    name: string;
  };
}

interface PCBuilderItemProps {
  component: Component;
  onRemove: () => void;
}

export function PCBuilderItem({ component, onRemove }: PCBuilderItemProps) {
  return (
    <div className='flex items-center gap-2 p-2 border rounded-md bg-primary/10 shadow-sm hover:bg-primary/15 transition-colors'>
      <div className='relative h-10 w-10 shrink-0'>
        <img
          src={component.image || '/placeholder.svg'}
          alt={component.name}
          className='object-cover rounded-sm'
        />
      </div>
      <div className='flex-grow min-w-0'>
        <p className='text-sm font-medium truncate'>{component.name}</p>
        <div className='flex justify-between items-center'>
          <p className='text-xs text-muted-foreground'>
            {component.brand?.name || ''}
          </p>
          <p className='text-xs font-medium'>
            {component.price.toLocaleString()}đ
          </p>
        </div>
      </div>
      <Button
        variant='ghost'
        size='sm'
        className='h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive'
        onClick={onRemove}
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}
