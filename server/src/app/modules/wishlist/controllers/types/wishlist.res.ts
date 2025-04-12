import { ApiProperty } from '@nestjs/swagger';
import { ProductRes } from 'src/app/modules/products/controllers/types/product.res';

export class WishlistItemRes {
  @ApiProperty({ description: 'ID của mục yêu thích' })
  id: number;

  @ApiProperty({ description: 'ID của người dùng' })
  userId: string;

  @ApiProperty({ description: 'ID của sản phẩm' })
  productId: number;

  @ApiProperty({ description: 'Thông tin sản phẩm' })
  product: ProductRes;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updatedAt: Date;
}

export class WishlistListRes {
  @ApiProperty({
    type: [WishlistItemRes],
    description: 'Danh sách sản phẩm yêu thích',
  })
  items: WishlistItemRes[];
}

export class WishlistCheckRes {
  @ApiProperty({
    description: 'Trạng thái sản phẩm trong danh sách yêu thích',
    example: true,
  })
  inWishlist: boolean;
}
