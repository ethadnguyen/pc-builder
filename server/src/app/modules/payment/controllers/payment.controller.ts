import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentInput } from '../services/types/create-payment.input';
import { PaymentStatus } from '../enums/payment-status.enum';
import { GetAllPaymentReq } from './types/get.all.payment.req';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { PaymentListRes } from './types/payment-list.res';
import { PaymentRes } from './types/payment.res';
import { UpdatePaymentReq } from './types/update-payment.req';

@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() input: CreatePaymentInput) {
    return this.paymentService.createPayment(input);
  }

  @Get('all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({
    status: 200,
    description: 'Get all payments',
    type: PaymentListRes,
  })
  async getAllPayments(@Query() query: GetAllPaymentReq) {
    return this.paymentService.getAllPayments(query);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiResponse({
    status: 200,
    description: 'Get payment by id',
    type: PaymentRes,
  })
  async getPaymentById(@Param('id') id: number) {
    return this.paymentService.getPaymentById(id);
  }

  @Put('/update')
  async updatePaymentStatus(@Body() body: UpdatePaymentReq) {
    return this.paymentService.updatePaymentStatus(body);
  }

  @Delete(':id')
  async deletePayment(@Param('id') id: number): Promise<void> {
    return this.paymentService.deletePayment(id);
  }

  // VNPay endpoints
  @Post(':id/vnpay/create-payment')
  async createVnpayPayment(
    @Param('id') id: number,
    @Req() req: Request,
    @Body('returnUrl') returnUrl?: string,
  ): Promise<{ paymentUrl: string }> {
    const payment = await this.paymentService.getPaymentById(id);
    const paymentUrl = await this.paymentService.createVnpayPaymentUrl(
      payment,
      req,
      returnUrl,
    );
    return { paymentUrl };
  }

  @Get('vnpay/return')
  async handleVnpayReturn(
    @Query() query: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const payment = await this.paymentService.processVnpayReturn(query);

      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl || !frontendUrl.startsWith('http')) {
        frontendUrl = 'http://localhost:3000';
      }

      try {
        const redirectUrl = new URL(`${frontendUrl}/checkout/return`);

        if (payment && payment.order_id) {
          redirectUrl.searchParams.append(
            'orderId',
            payment.order_id.toString(),
          );
        }

        if (payment && payment.status) {
          redirectUrl.searchParams.append('status', payment.status);
        }

        if (payment && payment.id) {
          redirectUrl.searchParams.append('paymentId', payment.id.toString());
        }

        // Tạo HTML với script tự động redirect
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Đang chuyển hướng...</title>
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            </head>
            <body>
              <h1>Đang xử lý thanh toán...</h1>
              <p>Vui lòng đợi trong giây lát, bạn sẽ được chuyển hướng tự động.</p>
              <script>
                window.location.href = "${redirectUrl.toString()}";
              </script>
            </body>
          </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (urlError) {
        console.error('Invalid redirect URL:', urlError);
        res.redirect(frontendUrl);
      }
    } catch (error) {
      console.error('Error processing VNPay return:', error);

      let frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl || !frontendUrl.startsWith('http')) {
        frontendUrl = 'http://localhost:3000';
      }

      try {
        const redirectUrl = new URL(`${frontendUrl}/checkout/return`);
        redirectUrl.searchParams.append('status', PaymentStatus.FAILED);

        if (error.message) {
          redirectUrl.searchParams.append('error', error.message);
        }

        // Tạo HTML với script tự động redirect cho trường hợp lỗi
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Đang chuyển hướng...</title>
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            </head>
            <body>
              <h1>Đang xử lý thanh toán...</h1>
              <p>Vui lòng đợi trong giây lát, bạn sẽ được chuyển hướng tự động.</p>
              <script>
                window.location.href = "${redirectUrl.toString()}";
              </script>
            </body>
          </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (urlError) {
        console.error('Invalid redirect URL:', urlError);
        res.redirect(frontendUrl);
      }
    }
  }

  @Post('vnpay/ipn')
  async handleVnpayIpn(@Body() body: any, @Res() res: Response): Promise<void> {
    const result = await this.paymentService.processVnpayIpn(body);
    res.status(200).json(result);
  }

  @Post(':id/vnpay/query')
  async queryVnpayTransaction(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<any> {
    const payment = await this.paymentService.getPaymentById(id);
    return this.paymentService.queryVnpayTransaction(payment, req);
  }

  @Post(':id/vnpay/refund')
  async refundVnpayTransaction(
    @Param('id') id: number,
    @Body('amount') amount: number,
    @Body('user') user: string,
    @Req() req: Request,
  ): Promise<any> {
    const payment = await this.paymentService.getPaymentById(id);
    return this.paymentService.refundVnpayTransaction(
      payment,
      amount,
      req,
      user,
    );
  }
}
