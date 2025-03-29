import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { InvalidatedToken } from '../invalidated_token/entities/invalidated_token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { UserRepository } from '../users/repositories/user.repositories';
import { InvalidatedTokenRepository } from '../invalidated_token/repositories/invalidated_token.repositories';
import { AuthController } from './controllers/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../../common/strategies/jwt.strategy';
import { LocalStrategy } from '../../../common/strategies/local.strategy';
import { GoogleStrategy } from '../../../common/strategies/google.strategy';
import { FacebookStrategy } from '../../../common/strategies/facebook.strategy';
import { Role } from '../role/entities/role.entity';
import { RoleRepository } from '../role/repositories/role.repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, InvalidatedToken, Role]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: `${configService.get('JWT_SECRET')}`,
        signOptions: {
          expiresIn: configService.get(`JWT_EXPIRES_IN`),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    InvalidatedTokenRepository,
    RoleRepository,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
})
export class AuthModule {}
