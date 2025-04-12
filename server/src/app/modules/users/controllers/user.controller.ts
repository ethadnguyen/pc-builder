import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateUserReq } from './types/create-user.req';
import { UserRes } from './types/user.res';
import { GetAllUserReq } from './types/get.all.user.req';
import { GetAllUserRes } from './types/get.all.user.res';
import { UpdateUserReq } from './types/update-user.req';

@ApiTags('user')
@Controller('user')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: GetAllUserRes,
  })
  async getAllUsers(@Query() query: GetAllUserReq) {
    return await this.userService.getAllUsers(query);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: UserRes,
  })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUserById(id);
  }

  @Public()
  @Post('/')
  @HttpCode(201)
  @ApiResponse({
    status: 201,
    type: UserRes,
  })
  async createUser(@Body() body: CreateUserReq) {
    return await this.userService.createUser(body);
  }

  @Put('update')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: UserRes,
  })
  async updateUser(@Body() body: UpdateUserReq) {
    return await this.userService.updateUser(body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({
    status: 204,
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.deleteUserById(id);
  }
}
