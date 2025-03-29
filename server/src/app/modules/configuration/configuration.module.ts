import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Configuration } from './entities/configuration.entity';
import { ConfigurationController } from './controllers/configuration.controller';
import { ConfigurationService } from './services/configuration.service';
import { ConfigurationRepository } from './repositories/configuration.repositories';
import { UserModule } from '../users/user.module';
import { CompatibilityModule } from '../compatibility/compatibility.module';
import { ProductRepository } from '../products/repositories/products.repositories';
import { Product } from '../products/entities/products.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Configuration, Product]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: `${configService.get('JWT_SECRET')}`,
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    CompatibilityModule,
  ],
  controllers: [ConfigurationController],
  providers: [
    ConfigurationService,
    ConfigurationRepository,
    ProductRepository,
    JwtService,
  ],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
