import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/products.repositories';
import { GetAllProductInput } from './types/get.all.product.input';
import { ErrorMessage } from 'src/common/enum/error.message.enum';
import { CreateProductInput } from './types/create-product.input';
import { Product } from '../entities/products.entity';
import { UpdateProductInput } from './types/update-product.input';
import { CategoryRepository } from '../../categories/repositories/categories.repositories';
import { generateSlug } from 'src/common/helpers';
import { BrandRepository } from '../../brand/repositories/brand.repository';
import { CategoryService } from '../../categories/services/categories.service';
import { GetProductsForChatbotInput } from './types/get-product-for-chatbot.input';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly categoryRepo: CategoryRepository,
    private readonly brandRepo: BrandRepository,
    private readonly categoryService: CategoryService,
  ) {}

  async getAllProducts(queryParams: GetAllProductInput) {
    const {
      page = 1,
      size = 10,
      category_id,
      is_active,
      search,
      min_price,
      max_price,
      is_sale,
      min_rating,
      brands,
      type,
    } = queryParams;

    console.log('All Products Query Params:', queryParams);
    const brandsArray = brands ? brands.split(',') : undefined;
    const minPriceNum = min_price ? Number(min_price) : undefined;
    const maxPriceNum = max_price ? Number(max_price) : undefined;

    const [products, total] = await this.productRepo.findAll(
      {
        skip: (page - 1) * size,
        take: size,
      },
      category_id,
      is_active,
      search,
      minPriceNum,
      maxPriceNum,
      is_sale,
      min_rating ? Number(min_rating) : undefined,
      brandsArray,
      type,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      products,
    };
  }

  async getProductById(id: number) {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new BadRequestException(ErrorMessage.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  async getProductBySlug(slug: string) {
    const product = await this.productRepo.findBySlug(slug);
    if (!product) {
      throw new BadRequestException(ErrorMessage.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  async getProductsByKeywords(keywords: string[]) {
    return await this.productRepo.findByKeywords(keywords);
  }

  async createProduct(input: CreateProductInput) {
    let product = new Product();

    const categories = await this.categoryRepo.findByIds(
      Array.isArray(input.category_id)
        ? input.category_id
        : [input.category_id],
    );

    if (categories.length > 0) {
      product.categories = categories;
    }

    const brand = await this.brandRepo.findById(input.brand_id);
    if (brand) {
      product.brand = brand;
    }

    Object.assign(product, {
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      images: input.images,
      is_active: input.is_active,
      specifications: input.specifications,
      slug: generateSlug(input.name),
      type: input.type,
      is_sale: input.is_sale || false,
      sale_price: input.sale_price || 0,
    });

    const savedProduct = await this.productRepo.create(product);

    if (categories.length > 0) {
      const categoryIds = categories.map((cat) => cat.id);

      for (const category of categories) {
        const hasParentInSelection =
          category.parent && categoryIds.includes(category.parent.id);

        if (hasParentInSelection) {
          category.products_count += 1;
          await this.categoryRepo.update(category);
        } else {
          await this.categoryService.incrementProductCount(category.id);
        }
      }
    }

    return savedProduct;
  }

  async updateProduct(input: UpdateProductInput) {
    const productDB = await this.getProductById(input.id);
    if (!productDB) {
      throw new NotFoundException(`Product with ID ${input.id} not found`);
    }

    const updateData: any = {};

    const oldCategories = [...productDB.categories];
    const oldCategoryIds = oldCategories.map((cat) => cat.id);

    if (input.category_id) {
      const categories = await this.categoryRepo.findByIds(
        Array.isArray(input.category_id)
          ? input.category_id
          : [input.category_id],
      );
      if (categories.length > 0) {
        productDB.categories = categories;
      }
    }

    if (input.brand_id !== undefined) {
      if (input.brand_id === null) {
        updateData.brand = null;
        updateData.brand_id = null;
      } else {
        const brand = await this.brandRepo.findById(input.brand_id);
        if (brand) {
          updateData.brand = brand;
          updateData.brand_id = brand.id;
        }
      }
    }

    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = generateSlug(input.name);
    }

    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.stock !== undefined) updateData.stock = input.stock;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.is_sale !== undefined) updateData.is_sale = input.is_sale;
    if (input.sale_price !== undefined)
      updateData.sale_price = input.sale_price;
    if (input.specifications !== undefined)
      updateData.specifications = input.specifications;

    Object.assign(productDB, updateData);

    const updatedProduct = await this.productRepo.update(productDB);

    if (input.category_id) {
      const newCategoryIds = productDB.categories.map((cat) => cat.id);

      const removedCategoryIds = oldCategoryIds.filter(
        (id) => !newCategoryIds.includes(id),
      );

      const addedCategoryIds = newCategoryIds.filter(
        (id) => !oldCategoryIds.includes(id),
      );

      for (const oldCategory of oldCategories) {
        if (removedCategoryIds.includes(oldCategory.id)) {
          const hasParentInProduct =
            oldCategory.parent &&
            newCategoryIds.includes(oldCategory.parent.id);

          if (!hasParentInProduct) {
            await this.categoryService.decrementProductCount(oldCategory.id);
          }
        }
      }

      for (const newCategory of productDB.categories) {
        if (addedCategoryIds.includes(newCategory.id)) {
          const hasParentInOldProduct =
            newCategory.parent &&
            oldCategoryIds.includes(newCategory.parent.id);

          if (hasParentInOldProduct) {
            const category = await this.categoryRepo.findById(newCategory.id);
            if (category) {
              category.products_count += 1;
              await this.categoryRepo.update(category);
            }
          } else {
            await this.categoryService.incrementProductCount(newCategory.id);
          }
        }
      }
    }

    return updatedProduct;
  }

  async deleteProduct(id: number) {
    const product = await this.getProductById(id);

    if (product) {
      if (product.categories && product.categories.length > 0) {
        const categoryIds = product.categories.map((cat) => cat.id);

        for (const category of product.categories) {
          const hasParentInProduct =
            category.parent && categoryIds.includes(category.parent.id);

          if (hasParentInProduct) {
            if (category.products_count > 0) {
              category.products_count -= 1;
              await this.categoryRepo.update(category);
            }
          } else {
            await this.categoryService.decrementProductCount(category.id);
          }
        }
      }

      await this.productRepo.deleteWithRelated(product);
    }
  }

  async updateProductSaleStatus(
    productId: number,
    isSale: boolean,
    salePrice: number,
  ) {
    const product = await this.getProductById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    product.is_sale = isSale;
    product.sale_price = salePrice;

    return await this.productRepo.update(product);
  }

  async getFeaturedProducts(queryParams: GetAllProductInput) {
    const {
      page = 1,
      size = 10,
      is_active = true,
      search,
      min_price,
      max_price,
      is_sale,
      min_rating,
      brands,
    } = queryParams;

    console.log('Featured Products Query Params:', queryParams);

    const brandsArray = brands ? brands.split(',') : undefined;

    const minPriceNum = min_price ? Number(min_price) : undefined;
    const maxPriceNum = max_price ? Number(max_price) : undefined;

    console.log('Processed price filters for featured products:', {
      minPriceNum,
      maxPriceNum,
    });

    const [products, total] = await this.productRepo.findFeaturedProducts(
      {
        skip: (page - 1) * size,
        take: size,
      },
      is_active,
      search,
      minPriceNum,
      maxPriceNum,
      is_sale,
      min_rating ? Number(min_rating) : undefined,
      brandsArray,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      products,
    };
  }

  async getProductsByCategorySlug(
    slug: string,
    queryParams: GetAllProductInput,
  ) {
    const {
      page = 1,
      size = 10,
      is_active,
      search,
      min_price,
      max_price,
      is_sale,
      min_rating,
      brands,
    } = queryParams;

    console.log('Category Slug Query Params:', queryParams);

    try {
      await this.categoryService.findBySlug(slug);
    } catch (error) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    const brandsArray = brands ? brands.split(',') : undefined;

    const minPriceNum = min_price ? Number(min_price) : undefined;
    const maxPriceNum = max_price ? Number(max_price) : undefined;

    console.log('Processed price filters:', { minPriceNum, maxPriceNum });

    const [products, total] = await this.productRepo.findByCategorySlug(
      slug,
      {
        skip: (page - 1) * size,
        take: size,
      },
      is_active,
      search,
      minPriceNum,
      maxPriceNum,
      is_sale,
      min_rating ? Number(min_rating) : undefined,
      brandsArray,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      products,
    };
  }

  async searchProducts(input: GetProductsForChatbotInput) {
    const {
      page = 1,
      size = 10,
      name,
      description,
      min_price,
      max_price,
      is_sale,
      brand,
      category,
    } = input;
    const [products, total] = await this.productRepo.searchProductWithRelevance(
      {
        skip: (page - 1) * size,
        take: size,
      },
      name,
      description,
      min_price,
      max_price,
      is_sale,
      brand,
      category,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      products,
    };
  }

  async updateProductStock(
    productId: number,
    quantity: number,
    isDecrease: boolean,
  ) {
    try {
      const product = await this.getProductById(productId);

      if (isDecrease) {
        // Giảm stock khi thanh toán
        product.stock = Math.max(0, product.stock - quantity);
      } else {
        // Tăng stock khi hủy đơn hàng
        product.stock += quantity;
      }

      return await this.productRepo.update(product);
    } catch (error) {
      console.error(
        `Error updating product stock for product ID ${productId}:`,
        error,
      );
      throw new BadRequestException('Không thể cập nhật số lượng sản phẩm');
    }
  }

  async updateMultipleProductsStock(
    items: { productId: number; quantity: number }[],
    isDecrease: boolean,
  ) {
    try {
      const productIds = items.map((item) => item.productId);
      const products = await this.productRepo.findByIds(productIds);

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          if (isDecrease) {
            // Giảm stock khi thanh toán
            product.stock = Math.max(0, product.stock - item.quantity);
          } else {
            // Tăng stock khi hủy đơn hàng
            product.stock += item.quantity;
          }

          await this.productRepo.update(product);
        }
      }
    } catch (error) {
      console.error('Error updating multiple product stocks:', error);
      throw new BadRequestException('Không thể cập nhật số lượng sản phẩm');
    }
  }
}
