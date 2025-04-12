import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import { WishlistService } from '../services/wishlist.service';
import { CreateWishlistReq } from '../controllers/types/create-wishlist.req';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  WishlistItemRes,
  WishlistListRes,
  WishlistCheckRes,
} from './types/wishlist.res';
import { plainToClass } from 'class-transformer';

@ApiTags('wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm sản phẩm vào danh sách yêu thích' })
  @ApiResponse({
    status: 201,
    description: 'Thêm thành công',
    type: WishlistItemRes,
  })
  @ApiResponse({
    status: 409,
    description: 'Sản phẩm đã tồn tại trong danh sách yêu thích',
  })
  async addToWishlist(
    @Headers('authorization') authorization: string,
    @Body() createWishlistReq: CreateWishlistReq,
  ): Promise<WishlistItemRes> {
    const wishlist = await this.wishlistService.addToWishlist(
      authorization,
      createWishlistReq,
    );
    return plainToClass(WishlistItemRes, wishlist);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm yêu thích của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm yêu thích',
    type: WishlistListRes,
  })
  async getUserWishlist(
    @Headers('authorization') authorization: string,
  ): Promise<WishlistListRes> {
    const wishlists = await this.wishlistService.getUserWishlist(authorization);
    return {
      items: wishlists.map((wishlist) =>
        plainToClass(WishlistItemRes, wishlist),
      ),
    };
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi danh sách yêu thích' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm trong danh sách yêu thích',
  })
  async removeFromWishlist(
    @Headers('authorization') authorization: string,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    return this.wishlistService.removeFromWishlist(authorization, productId);
  }

  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kiểm tra sản phẩm có trong danh sách yêu thích không',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra',
    type: WishlistCheckRes,
  })
  async checkInWishlist(
    @Headers('authorization') authorization: string,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<WishlistCheckRes> {
    const result = await this.wishlistService.checkInWishlist(
      authorization,
      productId,
    );
    return { inWishlist: result };
  }
}
