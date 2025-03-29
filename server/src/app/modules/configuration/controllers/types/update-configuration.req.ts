import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from 'src/app/modules/products/enums/product-type.enum';

class ComponentIdDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsNumber()
  product_id: number;

  @ApiProperty({
    enum: ProductType,
    description: 'Loại sản phẩm',
  })
  @IsEnum(ProductType)
  product_type: ProductType;
}

export class UpdateConfigurationReq {
  @ApiProperty({ description: 'ID của cấu hình cần cập nhật' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Tên cấu hình', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Mô tả cấu hình',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: [ComponentIdDto],
    description: 'Danh sách ID và loại của các sản phẩm trong cấu hình',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ComponentIdDto)
  component_ids?: ComponentIdDto[];

  @ApiProperty({
    description: 'Cấu hình có công khai không',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;
}
