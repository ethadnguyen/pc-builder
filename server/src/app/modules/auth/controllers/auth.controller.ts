import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginRes } from './types/login.res';
import { LoginReq } from './types/login.req';
import { RefreshTokenRes } from './types/refresh_token.res';
import { RefreshTokenReq } from './types/refresh_token.req';
import { Public } from 'src/common/decorators/public.decorator';
import { GoogleGuard } from 'src/common/guards/google.guard';
import { FacebookGuard } from 'src/common/guards/facebook.guard';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: LoginRes,
  })
  async login(@Body() request: LoginReq) {
    return await this.authService.validate(request);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: LoginRes,
  })
  async adminLogin(@Body() request: LoginReq) {
    return await this.authService.validateAdmin(request);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiResponse({
    status: 204,
  })
  async logout(@Headers('Authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token is missing');
    }

    const token = authorization.split(' ')[1];
    this.authService.logout(token);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: RefreshTokenRes,
  })
  async refresh(@Body() request: RefreshTokenReq) {
    return await this.authService.refresh(request.refresh_token);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth() {
    // Khởi tạo xác thực Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const { access_token, refresh_token, payload } = req.user;
    const clientUrl = this.configService.get<string>('FRONTEND_URL');

    // Chuyển hướng về client với token và payload
    const payloadString = encodeURIComponent(JSON.stringify(payload));
    return res.redirect(
      `${clientUrl}/auth/oauth-callback?access_token=${access_token}&refresh_token=${refresh_token}&payload=${payloadString}`,
    );
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookGuard)
  async facebookAuth() {
    // Khởi tạo xác thực Facebook
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookGuard)
  async facebookAuthCallback(@Req() req, @Res() res: Response) {
    const { access_token, refresh_token, payload } = req.user;
    const clientUrl = this.configService.get<string>('FRONTEND_URL');

    // Chuyển hướng về client với token và payload
    const payloadString = encodeURIComponent(JSON.stringify(payload));
    return res.redirect(
      `${clientUrl}/auth/oauth-callback?access_token=${access_token}&refresh_token=${refresh_token}&payload=${payloadString}`,
    );
  }
}
