import { Edit, Star, Trash, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ReviewCardProps {
  id: string;
  author: string;
  avatar?: string;
  date: string;
  rating: number;
  content: string;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id,
  author,
  avatar,
  date,
  rating,
  content,
  isOwner = false,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Avatar>
            {avatar && <AvatarImage src={avatar} alt={author} />}
            <AvatarFallback>
              <User className='h-4 w-4' />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='font-medium'>{author}</p>
            <p className='text-xs text-muted-foreground'>{date}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < rating
                    ? 'fill-primary text-primary'
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
          {isOwner && (
            <div className='flex items-center gap-1 ml-2'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={onEdit}
                title='Chỉnh sửa'
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-destructive hover:text-destructive'
                onClick={onDelete}
                title='Xóa'
              >
                <Trash className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </div>
      <p className='text-sm text-card-foreground'>{content}</p>
    </div>
  );
}
