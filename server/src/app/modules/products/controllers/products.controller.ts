import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from '../services/products.service';
import { CreateProductReq } from './types/create-product.req';
import { UpdateProductReq } from './types/update-product.req';
import { ProductRes } from './types/product.res';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductListRes } from './types/product-list.res';
import { GetAllProductReq } from './types/get.all.product.req';
import { Public } from 'src/common/decorators/public.decorator';
import { GetProductsForChatbotReq } from './types/get-products-for-chatbot.req';

@ApiTags('Products')
@Public()
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new product' })
  async create(@Body() createProductReq: CreateProductReq) {
    return this.productService.createProduct(createProductReq);
  }

  @Get('/all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    type: ProductListRes,
  })
  async getAllProducts(@Query() queryParams: GetAllProductReq) {
    return this.productService.getAllProducts(queryParams);
  }

  @Get('/featured')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get featured products for homepage' })
  @ApiResponse({
    status: 200,
    type: ProductListRes,
  })
  async getFeaturedProducts(@Query() queryParams: GetAllProductReq) {
    return this.productService.getFeaturedProducts(queryParams);
  }

  @Get('search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Search product by name' })
  @ApiResponse({
    status: 200,
    type: ProductListRes,
  })
  async searchProducts(@Query() queryParams: GetProductsForChatbotReq) {
    return this.productService.searchProducts(queryParams);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get product by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductById(id);
  }

  @Get('slug/:slug')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get product by slug' })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }

  @Get('category/:slug')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get products by category slug' })
  @ApiResponse({
    status: 200,
    type: ProductListRes,
  })
  async getProductsByCategorySlug(
    @Param('slug') slug: string,
    @Query() queryParams: GetAllProductReq,
  ) {
    return this.productService.getProductsByCategorySlug(slug, queryParams);
  }

  @Put('update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ type: ProductRes })
  async update(
    @Body() updateProductReq: UpdateProductReq,
  ): Promise<ProductRes> {
    return this.productService.updateProduct(updateProductReq);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete product' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }

  @Put('sale-status/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update product sale status' })
  async updateSaleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleStatusReq: { is_sale: boolean; sale_price: number },
  ) {
    return this.productService.updateProductSaleStatus(
      id,
      updateSaleStatusReq.is_sale,
      updateSaleStatusReq.sale_price,
    );
  }
}
