import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class WishlistRepository {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
  ) {}

  async findWishlistItem(userId: string, productId: number): Promise<Wishlist> {
    return this.wishlistRepository.findOne({
      where: { userId, productId },
      relations: ['product', 'product.brand'],
    });
  }

  async findAllByUserId(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['product', 'product.brand'],
    });
  }

  async createWishlistItem(
    userId: string,
    productId: number,
  ): Promise<Wishlist> {
    const wishlistItem = this.wishlistRepository.create({
      userId,
      productId,
    });
    return this.wishlistRepository.save(wishlistItem);
  }

  async removeWishlistItem(userId: string, productId: number): Promise<void> {
    await this.wishlistRepository.delete({ userId, productId });
  }
}
