import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateWishlistReq {
  @ApiProperty({
    description: 'ID của sản phẩm cần thêm vào danh sách yêu thích',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
