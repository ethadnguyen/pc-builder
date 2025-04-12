import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
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
    @Inject(forwardRef(() => ProductRepository))
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
    promotion.products = [];
    promotion.categories = [];

    const hasEmptyProductsAndCategories =
      (!input.product_ids || input.product_ids.length === 0) &&
      (!input.category_ids || input.category_ids.length === 0);

    let products: Product[] = [];
    if (input.product_ids && input.product_ids.length > 0) {
      products = await this.productRepository.findByIds(input.product_ids);
      promotion.products = products;
    }

    if (input.category_ids && input.category_ids.length > 0) {
      const categories = await this.categoryRepository.findByIds(
        input.category_ids,
      );
      promotion.categories = categories;

      const isActive = this.isPromotionActive(promotion);
      for (const category of categories) {
        category.is_sale = isActive;
        await this.categoryRepository.update(category);
      }
    }

    const savedPromotion = await this.promotionRepository.create(promotion);

    if (products.length > 0) {
      await this.updateProductSaleStatus(products, savedPromotion);
    }

    if (promotion.categories && promotion.categories.length > 0) {
      const productsInCategories =
        await this.productRepository.findByCategories(
          promotion.categories.map((cat) => cat.id),
        );
      const uniqueProducts = productsInCategories.filter(
        (p) => !products.some((existingP) => existingP.id === p.id),
      );
      await this.updateProductSaleStatus(uniqueProducts, savedPromotion);
    }

    if (hasEmptyProductsAndCategories) {
      await this.updateProductSaleStatus([], savedPromotion);
    }

    return await this.promotionRepository.findById(savedPromotion.id);
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

    // Kiểm tra nếu input truyền vào mảng rỗng cho cả product_ids và category_ids
    // thì đó là trường hợp áp dụng cho tất cả sản phẩm
    const hasEmptyProductsAndCategories =
      (!input.product_ids || input.product_ids.length === 0) &&
      (!input.category_ids || input.category_ids.length === 0);

    let newProducts: Product[] = [];
    // Nếu có product_ids được chọn
    if (input.product_ids && input.product_ids.length > 0) {
      newProducts = await this.productRepository.findByIds(input.product_ids);
      promotion.products = newProducts;
    } else {
      promotion.products = [];
    }

    let newCategories: Category[] = [];
    // Nếu có category_ids được chọn
    if (input.category_ids && input.category_ids.length > 0) {
      newCategories = await this.categoryRepository.findByIds(
        input.category_ids,
      );
      promotion.categories = newCategories;

      const isActive = this.isPromotionActive(promotion);
      for (const category of newCategories) {
        category.is_sale = isActive;
        await this.categoryRepository.update(category);
      }
    } else {
      promotion.categories = [];
    }

    const updatedPromotion = await this.promotionRepository.save(promotion);

    await this.resetProductSaleStatus(
      oldProducts,
      oldCategories,
      newProducts,
      newCategories,
    );

    // Nếu có sản phẩm mới được chỉ định, cập nhật chúng
    if (newProducts.length > 0) {
      await this.updateProductSaleStatus(newProducts, promotion);
    }

    // Nếu có danh mục mới, cập nhật sản phẩm trong danh mục đó
    if (newCategories.length > 0) {
      const productsInCategories =
        await this.productRepository.findByCategories(
          newCategories.map((cat) => cat.id),
        );
      const uniqueProducts = productsInCategories.filter(
        (p) => !newProducts.some((existingP) => existingP.id === p.id),
      );
      await this.updateProductSaleStatus(uniqueProducts, promotion);
    }

    // Nếu không có danh mục và sản phẩm mới được chỉ định, khuyến mãi áp dụng cho tất cả sản phẩm
    if (hasEmptyProductsAndCategories) {
      await this.updateProductSaleStatus([], promotion);
    }

    return await this.promotionRepository.findById(updatedPromotion.id);
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
      // Thu thập tất cả sản phẩm bị ảnh hưởng
      const affectedProducts = [...(promotion.products || [])];

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
          (p) => !affectedProducts.some((existingP) => existingP.id === p.id),
        );
        affectedProducts.push(...uniqueProducts);
      }

      // Xử lý từng sản phẩm bị ảnh hưởng
      for (const product of affectedProducts) {
        // Lấy tất cả các khuyến mãi đang áp dụng cho sản phẩm (trừ khuyến mãi đang xóa)
        const activePromotions =
          await this.promotionRepository.findActivePromotionsForProduct(
            product.id,
          );
        const otherPromotions = activePromotions.filter(
          (p) => p.id !== promotion.id,
        );

        if (otherPromotions.length === 0) {
          // Nếu không còn khuyến mãi nào khác, reset trạng thái sale
          product.is_sale = false;
          product.sale_price = 0;
        } else {
          // Nếu còn khuyến mãi khác, tính toán lại giá khuyến mãi tốt nhất
          await this.recalculateBestPromotion(product, otherPromotions);
        }

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
    if (
      (!promotion.products || promotion.products.length === 0) &&
      (!promotion.categories || promotion.categories.length === 0)
    ) {
      return products;
    }

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
    if (
      (!products || products.length === 0) &&
      (!promotion.products || promotion.products.length === 0) &&
      (!promotion.categories || promotion.categories.length === 0)
    ) {
      const allProducts = await this.productRepository.findAll(
        { skip: 0, take: 1000 },
        undefined,
        true,
      );

      const [categoriesData] = await this.categoryRepository.findAll({
        take: 1000,
        skip: 0,
      });

      if (categoriesData && categoriesData.length > 0) {
        const fullPromotion = await this.promotionRepository.findById(
          promotion.id,
        );
        const isPromotionActive = this.isPromotionActive(promotion);

        fullPromotion.categories = categoriesData;

        for (const category of categoriesData) {
          category.is_sale = isPromotionActive;
          await this.categoryRepository.update(category);
        }

        await this.promotionRepository.save(fullPromotion);
      }

      if (allProducts[0] && allProducts[0].length > 0) {
        await this.updateProductSaleStatus(allProducts[0], promotion);
      }
      return;
    }

    if (!products || products.length === 0) {
      return;
    }

    const isPromotionActive = this.isPromotionActive(promotion);

    // Lấy promotion đầy đủ với danh sách products
    const fullPromotion = await this.promotionRepository.findById(promotion.id);
    const currentProductIds = fullPromotion?.products?.map((p) => p.id) || [];

    for (const product of products) {
      // Kiểm tra xem sản phẩm đã có trong danh sách products của promotion chưa
      const isProductInPromotion = currentProductIds.includes(product.id);

      // Cập nhật mối quan hệ giữa product và promotion
      if (!isProductInPromotion && isPromotionActive) {
        // Thêm sản phẩm vào khuyến mãi
        if (!fullPromotion.products) {
          fullPromotion.products = [];
        }
        fullPromotion.products.push(product);
      } else if (isProductInPromotion && !isPromotionActive) {
        // Loại bỏ sản phẩm khỏi khuyến mãi
        fullPromotion.products = fullPromotion.products.filter(
          (p) => p.id !== product.id,
        );
      }

      // Cập nhật trạng thái giảm giá của sản phẩm
      if (!isPromotionActive) {
        const productPromotions =
          await this.promotionRepository.findActivePromotionsForProduct(
            product.id,
          );
        const otherPromotions = productPromotions.filter(
          (p) => p.id !== promotion.id,
        );

        if (otherPromotions.length === 0) {
          product.is_sale = false;
          product.sale_price = 0;
        } else {
          await this.recalculateBestPromotion(product, otherPromotions);
        }
      } else {
        const productPromotions =
          await this.promotionRepository.findActivePromotionsForProduct(
            product.id,
          );

        // Đảm bảo promotion hiện tại có trong danh sách
        if (!productPromotions.some((p) => p.id === promotion.id)) {
          productPromotions.push(promotion);
        }

        await this.recalculateBestPromotion(product, productPromotions);
      }

      // Cập nhật sản phẩm
      await this.productRepository.update(product);
    }

    // Lưu khuyến mãi để cập nhật mối quan hệ
    if (isPromotionActive) {
      await this.promotionRepository.save(fullPromotion);
    }
  }

  private async recalculateBestPromotion(
    product: Product,
    promotions: Promotion[],
  ): Promise<void> {
    if (!promotions || promotions.length === 0) {
      product.is_sale = false;
      product.sale_price = 0;
      return;
    }

    // Tách các khuyến mãi theo loại
    const percentagePromotions = promotions.filter(
      (p) => p.discount_type === DiscountType.PERCENTAGE,
    );
    const fixedPromotions = promotions.filter(
      (p) => p.discount_type === DiscountType.FIXED,
    );

    // Giá gốc của sản phẩm
    const originalPrice = product.price;
    let currentPrice = originalPrice;

    // Áp dụng khuyến mãi phần trăm (chỉ áp dụng khuyến mãi phần trăm cao nhất)
    if (percentagePromotions.length > 0) {
      // Sắp xếp theo phần trăm giảm giá từ cao xuống thấp
      percentagePromotions.sort((a, b) => b.discount_value - a.discount_value);
      const bestPercentagePromotion = percentagePromotions[0];

      // Tính số tiền giảm theo phần trăm dựa trên giá gốc
      let percentageDiscount =
        (originalPrice * bestPercentagePromotion.discount_value) / 100;

      // Áp dụng giới hạn giảm giá tối đa nếu có
      if (
        bestPercentagePromotion.maximum_discount_amount &&
        percentageDiscount > bestPercentagePromotion.maximum_discount_amount
      ) {
        percentageDiscount = bestPercentagePromotion.maximum_discount_amount;
      }

      // Áp dụng giảm giá phần trăm vào giá hiện tại
      currentPrice = originalPrice - percentageDiscount;
    }

    // Tiếp tục áp dụng tất cả các khuyến mãi cố định vào giá đã giảm
    if (fixedPromotions.length > 0) {
      // Tính tổng giảm giá cố định từ tất cả khuyến mãi
      const totalFixedDiscount = fixedPromotions.reduce(
        (sum, promo) => sum + promo.discount_value,
        0,
      );

      // Áp dụng giảm giá cố định vào giá hiện tại
      currentPrice = currentPrice - totalFixedDiscount;
    }

    // Đảm bảo giá không âm và làm tròn
    currentPrice = Math.max(0, currentPrice);
    currentPrice = Math.round(currentPrice);

    // Cập nhật thông tin giảm giá cho sản phẩm
    if (currentPrice < originalPrice) {
      product.is_sale = true;
      product.sale_price = currentPrice;
    } else {
      product.is_sale = false;
      product.sale_price = 0;
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

    for (const category of removedCategories) {
      category.is_sale = false;
      await this.categoryRepository.update(category);
    }

    const productsToProcess = [...removedProducts];

    if (removedCategories.length > 0) {
      const productsInRemovedCategories =
        await this.productRepository.findByCategories(
          removedCategories.map((cat) => cat.id),
        );

      const uniqueProducts = productsInRemovedCategories.filter(
        (p) => !productsToProcess.some((existingP) => existingP.id === p.id),
      );

      productsToProcess.push(...uniqueProducts);
    }

    for (const product of productsToProcess) {
      const activePromotions =
        await this.promotionRepository.findActivePromotionsForProduct(
          product.id,
        );

      if (activePromotions.length === 0) {
        product.is_sale = false;
        product.sale_price = 0;
      } else {
        await this.recalculateBestPromotion(product, activePromotions);
      }

      await this.productRepository.update(product);
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

      // Cập nhật trạng thái danh mục
      if (promotion.categories && promotion.categories.length > 0) {
        for (const category of promotion.categories) {
          // Kiểm tra xem danh mục còn khuyến mãi nào khác không
          const otherPromotions = await this.promotionRepository.findAll(
            { skip: 0, take: 10 },
            undefined,
            undefined,
            category.id,
          );

          const hasActivePromotions = otherPromotions[0].some(
            (p) => p.id !== promotion.id && this.isPromotionActive(p),
          );

          if (!hasActivePromotions) {
            category.is_sale = false;
            await this.categoryRepository.update(category);
          }
        }
      }

      // Xử lý sản phẩm bị ảnh hưởng
      await this.handleInactivePromotion(promotion);
    }

    return await this.promotionRepository.save(promotion);
  }

  async decrementUsedCount(promotionId: number): Promise<Promotion> {
    const promotion = await this.promotionRepository.findById(promotionId);

    if (!promotion) {
      throw new BadRequestException(ErrorMessage.PROMOTION_NOT_FOUND);
    }

    // Giảm số lần sử dụng, nhưng không để âm
    if (promotion.used_count > 0) {
      promotion.used_count -= 1;
    }

    // Nếu khuyến mãi không hoạt động do đã đạt giới hạn, kiểm tra lại và kích hoạt nếu có thể
    if (
      !promotion.is_active &&
      promotion.usage_limit &&
      promotion.used_count < promotion.usage_limit
    ) {
      // Kiểm tra xem khuyến mãi còn trong thời gian hiệu lực không
      const now = new Date();
      if (
        now >= new Date(promotion.start_date) &&
        now <= new Date(promotion.end_date)
      ) {
        promotion.is_active = true;

        // Cập nhật trạng thái is_sale cho các danh mục
        if (promotion.categories && promotion.categories.length > 0) {
          for (const category of promotion.categories) {
            category.is_sale = true;
            await this.categoryRepository.update(category);
          }
        }

        // Thu thập tất cả sản phẩm bị ảnh hưởng
        const affectedProducts = [...(promotion.products || [])];

        // Lấy sản phẩm từ danh mục
        if (promotion.categories && promotion.categories.length > 0) {
          const productsInCategories =
            await this.productRepository.findByCategories(
              promotion.categories.map((cat) => cat.id),
            );

          // Loại bỏ các sản phẩm đã được thêm trực tiếp để tránh trùng lặp
          const uniqueProducts = productsInCategories.filter(
            (p) =>
              !promotion.products?.some((existingP) => existingP.id === p.id),
          );

          affectedProducts.push(...uniqueProducts);
        }

        // Xử lý từng sản phẩm
        for (const product of affectedProducts) {
          // Lấy tất cả các khuyến mãi đang áp dụng cho sản phẩm (bao gồm khuyến mãi vừa kích hoạt)
          const activePromotions =
            await this.promotionRepository.findActivePromotionsForProduct(
              product.id,
            );

          if (!activePromotions.some((p) => p.id === promotion.id)) {
            activePromotions.push(promotion);
          }

          await this.recalculateBestPromotion(product, activePromotions);
          await this.productRepository.update(product);
        }
      }
    }

    return await this.promotionRepository.save(promotion);
  }

  // Phương thức xử lý khi khuyến mãi trở thành không hoạt động
  private async handleInactivePromotion(promotion: Promotion): Promise<void> {
    // Thu thập tất cả sản phẩm bị ảnh hưởng
    const affectedProducts = [...(promotion.products || [])];

    // Lấy sản phẩm từ danh mục
    if (promotion.categories && promotion.categories.length > 0) {
      const productsInCategories =
        await this.productRepository.findByCategories(
          promotion.categories.map((cat) => cat.id),
        );

      // Loại bỏ các sản phẩm đã được thêm trực tiếp để tránh trùng lặp
      const uniqueProducts = productsInCategories.filter(
        (p) => !promotion.products?.some((existingP) => existingP.id === p.id),
      );

      affectedProducts.push(...uniqueProducts);
    }

    // Xử lý từng sản phẩm
    for (const product of affectedProducts) {
      // Lấy tất cả các khuyến mãi đang áp dụng cho sản phẩm (trừ khuyến mãi không hoạt động)
      const activePromotions =
        await this.promotionRepository.findActivePromotionsForProduct(
          product.id,
        );
      const otherPromotions = activePromotions.filter(
        (p) => p.id !== promotion.id,
      );

      if (otherPromotions.length === 0) {
        // Nếu không còn khuyến mãi nào khác, reset trạng thái sale
        product.is_sale = false;
        product.sale_price = 0;
      } else {
        // Nếu còn khuyến mãi khác, tính toán lại giá khuyến mãi tốt nhất
        await this.recalculateBestPromotion(product, otherPromotions);
      }

      await this.productRepository.update(product);
    }
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
