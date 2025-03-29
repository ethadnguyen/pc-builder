import { BadRequestException, Injectable } from '@nestjs/common';
import { PromotionRepository } from '../repositories/promotion.repositories';
import { ProductRepository } from '../../products/repositories/products.repositories';
import { CategoryRepository } from '../../categories/repositories/categories.repositories';
import { DiscountType } from '../enums/discount-type.enum';
import { Promotion } from '../entities/promotion.entity';
import { Product } from '../../products/entities/products.entity';
import { Repository } from 'typeorm';
import { GetAllPromotionInput } from './types/get.all.promotion.input';
import { ErrorMessage } from 'src/common/enum/error.message.enum';
import { CreatePromotionInput } from './types/create-promotion.input';
import { UpdatePromotionInput } from './types/update-promotion.input';
import { Category } from '../../categories/entities/categories.entity';
import { ProductRes } from '../../products/controllers/types/product.res';

@Injectable()
export class PromotionService {
  constructor(
    private readonly promotionRepository: PromotionRepository,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async findAllPromotions(queryParams: GetAllPromotionInput) {
    const {
      page = 1,
      size = 10,
      search,
      product_id,
      category_id,
      start_date,
      end_date,
      discount_type,
    } = queryParams;

    const [promotions, total] = await this.promotionRepository.findAll(
      { skip: (page - 1) * size, take: size },
      search,
      product_id,
      category_id,
      start_date,
      end_date,
      discount_type,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      promotions,
    };
  }

  async getPromotionById(id: number) {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new BadRequestException(ErrorMessage.PROMOTION_NOT_FOUND);
    }

    return promotion;
  }

  async createPromotion(input: CreatePromotionInput) {
    console.log('promotion input', input);
    let promotion = new Promotion();
    promotion.name = input.name;
    promotion.description = input.description;
    promotion.discount_type = input.discount_type;
    promotion.discount_value = input.discount_value;
    promotion.maximum_discount_amount = input.maximum_discount_amount;
    promotion.minimum_order_amount = input.minimum_order_amount;
    promotion.start_date = input.start_date;
    promotion.end_date = input.end_date;
    promotion.is_active = input.is_active;
    promotion.usage_limit = input.usage_limit;
    promotion.used_count = 0;

    let products: Product[] = [];
    if (input.product_ids) {
      products = await this.productRepository.findByIds(input.product_ids);
      promotion.products = products;

      // Cập nhật trạng thái giảm giá cho sản phẩm
      await this.updateProductSaleStatus(products, promotion);
    }

    if (input.category_ids) {
      const categories = await this.categoryRepository.findByIds(
        input.category_ids,
      );
      promotion.categories = categories;

      // Cập nhật trạng thái is_sale cho các danh mục
      const isActive = this.isPromotionActive(promotion);
      for (const category of categories) {
        category.is_sale = isActive;
        await this.categoryRepository.update(category);
      }

      // Nếu có danh mục, lấy tất cả sản phẩm thuộc danh mục đó và cập nhật
      if (categories.length > 0) {
        const productsInCategories =
          await this.productRepository.findByCategories(
            categories.map((cat) => cat.id),
          );
        // Loại bỏ các sản phẩm đã được thêm trực tiếp để tránh trùng lặp
        const uniqueProducts = productsInCategories.filter(
          (p) => !products.some((existingP) => existingP.id === p.id),
        );
        await this.updateProductSaleStatus(
          [...products, ...uniqueProducts],
          promotion,
        );
      }
    }

    return await this.promotionRepository.create(promotion);
  }

  async updatePromotion(input: UpdatePromotionInput) {
    console.log('promotion input', input);
    const promotion = await this.promotionRepository.findById(input.id);
    if (!promotion) {
      throw new BadRequestException(ErrorMessage.PROMOTION_NOT_FOUND);
    }

    // Lưu lại danh sách sản phẩm và danh mục cũ để reset trạng thái giảm giá
    const oldProducts = [...(promotion.products || [])];
    const oldCategories = [...(promotion.categories || [])];

    Object.assign(promotion, {
      name: input.name,
      description: input.description,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      maximum_discount_amount: input.maximum_discount_amount,
      minimum_order_amount: input.minimum_order_amount,
      start_date: input.start_date,
      end_date: input.end_date,
      is_active: input.is_active,
      usage_limit: input.usage_limit,
      used_count: input.used_count,
    });

    let newProducts: Product[] = [];
    if (input.product_ids) {
      newProducts = await this.productRepository.findByIds(input.product_ids);
      promotion.products = newProducts;
    }

    let newCategories: Category[] = [];
    if (input.category_ids) {
      newCategories = await this.categoryRepository.findByIds(
        input.category_ids,
      );
      promotion.categories = newCategories;

      // Cập nhật trạng thái is_sale cho các danh mục mới
      const isActive = this.isPromotionActive(promotion);
      for (const category of newCategories) {
        category.is_sale = isActive;
        await this.categoryRepository.update(category);
      }
    }

    const updatedPromotion = await this.promotionRepository.save(promotion);

    await this.resetProductSaleStatus(
      oldProducts,
      oldCategories,
      newProducts,
      newCategories,
    );

    // Cập nhật trạng thái giảm giá cho các sản phẩm mới
    await this.updateProductSaleStatus(newProducts, promotion);

    // Nếu có danh mục, cập nhật tất cả sản phẩm thuộc danh mục đó
    if (newCategories.length > 0) {
      const productsInCategories =
        await this.productRepository.findByCategories(
          newCategories.map((cat) => cat.id),
        );
      // Loại bỏ các sản phẩm đã được thêm trực tiếp để tránh trùng lặp
      const uniqueProducts = productsInCategories.filter(
        (p) => !newProducts.some((existingP) => existingP.id === p.id),
      );
      await this.updateProductSaleStatus(uniqueProducts, promotion);
    }

    return updatedPromotion;
  }

  async calculateDiscount(
    promotionId: number,
    products: { productId: number; quantity: number }[],
    incrementUsage: boolean = false,
  ) {
    const promotion = await this.promotionRepository.findById(promotionId);

    if (!promotion || !this.isPromotionValid(promotion)) {
      return {
        discountAmount: 0,
        applicableProducts: [],
        isValid: false,
        message: 'Khuyến mãi không hợp lệ hoặc đã hết hạn',
      };
    }

    const productDetails = await Promise.all(
      products.map(async (item) => ({
        product: await this.productRepository.findById(item.productId),
        quantity: item.quantity,
      })),
    );

    const applicableProducts = this.getApplicableProducts(
      promotion,
      productDetails,
    );
    const subtotal = this.calculateSubtotal(applicableProducts);

    if (
      promotion.minimum_order_amount &&
      subtotal < promotion.minimum_order_amount
    ) {
      return {
        discountAmount: 0,
        applicableProducts: [],
        isValid: false,
        message: 'Chưa đạt giá trị đơn hàng tối thiểu',
      };
    }

    const discountAmount = this.calculateDiscountAmount(promotion, subtotal);

    if (incrementUsage && discountAmount > 0) {
      await this.incrementUsedCount(promotionId);
    }

    return {
      discountAmount,
      applicableProducts: applicableProducts.map((item) => item.product),
      isValid: true,
    };
  }

  async deletePromotion(id: number): Promise<void> {
    const promotion = await this.promotionRepository.findById(id);
    if (promotion) {
      // Reset trạng thái giảm giá cho tất cả sản phẩm trong promotion
      const products = [...(promotion.products || [])];

      // Reset trạng thái giảm giá cho các danh mục trong promotion
      if (promotion.categories && promotion.categories.length > 0) {
        for (const category of promotion.categories) {
          category.is_sale = false;
          await this.categoryRepository.update(category);
        }

        // Lấy tất cả sản phẩm thuộc danh mục trong promotion
        const productsInCategories =
          await this.productRepository.findByCategories(
            promotion.categories.map((cat) => cat.id),
          );
        // Loại bỏ các sản phẩm đã được thêm trực tiếp để tránh trùng lặp
        const uniqueProducts = productsInCategories.filter(
          (p) => !products.some((existingP) => existingP.id === p.id),
        );
        products.push(...uniqueProducts);
      }

      // Reset trạng thái giảm giá cho sản phẩm
      for (const product of products) {
        product.is_sale = false;
        product.sale_price = 0;
        await this.productRepository.update(product);
      }
    }

    await this.promotionRepository.delete(id);
  }

  private isPromotionValid(promotion: Promotion) {
    const now = new Date();
    return (
      promotion.is_active &&
      now >= new Date(promotion.start_date) &&
      now <= new Date(promotion.end_date) &&
      (!promotion.usage_limit || promotion.used_count < promotion.usage_limit)
    );
  }

  private isPromotionActive(promotion: Promotion) {
    const now = new Date();
    return (
      promotion.is_active &&
      now >= new Date(promotion.start_date) &&
      now <= new Date(promotion.end_date)
    );
  }

  private getApplicableProducts(
    promotion: Promotion,
    products: { product: Product; quantity: number }[],
  ): { product: Product; quantity: number }[] {
    return products.filter((item) => {
      const productInPromotion = promotion.products?.some(
        (p) => p.id === item.product.id,
      );
      const categoryInPromotion = promotion.categories?.some((c) =>
        item.product.categories?.some((pc) => pc.id === c.id),
      );
      return productInPromotion || categoryInPromotion;
    });
  }

  private calculateSubtotal(
    products: { product: Product; quantity: number }[],
  ): number {
    return products.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  }

  private calculateDiscountAmount(
    promotion: Promotion,
    subtotal: number,
  ): number {
    let discountAmount = 0;

    if (promotion.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = (subtotal * promotion.discount_value) / 100;
      if (promotion.maximum_discount_amount) {
        discountAmount = Math.min(
          discountAmount,
          promotion.maximum_discount_amount,
        );
      }
    } else {
      discountAmount = promotion.discount_value;
    }

    return discountAmount;
  }

  private async updateProductSaleStatus(
    products: Product[],
    promotion: Promotion,
  ): Promise<void> {
    if (!products || products.length === 0) {
      return;
    }

    const isPromotionActive = this.isPromotionActive(promotion);

    if (!isPromotionActive) {
      for (const product of products) {
        product.is_sale = false;
        product.sale_price = 0;
        await this.productRepository.update(product);
      }
      return;
    }

    if (isPromotionActive) {
      for (const product of products) {
        let salePrice = product.price;

        if (promotion.discount_type === DiscountType.PERCENTAGE) {
          salePrice =
            product.price - (product.price * promotion.discount_value) / 100;
          if (
            promotion.maximum_discount_amount &&
            product.price - salePrice > promotion.maximum_discount_amount
          ) {
            salePrice = product.price - promotion.maximum_discount_amount;
          }
        } else if (promotion.discount_type === DiscountType.FIXED) {
          salePrice = product.price - promotion.discount_value;
          if (salePrice < 0) salePrice = 0;
        }

        salePrice = Math.round(salePrice);

        product.is_sale = true;
        product.sale_price = salePrice;
        await this.productRepository.update(product);
      }
    }
  }

  private async resetProductSaleStatus(
    oldProducts: Product[],
    oldCategories: Category[],
    newProducts: Product[],
    newCategories: Category[],
  ): Promise<void> {
    const removedProducts = oldProducts.filter(
      (oldP) => !newProducts.some((newP) => newP.id === oldP.id),
    );

    const removedCategories = oldCategories.filter(
      (oldC) => !newCategories.some((newC) => newC.id === oldC.id),
    );

    for (const product of removedProducts) {
      product.is_sale = false;
      product.sale_price = 0;
      await this.productRepository.update(product);
    }

    for (const category of removedCategories) {
      category.is_sale = false;
      await this.categoryRepository.update(category);
    }

    if (removedCategories.length > 0) {
      const productsInRemovedCategories =
        await this.productRepository.findByCategories(
          removedCategories.map((cat) => cat.id),
        );

      const uniqueProducts = productsInRemovedCategories.filter(
        (p) => !newProducts.some((newP) => newP.id === p.id),
      );

      for (const product of uniqueProducts) {
        product.is_sale = false;
        product.sale_price = 0;
        await this.productRepository.update(product);
      }
    }
  }

  async incrementUsedCount(promotionId: number): Promise<Promotion> {
    const promotion = await this.promotionRepository.findById(promotionId);

    if (!promotion) {
      throw new BadRequestException(ErrorMessage.PROMOTION_NOT_FOUND);
    }

    if (!this.isPromotionValid(promotion)) {
      throw new BadRequestException('Khuyến mãi không hợp lệ hoặc đã hết hạn');
    }

    promotion.used_count += 1;

    if (
      promotion.usage_limit &&
      promotion.used_count >= promotion.usage_limit
    ) {
      promotion.is_active = false;

      if (promotion.categories && promotion.categories.length > 0) {
        for (const category of promotion.categories) {
          category.is_sale = false;
          await this.categoryRepository.update(category);
        }
      }
    }

    return await this.promotionRepository.save(promotion);
  }

  async checkExpiringPromotions() {
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const expiringPromotions =
        await this.promotionRepository.findExpiringPromotions();

      if (expiringPromotions.length > 0) {
        const formattedPromotions = expiringPromotions.map((promo) => {
          const expiryDate = new Date(promo.end_date);
          const differenceInTime = expiryDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(
            differenceInTime / (1000 * 3600 * 24),
          );

          return {
            id: promo.id,
            name: promo.name,
            code: promo.name.substring(0, 8),
            expiryDate: promo.end_date,
            daysRemaining: daysRemaining,
            discountValue: promo.discount_value,
            discountType: promo.discount_type,
          };
        });

        try {
          const response = await fetch(
            'http://localhost:3003/notify/expiring-promotions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ promotions: formattedPromotions }),
            },
          );

          const result = await response.json();

          return {
            success: true,
            message: `Đã gửi thông báo cho ${expiringPromotions.length} khuyến mãi sắp hết hạn`,
            count: expiringPromotions.length,
            socketResponse: result,
          };
        } catch (error) {
          console.error('Lỗi khi gửi thông báo qua socket:', error);
          return {
            success: false,
            message: 'Đã xảy ra lỗi khi gửi thông báo qua socket',
            count: expiringPromotions.length,
            error,
          };
        }
      }

      return {
        success: true,
        message: 'Không có khuyến mãi nào sắp hết hạn',
        count: 0,
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra khuyến mãi sắp hết hạn:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi kiểm tra khuyến mãi sắp hết hạn',
        error,
      };
    }
  }
}
