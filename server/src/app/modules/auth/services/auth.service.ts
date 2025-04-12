import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRepository } from '../../users/repositories/user.repositories';
import { InvalidatedTokenRepository } from '../../invalidated_token/repositories/invalidated_token.repositories';
import { JwtService } from '@nestjs/jwt';
import { LoginInput } from './types/login.input';
import { ErrorMessage } from 'src/common/enum/error.message.enum';
import { StatusUser } from 'src/common/enum/user.enum';
import { compare } from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import RoleEnum from 'src/common/enum/role.enum';
import { RoleRepository } from '../../role/repositories/role.repositories';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly invalidatedTokenRepo: InvalidatedTokenRepository,
    private readonly jwtService: JwtService,
    private readonly roleRepo: RoleRepository,
  ) {}

  refreshTokenExpiry = '3d';

  async validate(user: LoginInput) {
    const userInDb = await this.userRepo.findByEmail(user.email);

    if (!userInDb) {
      throw new BadRequestException(ErrorMessage.USER_NOT_FOUND);
    } else {
      switch (userInDb.status) {
        case StatusUser.DISABLE:
          throw new BadRequestException(ErrorMessage.USER_INACTIVE);

        case StatusUser.ENABLE:
          if (!(await compare(user.password, userInDb.password))) {
            throw new BadRequestException(ErrorMessage.INCORRECT_USER);
          }
          break;
        default:
          break;
      }
    }

    const payload = this.createPayload(userInDb);

    return await this.login(payload);
  }

  async validateAdmin(user: LoginInput) {
    const userInDb = await this.userRepo.findByEmail(user.email);

    if (!userInDb) {
      throw new BadRequestException(ErrorMessage.USER_NOT_FOUND);
    } else {
      switch (userInDb.status) {
        case StatusUser.DISABLE:
          throw new BadRequestException(ErrorMessage.USER_INACTIVE);

        case StatusUser.ENABLE:
          if (!(await compare(user.password, userInDb.password))) {
            throw new BadRequestException(ErrorMessage.INCORRECT_USER);
          }
          break;
        default:
          break;
      }
    }

    const isAdmin = userInDb.role.some((role) => role.name === RoleEnum.ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào trang quản trị',
      );
    }

    // Truyền tham số true để đánh dấu đây là phiên đăng nhập admin
    const payload = this.createPayload(userInDb, true);

    return await this.login(payload);
  }

  async validateOAuthUser(userData: any) {
    const { email, firstName, lastName, picture, provider } = userData;

    let user = await this.userRepo.findByEmail(email);

    if (!user) {
      const userRole = await this.roleRepo.findByName(RoleEnum.USER);
      if (!userRole) {
        throw new BadRequestException('USER role not found in the database');
      }

      const newUser = {
        user_name: `${firstName} ${lastName}`,
        email: email,
        status: StatusUser.ENABLE,
        password: null,
        avatar: picture || null,
        provider: provider,
        provider_id: userData.id || null,
      };

      user = await this.userRepo.createOAuthUser(newUser);

      if (user) {
        user.role = [userRole];
        await this.userRepo.update(user);

        user = await this.userRepo.findByEmail(email);
      }
    } else if (user.status === StatusUser.DISABLE) {
      throw new BadRequestException(ErrorMessage.USER_INACTIVE);
    }

    if (!user) {
      throw new BadRequestException('Failed to create or find user');
    }

    const payload = this.createPayload(user);
    return await this.login(payload);
  }

  async login(payload: any) {
    return {
      payload,
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.jwtService.signAsync(payload, {
        expiresIn: this.refreshTokenExpiry,
      }),
    };
  }

  async logout(token: string) {
    const decodedToken = this.jwtService.decode(token);
    const tokenId = decodedToken.token_id;
    const exp = decodedToken.exp;
    const expiry_time = new Date(exp * 1000);

    await this.invalidatedTokenRepo.create({
      id: tokenId,
      expiry_time,
    });
  }

  async refresh(refreshToken: string) {
    try {
      await this.jwtService.verifyAsync(refreshToken);

      const decodedToken = this.jwtService.decode(refreshToken) as any;

      const { user_id: userId, token_id: tokenId } = decodedToken;

      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new ForbiddenException(ErrorMessage.USER_NOT_FOUND);
      }

      const payload = this.createPayload(user);

      const accessToken = this.jwtService.sign(payload);
      const refreshTokenNew = await this.jwtService.signAsync(payload, {
        expiresIn: this.refreshTokenExpiry,
      });

      return {
        access_token: accessToken,
        refresh_token: refreshTokenNew,
        payload,
      };
    } catch (error) {
      throw new ForbiddenException(error.message || ErrorMessage.ACCESS_DENIED);
    }
  }

  createPayload(user: User, isAdminSession = false) {
    const roles = user.role.map((role) => role.name);
    const permissions = user.role
      .flatMap((role) => role.permissions)
      .map((permission) => permission.name);

    const newTokenId = uuidv4();
    const payload = {
      token_id: newTokenId,
      user_id: user.user_id,
      roles,
      permissions,
      user_name: user.user_name,
      is_admin_session: isAdminSession,
    };

    return payload;
  }
}
