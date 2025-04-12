import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In, DataSource, Like } from 'typeorm';
import { Product } from '../entities/products.entity';
import { ProductType } from '../enums/product-type.enum';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(product: Product): Promise<Product> {
    const savedProduct = await this.productRepo.save(product);
    return await this.productRepo.findOne({
      where: { id: savedProduct.id },
      relations: ['categories', 'brand', 'promotions'],
    });
  }

  async findById(id: number): Promise<Product> {
    return await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.promotions', 'promotions')
      .where('product.id = :id', { id })
      .getOne();
  }

  async findBySlug(slug: string): Promise<Product> {
    return await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.promotions', 'promotions')
      .where('product.slug = :slug', { slug })
      .getOne();
  }

  async findByKeywords(keywords: string[]): Promise<Product[]> {
    const queryBuilder = this.productRepo.createQueryBuilder('product');

    queryBuilder.leftJoinAndSelect('product.categories', 'categories');
    queryBuilder.leftJoinAndSelect('product.brand', 'brand');
    queryBuilder.leftJoinAndSelect('product.promotions', 'promotions');

    if (keywords.length > 0) {
      queryBuilder.andWhere('product.name ILIKE :keywords', {
        keywords: `%${keywords.join('%')}%`,
      });
    }

    return await queryBuilder.getMany();
  }

  async findByIds(ids: number[]): Promise<Product[]> {
    return await this.productRepo.find({
      where: { id: In(ids) },
      relations: ['categories', 'brand', 'promotions'],
    });
  }

  async findAll(
    paginationOptions: {
      skip: number;
      take: number;
    },
    category_id?: number,
    is_active?: boolean,
    search?: string,
    min_price?: number,
    max_price?: number,
    is_sale?: boolean,
    min_rating?: number,
    brands?: string[],
    type?: ProductType,
  ): Promise<[Product[], number]> {
    const queryBuilder = this.productRepo.createQueryBuilder('product');

    queryBuilder.leftJoinAndSelect('product.categories', 'categories');
    queryBuilder.leftJoinAndSelect('product.brand', 'brand');
    queryBuilder.leftJoinAndSelect('product.promotions', 'promotions');

    if (category_id) {
      queryBuilder.andWhere('categories.id = :category_id', { category_id });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('product.is_active = :is_active', { is_active });
    }

    if (search) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (min_price !== undefined) {
      console.log('Applying min_price filter:', min_price);
      queryBuilder.andWhere('product.price >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      console.log('Applying max_price filter:', max_price);
      queryBuilder.andWhere('product.price <= :max_price', { max_price });
    }

    if (is_sale !== undefined) {
      queryBuilder.andWhere('product.is_sale = :is_sale', { is_sale });
    }

    if (min_rating !== undefined) {
      queryBuilder.andWhere('product.rating >= :min_rating', { min_rating });
    }

    if (brands && brands.length > 0) {
      queryBuilder.andWhere('brand.name IN (:...brands)', { brands });
    }

    if (type) {
      queryBuilder.andWhere('product.type = :type', { type });
    }

    queryBuilder
      .orderBy('product.created_at', 'DESC')
      .skip(paginationOptions.skip)
      .take(paginationOptions.take);

    const [products, total] = await queryBuilder.getManyAndCount();

    return [products, total];
  }

  async update(product: Product): Promise<Product> {
    const savedProduct = await this.productRepo.save(product);
    return await this.findById(savedProduct.id);
  }

  async delete(id: number): Promise<void> {
    await this.productRepo.delete(id);
  }

  async deleteWithRelated(product: Product): Promise<void> {
    const childTables = [
      'cpu',
      'gpu',
      'ram',
      'storage',
      'mainboard',
      'case',
      'psu',
      'cooling',
      // Thêm các bảng con khác nếu có
    ];

    for (const table of childTables) {
      try {
        // Mỗi bảng con được xóa trong một transaction riêng biệt
        await this.dataSource.transaction(async (manager) => {
          // Kiểm tra xem bảng có tồn tại không
          const tableExists = await manager.query(
            `SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = $1
            )`,
            [table],
          );

          if (tableExists[0].exists) {
            // Kiểm tra xem bản ghi có tồn tại trong bảng không
            const recordExists = await manager.query(
              `SELECT EXISTS (SELECT 1 FROM "${table}" WHERE id = $1)`,
              [product.id],
            );

            if (recordExists[0].exists) {
              // Xóa bản ghi trong bảng con
              await manager.query(`DELETE FROM "${table}" WHERE id = $1`, [
                product.id,
              ]);
              console.log(`Đã xóa bản ghi ${table} với id ${product.id}`);
            }
          }
        });
      } catch (error) {
        console.log(`Lỗi khi xóa bảng ${table}: ${error.message}`);
        // Không ném lỗi, tiếp tục với bảng tiếp theo
      }
    }

    // Cuối cùng, xóa bản ghi trong bảng Product trong một transaction riêng biệt
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Product, product.id);
      console.log(`Đã xóa sản phẩm với id ${product.id}`);
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.productRepo.update(id, { is_active: false });
  }

  async findByCategories(categoryIds: number[]): Promise<Product[]> {
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('categories.id IN (:...categoryIds)', { categoryIds });

    return await queryBuilder.getMany();
  }

  async findByCategorySlug(
    slug: string,
    paginationOptions: {
      skip: number;
      take: number;
    },
    is_active?: boolean,
    search?: string,
    min_price?: number,
    max_price?: number,
    is_sale?: boolean,
    min_rating?: number,
    brands?: string[],
  ): Promise<[Product[], number]> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('categories.slug = :slug', { slug });

    // Áp dụng filter is_active
    if (is_active !== undefined) {
      queryBuilder.andWhere('product.is_active = :is_active', { is_active });
    }

    // Áp dụng filter search
    if (search) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Áp dụng filter giá
    if (min_price !== undefined) {
      queryBuilder.andWhere('product.price >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      queryBuilder.andWhere('product.price <= :max_price', { max_price });
    }

    // Áp dụng filter is_sale
    if (is_sale !== undefined) {
      queryBuilder.andWhere('product.is_sale = :is_sale', { is_sale });
    }

    // Áp dụng filter min_rating
    if (min_rating !== undefined) {
      queryBuilder.andWhere('product.rating >= :min_rating', { min_rating });
    }

    // Áp dụng filter brands
    if (brands && brands.length > 0) {
      queryBuilder.andWhere('brand.name IN (:...brands)', { brands });
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .skip(paginationOptions.skip)
      .take(paginationOptions.take)
      .orderBy('product.created_at', 'DESC');

    const products = await queryBuilder.getMany();

    return [products, total];
  }

  async findFeaturedProducts(
    paginationOptions: {
      skip: number;
      take: number;
    },
    is_active?: boolean,
    search?: string,
    min_price?: number,
    max_price?: number,
    is_sale?: boolean,
    min_rating?: number,
    brands?: string[],
  ): Promise<[Product[], number]> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.brand', 'brand');

    if (is_active !== undefined) {
      queryBuilder.andWhere('product.is_active = :is_active', { is_active });
    }

    // Áp dụng filter search
    if (search) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Áp dụng filter giá
    if (min_price !== undefined) {
      queryBuilder.andWhere('product.price >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      queryBuilder.andWhere('product.price <= :max_price', { max_price });
    }

    // Áp dụng filter is_sale
    if (is_sale !== undefined) {
      queryBuilder.andWhere('product.is_sale = :is_sale', { is_sale });
    }

    // Áp dụng filter min_rating
    if (min_rating !== undefined) {
      queryBuilder.andWhere('product.rating >= :min_rating', { min_rating });
    }

    // Áp dụng filter brands
    if (brands && brands.length > 0) {
      const lowerCaseBrands = brands.map((b) => b.toLowerCase());
      queryBuilder.andWhere('LOWER(brand.name) IN (:...lowerCaseBrands)', {
        lowerCaseBrands,
      });
    }

    // Lấy tổng số sản phẩm
    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy('product.is_sale', 'DESC')
      .addOrderBy('product.stock', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .skip(paginationOptions.skip)
      .take(paginationOptions.take);

    const products = await queryBuilder.getMany();

    return [products, total];
  }

  async searchProductWithRelevance(
    paginationOptions: {
      skip: number;
      take: number;
    },
    name?: string,
    description?: string,
    min_price?: number,
    max_price?: number,
    is_sale?: boolean,
    brand?: string,
    category?: string,
  ): Promise<[Product[], number]> {
    const normalizedNameTerm = name ? name.trim().toLowerCase() : '';
    const normalizedDescTerm = description
      ? description.trim().toLowerCase()
      : '';

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .select('product')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.brand', 'brand');

    if (normalizedNameTerm || normalizedDescTerm) {
      const nameConditions = [];
      const descConditions = [];
      const parameters: Record<string, any> = {};

      if (normalizedNameTerm) {
        nameConditions.push('LOWER(product.name) = :exactName');
        nameConditions.push('LOWER(product.name) LIKE :nameStart');
        nameConditions.push('LOWER(product.name) LIKE :nameWord');
        nameConditions.push('LOWER(product.name) LIKE :nameContain');

        parameters.exactName = normalizedNameTerm;
        parameters.nameStart = `${normalizedNameTerm}%`;
        parameters.nameWord = `% ${normalizedNameTerm} %`;
        parameters.nameContain = `%${normalizedNameTerm}%`;
      }

      // Xử lý điều kiện tìm kiếm theo mô tả
      if (normalizedDescTerm) {
        descConditions.push('LOWER(product.description) = :exactDesc');
        descConditions.push('LOWER(product.description) LIKE :descStart');
        descConditions.push('LOWER(product.description) LIKE :descContain');

        parameters.exactDesc = normalizedDescTerm;
        parameters.descStart = `${normalizedDescTerm}%`;
        parameters.descContain = `%${normalizedDescTerm}%`;
      }

      // Tạo câu lệnh CASE cho relevance
      let relevanceCase = 'CASE ';

      if (normalizedNameTerm) {
        relevanceCase += `
          WHEN LOWER(product.name) = :exactName THEN 10
          WHEN LOWER(product.name) LIKE :nameStart THEN 8
          WHEN LOWER(product.name) LIKE :nameWord THEN 6
          WHEN LOWER(product.name) LIKE :nameContain THEN 4
        `;
      }

      if (normalizedDescTerm) {
        relevanceCase += `
          WHEN LOWER(product.description) = :exactDesc THEN 3
          WHEN LOWER(product.description) LIKE :descStart THEN 2
          WHEN LOWER(product.description) LIKE :descContain THEN 1
        `;
      }

      relevanceCase += 'ELSE 0 END';

      queryBuilder.addSelect(relevanceCase, 'relevance');

      // Xây dựng điều kiện WHERE
      const allConditions = [...nameConditions, ...descConditions];
      if (allConditions.length > 0) {
        queryBuilder.where(`(${allConditions.join(' OR ')})`, parameters);
      }
    } else {
      queryBuilder.addSelect('1', 'relevance');
    }

    queryBuilder.andWhere('product.is_active = :is_active', {
      is_active: true,
    });

    // Các filter bổ sung
    if (min_price !== undefined) {
      queryBuilder.andWhere('product.price >= :min_price', { min_price });
    }

    if (max_price !== undefined) {
      queryBuilder.andWhere('product.price <= :max_price', { max_price });
    }

    if (is_sale !== undefined) {
      queryBuilder.andWhere('product.is_sale = :is_sale', { is_sale });
    }

    if (brand) {
      queryBuilder.andWhere('LOWER(brand.name) = LOWER(:brand)', { brand });
    }

    if (category) {
      const lowerCaseCategory = category.toLowerCase();

      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM product_categories pc ' +
          'JOIN categories c ON pc.category_id = c.id ' +
          'WHERE pc.product_id = product.id AND LOWER(c.name) = LOWER(:lowerCaseCategory))',
        { lowerCaseCategory },
      );
    }

    queryBuilder
      .orderBy(
        normalizedNameTerm || normalizedDescTerm
          ? 'relevance'
          : 'product.created_at',
        normalizedNameTerm || normalizedDescTerm ? 'DESC' : 'DESC',
      )
      .addOrderBy('product.name', 'ASC')
      .skip(paginationOptions.skip)
      .take(paginationOptions.take);

    const [products, total] = await queryBuilder.getManyAndCount();

    return [products, total];
  }
}
