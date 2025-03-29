import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigurationRepository } from '../repositories/configuration.repositories';
import { Configuration } from '../entities/configuration.entity';
import { CreateConfigurationInput } from './types/create-configuration.input';
import { UpdateConfigurationInput } from './types/update-configuration.input';
import { CompatibilityService } from '../../compatibility/services/compatibility.service';
import { ProductRepository } from '../../products/repositories/products.repositories';
import { CompatibilityByProductIdsReq } from '../../compatibility/controllers/types/compatibility.req';
import { UserRepository } from '../../users/repositories/user.repositories';
import { GetConfigurationInput } from './types/get.configuration.input';
import { Product } from '../../products/entities/products.entity';
import { ProductType } from '../../products/enums/product-type.enum';

@Injectable()
export class ConfigurationService {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly compatibilityService: CompatibilityService,
    private readonly productRepository: ProductRepository,
    private readonly userRepository: UserRepository,
  ) {}

  private async getComponentDetails(
    componentIds: { product_id: number; product_type: ProductType }[],
  ) {
    const components = await Promise.all(
      componentIds.map(async (component) => {
        const product = await this.productRepository.findById(
          component.product_id,
        );
        if (!product) {
          throw new NotFoundException(
            `Không tìm thấy sản phẩm với ID ${component.product_id}`,
          );
        }
        return {
          ...component,
          product,
        };
      }),
    );
    return components;
  }

  async findById(id: number): Promise<Configuration> {
    const configuration = await this.configurationRepository.findById(id);
    if (!configuration) {
      throw new NotFoundException(`Không tìm thấy cấu hình với ID ${id}`);
    }

    if (configuration.component_ids) {
      configuration.component_ids = await this.getComponentDetails(
        configuration.component_ids,
      );
    }

    return configuration;
  }

  async findByUser(queryParams: GetConfigurationInput, user_id: number) {
    const { page = 1, size = 5 } = queryParams;

    const [configurations, total] =
      await this.configurationRepository.findByUser(
        { skip: (page - 1) * size, take: size },
        user_id,
      );

    // Lấy thông tin chi tiết của components cho mỗi cấu hình
    const configurationsWithDetails = await Promise.all(
      configurations.map(async (config) => {
        if (config.component_ids) {
          config.component_ids = await this.getComponentDetails(
            config.component_ids,
          );
        }
        return config;
      }),
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      configurations: configurationsWithDetails,
    };
  }

  async findPublicConfigurations(queryParams: GetConfigurationInput) {
    const { page = 1, size = 5 } = queryParams;

    const [configurations, total] =
      await this.configurationRepository.findPublicConfigurations({
        skip: (page - 1) * size,
        take: size,
      });

    // Lấy thông tin chi tiết của components cho mỗi cấu hình
    const configurationsWithDetails = await Promise.all(
      configurations.map(async (config) => {
        if (config.component_ids) {
          config.component_ids = await this.getComponentDetails(
            config.component_ids,
          );
        }
        return config;
      }),
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      configurations: configurationsWithDetails,
    };
  }

  async create(input: CreateConfigurationInput) {
    const user = await this.userRepository.findById(input.user_id);
    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với ID ${input.user_id}`,
      );
    }

    const compatibilityReq: CompatibilityByProductIdsReq = {
      products: input.component_ids,
    };

    const compatibilityResult =
      await this.compatibilityService.checkCompatibilityByProductIds(
        compatibilityReq,
      );

    let totalPrice = 0;
    for (const component of input.component_ids) {
      const product = await this.productRepository.findById(
        component.product_id,
      );
      if (product) {
        totalPrice += product.price;
      }
    }

    const configuration: Partial<Configuration> = {
      user_id: input.user_id,
      name: input.name,
      description: input.description,
      component_ids: input.component_ids,
      is_public: input.is_public || false,
      compatibility_result: compatibilityResult,
      total_price: totalPrice,
    };

    return this.configurationRepository.create(configuration);
  }

  async update(input: UpdateConfigurationInput) {
    const configuration = await this.findById(input.id);

    let compatibilityResult = configuration.compatibility_result;
    let totalPrice = configuration.total_price;

    if (input.component_ids) {
      const compatibilityReq: CompatibilityByProductIdsReq = {
        products: input.component_ids,
      };

      compatibilityResult =
        await this.compatibilityService.checkCompatibilityByProductIds(
          compatibilityReq,
        );

      totalPrice = 0;
      for (const component of input.component_ids) {
        const product = await this.productRepository.findById(
          component.product_id,
        );
        if (product) {
          totalPrice += product.price;
        }
      }
    }

    const updateData: Partial<Configuration> = {
      name: input.name || configuration.name,
      description:
        input.description !== undefined
          ? input.description
          : configuration.description,
      component_ids: input.component_ids || configuration.component_ids,
      is_public:
        input.is_public !== undefined
          ? input.is_public
          : configuration.is_public,
      compatibility_result: compatibilityResult,
      total_price: totalPrice,
    };

    return this.configurationRepository.update(input.id, updateData);
  }

  async delete(id: number): Promise<void> {
    const configuration = await this.findById(id);
    await this.configurationRepository.delete(id);
  }

  async moveToCart(configId: number, userId: number): Promise<void> {
    throw new Error('Chức năng đang được phát triển');
  }
}
