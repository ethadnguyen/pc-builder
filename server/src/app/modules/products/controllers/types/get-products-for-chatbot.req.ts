import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationReq } from 'src/common/types/pagination_types/pagination.req';

export class GetProductsForChatbotReq extends PaginationReq {
  @ApiPropertyOptional({ description: 'Filter by name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Filter by min price' })
  @IsOptional()
  @IsNumber()
  @Transform(
    ({ value }) => {
      if (value === undefined || value === '') return undefined;
      return Number(value);
    },
    { toClassOnly: true },
  )
  min_price?: number;

  @ApiPropertyOptional({ description: 'Filter by max price' })
  @IsOptional()
  @IsNumber()
  @Transform(
    ({ value }) => {
      if (value === undefined || value === '') return undefined;
      return Number(value);
    },
    { toClassOnly: true },
  )
  max_price?: number;

  @ApiPropertyOptional({ description: 'Filter by is sale' })
  @IsOptional()
  @IsBoolean()
  is_sale?: boolean;

  @ApiPropertyOptional({ description: 'Filter by brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;
}
