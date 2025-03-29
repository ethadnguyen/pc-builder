import { Injectable, ForbiddenException } from '@nestjs/common';
import { ReviewRepository } from '../repositories/review.repositories';
import { CreateReviewInput } from './types/create-review.input';
import { Review } from '../entities/review.entity';
import { ProductRepository } from '../../products/repositories/products.repositories';
import { UserRepository } from '../../users/repositories/user.repositories';
import { UpdateReviewInput } from './types/update-review.input';
import { GetAllReviewInput } from './types/get.all.review.input';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getAllReviews(queryParams: GetAllReviewInput) {
    const { page = 1, size = 10, product_id } = queryParams;

    const [reviews, total] = await this.reviewRepository.findAll(
      {
        skip: (page - 1) * size,
        take: size,
      },
      product_id,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      reviews,
    };
  }

  async createReview(input: CreateReviewInput, user_id: number) {
    const review = new Review();
    review.rating = input.rating;
    review.comment = input.comment;
    review.user = await this.userRepository.findById(user_id);
    review.product = await this.productRepository.findById(input.product_id);

    const savedReview = await this.reviewRepository.create(review);

    await this.updateProductRating(input.product_id);

    return savedReview;
  }

  async updateReview(input: UpdateReviewInput, user_id: number) {
    const review = await this.reviewRepository.findById(input.id);

    if (review.user.user_id !== user_id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật review này');
    }

    review.rating = input.rating;
    review.comment = input.comment;

    const updatedReview = await this.reviewRepository.update(input.id, review);

    const productId = (await this.reviewRepository.findById(input.id)).product
      .id;
    await this.updateProductRating(productId);

    return updatedReview;
  }

  async deleteReview(id: number, user_id: number) {
    const review = await this.reviewRepository.findById(id);
    if (review.user.user_id !== user_id) {
      throw new ForbiddenException('Bạn không có quyền xóa review này');
    }

    const productId = review.product.id;

    await this.reviewRepository.delete(id);

    await this.updateProductRating(productId);

    return { success: true };
  }

  async getReviewById(id: number) {
    return this.reviewRepository.findById(id);
  }

  private async updateProductRating(productId: number): Promise<void> {
    const averageRating =
      await this.reviewRepository.calculateAverageRating(productId);

    const product = await this.productRepository.findById(productId);

    product.rating = averageRating;

    await this.productRepository.update(product);
  }
}
