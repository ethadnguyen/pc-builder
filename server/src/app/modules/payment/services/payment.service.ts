import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PaymentRepository } from '../repositories/payment.repositories';
import { CreatePaymentInput } from './types/create-payment.input';
import { UpdatePaymentInput } from './types/update-payment.input';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { VnpayService } from './vnpay.service';
import { GetAllPaymentInput } from './types/get.all.payment.input';

@Injectable()
export class PaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private vnpayService: VnpayService,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const payment = new Payment();
    payment.quantity = input.quantity;
    payment.total_price = input.total_price;
    payment.order_id = input.order_id;
    payment.payment_method = input.payment_method;
    payment.status = input.status || PaymentStatus.UNPAID;
    payment.transaction_id = input.transaction_id;
    payment.payment_details = input.payment_details;

    return this.paymentRepository.create(payment);
  }

  async getPaymentById(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async getPaymentsByOrderId(orderId: number): Promise<Payment[]> {
    return this.paymentRepository.findByOrderId(orderId);
  }

  async getAllPayments(query: GetAllPaymentInput) {
    const { page = 1, size = 10, status, payment_method, order_id } = query;
    const [payments, total] = await this.paymentRepository.findAll(
      { skip: (page - 1) * size, take: size },
      status,
      payment_method,
      order_id,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      payments,
    };
  }

  async updatePaymentStatus(input: UpdatePaymentInput) {
    const payment = await this.getPaymentById(input.id);

    const updateData: Partial<Payment> = { status: input.status };
    if (input.payment_details) {
      updateData.payment_details = input.payment_details;
    }

    return this.paymentRepository.update(input.id, updateData);
  }

  async deletePayment(id: number): Promise<void> {
    const payment = await this.getPaymentById(id);
    return this.paymentRepository.delete(id);
  }

  async createVnpayPaymentUrl(
    payment: Payment,
    req: Request,
    returnUrl?: string,
  ): Promise<string> {
    const ipAddr = this.vnpayService.getIpAddress(req);
    const orderId = `${payment.id}_${new Date().getTime()}`;

    await this.paymentRepository.update(payment.id, {
      transaction_id: orderId,
      status: PaymentStatus.PENDING,
    });

    return this.vnpayService.createPaymentUrl(
      payment.total_price,
      orderId,
      '',
      'vn',
      ipAddr,
      returnUrl,
    );
  }

  async processVnpayReturn(vnpParams: any): Promise<Payment> {
    const isValidSignature = this.vnpayService.verifyReturnUrl(vnpParams);

    if (!isValidSignature) {
      throw new Error('Invalid signature from VNPay');
    }

    const transactionId = vnpParams['vnp_TxnRef'];
    const responseCode = vnpParams['vnp_ResponseCode'];

    // Tìm payment dựa trên transaction_id
    const payment =
      await this.paymentRepository.findByTransactionId(transactionId);

    if (!payment) {
      throw new Error(`Payment with transaction ID ${transactionId} not found`);
    }

    let status = PaymentStatus.FAILED;
    if (responseCode === '00') {
      status = PaymentStatus.PAID;
    }

    const paymentDetails = JSON.stringify(vnpParams);

    return this.updatePaymentStatus({
      id: payment.id,
      status,
      payment_details: paymentDetails,
    });
  }

  async processVnpayIpn(vnpParams: any): Promise<{
    RspCode: string;
    Message: string;
  }> {
    const ipnResult = this.vnpayService.processIpnCallback(vnpParams);

    if (!ipnResult.isSuccess) {
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    const transactionId = vnpParams['vnp_TxnRef'];
    const responseCode = vnpParams['vnp_ResponseCode'];

    try {
      // Tìm payment dựa trên transaction_id
      const payment =
        await this.paymentRepository.findByTransactionId(transactionId);

      if (!payment) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Kiểm tra số tiền
      const vnpAmount = Number(vnpParams['vnp_Amount']) / 100;
      if (payment.total_price !== vnpAmount) {
        return { RspCode: '04', Message: 'Amount invalid' };
      }

      // Kiểm tra trạng thái thanh toán
      if (payment.status === PaymentStatus.PAID) {
        return {
          RspCode: '02',
          Message: 'This order has been updated to the payment status',
        };
      }

      let status = PaymentStatus.FAILED;
      if (responseCode === '00') {
        status = PaymentStatus.PAID;
      }

      const paymentDetails = JSON.stringify(vnpParams);
      await this.updatePaymentStatus({
        id: payment.id,
        status,
        payment_details: paymentDetails,
      });

      return { RspCode: '00', Message: 'Success' };
    } catch (error) {
      return { RspCode: '01', Message: 'Order not found' };
    }
  }

  async queryVnpayTransaction(payment: Payment, req: Request): Promise<any> {
    if (!payment.transaction_id) {
      throw new Error('Payment has no transaction ID');
    }

    const ipAddr = this.vnpayService.getIpAddress(req);
    const transactionDate = payment.created_at
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');

    return this.vnpayService.queryTransaction(
      payment.transaction_id,
      transactionDate,
      ipAddr,
    );
  }

  async refundVnpayTransaction(
    payment: Payment,
    amount: number,
    req: Request,
    user: string,
  ): Promise<any> {
    if (!payment.transaction_id) {
      throw new Error('Payment has no transaction ID');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new Error('Only paid transactions can be refunded');
    }

    const ipAddr = this.vnpayService.getIpAddress(req);
    const transactionDate = payment.created_at
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');

    const refundResult = await this.vnpayService.refundTransaction(
      payment.transaction_id,
      transactionDate,
      amount || payment.total_price,
      '02',
      user,
      ipAddr,
    );

    if (refundResult && refundResult.vnp_ResponseCode === '00') {
      await this.updatePaymentStatus({
        id: payment.id,
        status: PaymentStatus.REFUNDED,
        payment_details: JSON.stringify(refundResult),
      });
    }

    return refundResult;
  }
}
