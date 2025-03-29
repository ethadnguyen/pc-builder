import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from '../entities/configuration.entity';

@Injectable()
export class ConfigurationRepository {
  constructor(
    @InjectRepository(Configuration)
    private readonly configurationRepo: Repository<Configuration>,
  ) {}

  async findById(id: number): Promise<Configuration> {
    return await this.configurationRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUser(
    paginationOptions: {
      skip: number;
      take: number;
    },
    user_id: number,
  ): Promise<[Configuration[], number]> {
    const queryBuilder =
      this.configurationRepo.createQueryBuilder('configuration');

    queryBuilder.leftJoinAndSelect('configuration.user', 'user');

    if (user_id) {
      queryBuilder.andWhere('configuration.user_id = :user_id', { user_id });
    }

    queryBuilder
      .orderBy('configuration.created_at', 'DESC')
      .skip(paginationOptions.skip)
      .take(paginationOptions.take);

    const [configurations, total] = await queryBuilder.getManyAndCount();

    return [configurations, total];
  }

  async findPublicConfigurations(paginationOptions: {
    skip: number;
    take: number;
  }): Promise<[Configuration[], number]> {
    const queryBuilder =
      this.configurationRepo.createQueryBuilder('configuration');

    queryBuilder.leftJoinAndSelect('configuration.user', 'user');

    queryBuilder.andWhere('configuration.is_public = :is_public', {
      is_public: true,
    });

    queryBuilder
      .orderBy('configuration.created_at', 'DESC')
      .skip(paginationOptions.skip)
      .take(paginationOptions.take);

    const [configurations, total] = await queryBuilder.getManyAndCount();

    return [configurations, total];
  }

  async create(configuration: Partial<Configuration>): Promise<Configuration> {
    const newConfiguration = this.configurationRepo.create(configuration);
    return await this.configurationRepo.save(newConfiguration);
  }

  async update(
    id: number,
    configuration: Partial<Configuration>,
  ): Promise<Configuration> {
    await this.configurationRepo.update(id, configuration);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.configurationRepo.delete(id);
  }
}
