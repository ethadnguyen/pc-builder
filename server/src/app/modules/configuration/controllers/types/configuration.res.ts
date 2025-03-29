import { ApiProperty } from '@nestjs/swagger';
import { UserRes } from '../../../users/controllers/types/user.res';
import { ProductType } from 'src/app/modules/products/enums/product-type.enum';

class ComponentIdDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  product_id: number;

  @ApiProperty({
    enum: ProductType,
    description: 'Loại sản phẩm',
  })
  product_type: ProductType;
}

class CompatibilityResultDto {
  @ApiProperty({ description: 'Kết quả tương thích' })
  isCompatible: boolean;

  @ApiProperty({ description: 'Danh sách thông báo', type: [String] })
  messages: string[];
}

export class ConfigurationRes {
  @ApiProperty({ description: 'ID của cấu hình' })
  id: number;

  @ApiProperty({ description: 'ID của người dùng' })
  user_id: number;

  @ApiProperty({ description: 'Thông tin người dùng', type: UserRes })
  user: UserRes;

  @ApiProperty({ description: 'Tên cấu hình' })
  name: string;

  @ApiProperty({ description: 'Mô tả cấu hình' })
  description: string;

  @ApiProperty({
    type: [ComponentIdDto],
    description: 'Danh sách ID và loại của các sản phẩm trong cấu hình',
  })
  component_ids: ComponentIdDto[];

  @ApiProperty({ description: 'Cấu hình có công khai không' })
  is_public: boolean;

  @ApiProperty({ description: 'Kết quả kiểm tra tương thích' })
  compatibility_result: CompatibilityResultDto;

  @ApiProperty({ description: 'Tổng giá tiền' })
  total_price: number;

  @ApiProperty({ description: 'Ngày tạo' })
  created_at: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updated_at: Date;
}
