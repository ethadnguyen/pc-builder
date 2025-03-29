import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDate } from 'class-validator';

export class OrderRes {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsNumber()
  total_price: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  original_price?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  discount_amount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  promotion_id?: number;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsString()
  payment_status: string;

  @ApiProperty()
  @IsString()
  payment_method: string;

  @ApiProperty()
  @IsDate()
  paid_at: Date;

  @ApiProperty()
  @IsString()
  created_at: string;
}
