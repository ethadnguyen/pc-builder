import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigurationService } from '../services/configuration.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { CreateConfigurationReq } from './types/create-configuration.req';
import { UpdateConfigurationReq } from './types/update-configuration.req';
import { ConfigurationRes } from './types/configuration.res';
import { ConfigurationListRes } from './types/configuration-list.res';
import { GetAllConfigurationReq } from './types/get.all-configuration.req';

@Controller('configurations')
@ApiTags('Configurations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConfigurationController {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả cấu hình của người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cấu hình',
    type: ConfigurationListRes,
  })
  async getUserConfigurations(
    @Headers('authorization') token: string,
    @Query() query: GetAllConfigurationReq,
  ) {
    try {
      const tokenValue = token.split(' ')[1];
      const decoded = this.jwtService.decode(tokenValue);
      const userId = decoded.user_id;

      return this.configurationService.findByUser(query, userId);
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  @Get('public')
  @ApiOperation({
    summary: 'Lấy tất cả cấu hình công khai',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cấu hình công khai',
    type: ConfigurationListRes,
  })
  async getPublicConfigurations(@Query() query: GetAllConfigurationReq) {
    return this.configurationService.findPublicConfigurations(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin cấu hình theo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin cấu hình',
    type: ConfigurationRes,
  })
  async getConfigurationById(@Param('id', ParseIntPipe) id: number) {
    return this.configurationService.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo cấu hình mới',
  })
  @ApiResponse({
    status: 201,
    description: 'Cấu hình đã được tạo',
    type: ConfigurationRes,
  })
  async createConfiguration(
    @Body() createConfigurationReq: CreateConfigurationReq,
    @Headers('authorization') token: string,
  ) {
    try {
      const tokenValue = token.split(' ')[1];
      const decoded = this.jwtService.decode(tokenValue);
      const userId = decoded.user_id;

      return this.configurationService.create({
        user_id: userId,
        ...createConfigurationReq,
      });
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  @Put('update')
  @ApiOperation({
    summary: 'Cập nhật cấu hình',
  })
  @ApiResponse({
    status: 200,
    description: 'Cấu hình đã được cập nhật',
    type: ConfigurationRes,
  })
  async updateConfiguration(
    @Body() updateConfigurationReq: UpdateConfigurationReq,
    @Headers('authorization') token: string,
  ) {
    try {
      const tokenValue = token.split(' ')[1];
      const decoded = this.jwtService.decode(tokenValue);
      const userId = decoded.user_id;

      const configuration = await this.configurationService.findById(
        updateConfigurationReq.id,
      );
      if (configuration.user_id !== userId) {
        throw new UnauthorizedException(
          'Bạn không có quyền cập nhật cấu hình này',
        );
      }

      return this.configurationService.update({
        ...updateConfigurationReq,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa cấu hình',
  })
  @ApiResponse({
    status: 200,
    description: 'Cấu hình đã được xóa',
  })
  async deleteConfiguration(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') token: string,
  ) {
    try {
      const tokenValue = token.split(' ')[1];
      const decoded = this.jwtService.verify(tokenValue);
      const userId = decoded.sub || decoded.id;

      // Kiểm tra quyền sở hữu cấu hình
      const configuration = await this.configurationService.findById(id);
      if (configuration.user_id !== userId) {
        throw new UnauthorizedException('Bạn không có quyền xóa cấu hình này');
      }

      await this.configurationService.delete(id);
      return { message: 'Cấu hình đã được xóa thành công' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  @Post(':id/move-to-cart')
  @ApiOperation({
    summary: 'Chuyển cấu hình sang giỏ hàng',
  })
  @ApiResponse({
    status: 200,
    description: 'Cấu hình đã được chuyển sang giỏ hàng',
  })
  async moveToCart(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') token: string,
  ) {
    try {
      const tokenValue = token.split(' ')[1];
      const decoded = this.jwtService.verify(tokenValue);
      const userId = decoded.sub || decoded.id;

      // Kiểm tra quyền sở hữu cấu hình
      const configuration = await this.configurationService.findById(id);
      if (configuration.user_id !== userId) {
        throw new UnauthorizedException(
          'Bạn không có quyền chuyển cấu hình này sang giỏ hàng',
        );
      }

      await this.configurationService.moveToCart(id, userId);
      return { message: 'Cấu hình đã được chuyển sang giỏ hàng thành công' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
