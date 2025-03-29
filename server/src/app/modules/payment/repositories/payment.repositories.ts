import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async create(payment: Payment): Promise<Payment> {
    const savedPayment = await this.paymentRepository.save(payment);
    return this.findById(savedPayment.id);
  }

  async findById(id: number): Promise<Payment> {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
  }

  async findByOrderId(orderId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { order_id: orderId },
      relations: ['order'],
    });
  }

  async findAll(
    paginationOptions: {
      skip: number;
      take: number;
    },
    status?: string,
    paymentMethod?: string,
    orderId?: number,
  ): Promise<[Payment[], number]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    queryBuilder.leftJoinAndSelect('payment.order', 'order');

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (paymentMethod) {
      queryBuilder.andWhere('payment.payment_method = :paymentMethod', {
        paymentMethod,
      });
    }

    if (orderId) {
      queryBuilder.andWhere('payment.order_id = :orderId', { orderId });
    }

    queryBuilder.orderBy('payment.createdAt', 'DESC');
    queryBuilder.skip(paginationOptions.skip);
    queryBuilder.take(paginationOptions.take);

    const [payments, total] = await queryBuilder.getManyAndCount();

    return [payments, total];
  }

  async update(id: number, payment: Partial<Payment>): Promise<Payment> {
    await this.paymentRepository.update(id, payment);
    return this.findById(id);
  }

  async findByTransactionId(transactionId: string): Promise<Payment> {
    return this.paymentRepository.findOne({
      where: { transaction_id: transactionId },
      relations: ['order'],
    });
  }

  async delete(id: number): Promise<void> {
    await this.paymentRepository.delete(id);
  }
}
