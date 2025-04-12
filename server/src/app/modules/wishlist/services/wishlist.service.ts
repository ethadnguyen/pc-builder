import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WishlistRepository } from '../repositories/wishlist.repositories';
import { CreateWishlistReq } from '../controllers/types/create-wishlist.req';
import { Wishlist } from '../entities/wishlist.entity';
import {
  AddToWishlistInput,
  RemoveFromWishlistInput,
  CheckWishlistInput,
} from './types/wishlist.input';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly jwtService: JwtService,
  ) {}

  getUserIdFromToken(authorization: string): string {
    try {
      if (!authorization) {
        throw new UnauthorizedException('Không có token');
      }

      const token = authorization.split(' ')[1];
      const decodedToken = this.jwtService.decode(token);

      if (!decodedToken || !decodedToken.user_id) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      return decodedToken.user_id;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  async addToWishlist(
    authorization: string,
    createWishlistReq: CreateWishlistReq,
  ) {
    const userId = this.getUserIdFromToken(authorization);
    const { productId } = createWishlistReq;

    const input: AddToWishlistInput = {
      userId,
      productId,
    };

    return this.addToWishlistWithInput(input);
  }

  async addToWishlistWithInput(input: AddToWishlistInput) {
    const { userId, productId } = input;

    // Kiểm tra xem sản phẩm đã có trong wishlist chưa
    const existingItem = await this.wishlistRepository.findWishlistItem(
      userId,
      productId,
    );

    if (existingItem) {
      throw new ConflictException(
        'Sản phẩm đã tồn tại trong danh sách yêu thích',
      );
    }

    return this.wishlistRepository.createWishlistItem(userId, productId);
  }

  async getUserWishlist(authorization: string) {
    const userId = this.getUserIdFromToken(authorization);
    return this.wishlistRepository.findAllByUserId(userId);
  }

  async removeFromWishlist(authorization: string, productId: number) {
    const userId = this.getUserIdFromToken(authorization);

    const input: RemoveFromWishlistInput = {
      userId,
      productId,
    };

    return this.removeFromWishlistWithInput(input);
  }

  async removeFromWishlistWithInput(input: RemoveFromWishlistInput) {
    const { userId, productId } = input;

    const existingItem = await this.wishlistRepository.findWishlistItem(
      userId,
      productId,
    );

    if (!existingItem) {
      throw new NotFoundException(
        'Không tìm thấy sản phẩm trong danh sách yêu thích',
      );
    }

    await this.wishlistRepository.removeWishlistItem(userId, productId);
  }

  async checkInWishlist(authorization: string, productId: number) {
    const userId = this.getUserIdFromToken(authorization);

    const input: CheckWishlistInput = {
      userId,
      productId,
    };

    return this.checkInWishlistWithInput(input);
  }

  async checkInWishlistWithInput(input: CheckWishlistInput) {
    const { userId, productId } = input;

    const item = await this.wishlistRepository.findWishlistItem(
      userId,
      productId,
    );
    return !!item;
  }
}
