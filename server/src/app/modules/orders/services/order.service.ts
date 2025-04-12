import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderInput } from './types/create-order.input';
import { OrderRepository } from '../repositories/order.repositories';
import { UpdateOrderInput } from './types/update-order.input';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../../products/entities/products.entity';
import { Address } from '../../address/entities/address.entity';
import { Order } from '../entities/order.entity';
import { AddressService } from '../../address/services/address.service';
import { GetAllOrderInput } from './types/get.all.order.input';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PromotionService } from '../../promotions/services/promotion.service';
import { JwtService } from '@nestjs/jwt';
import { ProductRepository } from '../../products/repositories/products.repositories';
import { ProductService } from '../../products/services/products.service';
import { UserRepository } from '../../users/repositories/user.repositories';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Promotion } from '../../promotions/entities/promotion.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly addressService: AddressService,
    private readonly promotionService: PromotionService,
    private readonly jwtService: JwtService,
    private readonly productRepository: ProductRepository,
    private readonly productService: ProductService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  getUserFromToken(authorization: string): {
    userId: number;
    roles: string[];
  } {
    try {
      if (!authorization) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authorization.split(' ')[1];
      const decodedToken = this.jwtService.decode(token);
      return {
        userId: decodedToken.user_id,
        roles: decodedToken.roles || [],
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async sendOrderNotification(order: Order) {
    try {
      let userData = null;
      if (order.user_id) {
        userData = await this.userRepository.findById(order.user_id);
      }

      const socketUrl =
        this.configService.get<string>('SOCKET_SERVER_URL') ||
        'http://localhost:3003';

      await axios.post(`${socketUrl}/notify/new-order`, {
        orderId: order.id,
        contactPhone: order.phone,
        orderTotal: order.total_price,
        customerName: userData ? userData.user_name : 'Khách vãng lai',
        customerEmail: userData ? userData.email : null,
        userId: order.user_id || null,
        items: order.amount || 0,
        status: order.status,
      });

      console.log('Đã gửi thông báo đơn hàng mới');
    } catch (error) {
      console.error('Lỗi khi gửi thông báo đơn hàng:', error);
    }
  }

  async createOrder(input: CreateOrderInput) {
    let address: Address;
    if (input.address_id) {
      address = { id: input.address_id } as Address;
    } else if (input.new_address) {
      address = await this.addressService.createAddressFromGoong(
        input.new_address,
      );
    } else {
      throw new BadRequestException('Address is required');
    }

    const productIds = input.order_items.map((item) => item.product_id);
    const products = await this.productRepository.findByIds(productIds);

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found');
    }

    // Kiểm tra số lượng tồn kho
    for (const item of input.order_items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new BadRequestException(
          `Sản phẩm với ID ${item.product_id} không tồn tại`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho, không đủ số lượng yêu cầu (${item.quantity})`,
        );
      }
    }

    const orderItems = input.order_items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new BadRequestException(
          `Product with id ${item.product_id} not found`,
        );
      }

      const orderItem = new OrderItem();
      orderItem.quantity = item.quantity;
      orderItem.product = { id: item.product_id } as Product;
      orderItem.price =
        product.is_sale && product.sale_price > 0
          ? product.sale_price
          : product.price;
      return orderItem;
    });

    let discountAmount = 0;
    let finalPrice = input.total_price;
    let promotionIds: number[] = [];

    if (input.promotion_ids && input.promotion_ids.length > 0) {
      promotionIds = [...input.promotion_ids];
    } else {
      for (const product of products) {
        if (
          product.is_sale &&
          product.promotions &&
          product.promotions.length > 0
        ) {
          for (const promotion of product.promotions) {
            if (!promotionIds.includes(promotion.id)) {
              promotionIds.push(promotion.id);
            }
          }
        }
      }
    }

    if (promotionIds.length > 0) {
      const productItems = input.order_items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));

      for (const promotionId of promotionIds) {
        const discountResult = await this.promotionService.calculateDiscount(
          promotionId,
          productItems,
          true,
        );

        if (discountResult.isValid) {
          discountAmount += discountResult.discountAmount;
        }
      }

      finalPrice = input.total_price - discountAmount;
      if (finalPrice < 0) finalPrice = 0;
    }

    const order = new Order();
    order.order_items = orderItems;
    order.total_price = finalPrice;
    order.original_price = input.total_price;
    order.discount_amount = discountAmount;
    order.amount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    if (promotionIds.length > 0) {
      order.promotions = promotionIds.map((id) => ({ id }) as Promotion);
    }

    order.phone = input.phone;
    order.status = input.status || OrderStatus.PENDING;
    order.address = address;

    order.payment_method = input.payment_method;
    order.payment_status = PaymentStatus.UNPAID;
    if (input.payment_method === PaymentMethod.COD) {
      order.payment_status = PaymentStatus.PENDING;
    }

    if (input.user_id) {
      order.user_id = input.user_id;
    }

    const createdOrder = await this.orderRepository.create(order);

    await this.sendOrderNotification(createdOrder);

    return createdOrder;
  }

  async getOrderById(id: number) {
    return this.orderRepository.findById(id);
  }

  async getAllOrders(queryParams: GetAllOrderInput) {
    const { page = 1, size = 10, user_id, status, searchAddress } = queryParams;

    const [orders, total] = await this.orderRepository.findAll(
      {
        skip: (page - 1) * size,
        take: size,
      },
      user_id,
      status,
      searchAddress,
    );

    const totalPages = Math.ceil(total / size);

    return {
      total,
      totalPages,
      currentPage: page,
      orders,
    };
  }

  async updateOrder(input: UpdateOrderInput) {
    const currentOrder = await this.orderRepository.findById(input.id);
    if (!currentOrder) {
      throw new BadRequestException(`Order with id ${input.id} not found`);
    }

    const previousPaymentStatus = currentOrder.payment_status;
    const previousOrderStatus = currentOrder.status;

    if (input.payment_status) {
      if (input.payment_status === PaymentStatus.PAID && !input.paid_at) {
        input.paid_at = new Date();
      }

      if (input.status) {
        currentOrder.status = input.status;
      }

      if (input.status === OrderStatus.CANCELLED) {
        if (currentOrder.payment_status === PaymentStatus.PAID) {
          input.payment_status = PaymentStatus.REFUNDED;
        } else {
          input.payment_status = PaymentStatus.FAILED;
        }
      }
    }

    let address = currentOrder.address;
    if (
      (input.address_id || input.new_address) &&
      currentOrder.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException(
        'Không thể thay đổi địa chỉ khi đơn hàng không còn ở trạng thái chờ xử lý',
      );
    } else if (input.address_id) {
      address = { id: input.address_id } as Address;
    } else if (input.new_address) {
      address = await this.addressService.createAddressFromGoong(
        input.new_address,
      );
    }

    // Xử lý promotion_ids
    let promotionIds: number[] = [];
    if (input.promotion_ids && input.promotion_ids.length > 0) {
      promotionIds = [...input.promotion_ids];
    }

    // Xử lý giảm giá nếu có thay đổi về promotions
    let discountAmount = currentOrder.discount_amount;
    let finalPrice = input.total_price || currentOrder.total_price;
    let orderPromotions = null;

    if (
      promotionIds.length > 0 &&
      currentOrder.status === OrderStatus.PENDING
    ) {
      const productItems = currentOrder.order_items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Tính lại tổng giảm giá từ tất cả các promotion
      discountAmount = 0;
      for (const promotionId of promotionIds) {
        const discountResult = await this.promotionService.calculateDiscount(
          promotionId,
          productItems,
          true,
        );

        if (discountResult.isValid) {
          discountAmount += discountResult.discountAmount;
        }
      }

      finalPrice = currentOrder.original_price - discountAmount;
      if (finalPrice < 0) finalPrice = 0;

      // Cập nhật mối quan hệ promotions
      orderPromotions = promotionIds.map((id) => ({ id }) as Promotion);
    }

    if (input.order_items && input.order_items.length > 0) {
      if (currentOrder.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Không thể thay đổi sản phẩm khi đơn hàng không còn ở trạng thái chờ xử lý',
        );
      }

      const productIds = input.order_items.map((item) => item.product_id);
      const products = await this.productRepository.findByIds(productIds);

      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products not found');
      }

      const orderItems = input.order_items.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) {
          throw new BadRequestException(
            `Product with id ${item.product_id} not found`,
          );
        }

        const orderItem = new OrderItem();
        orderItem.quantity = item.quantity;
        orderItem.product = { id: item.product_id } as Product;
        orderItem.price =
          product.is_sale && product.sale_price > 0
            ? product.sale_price
            : product.price;
        return orderItem;
      });

      const orderUpdate: Partial<Order> = {
        status: input.status,
        phone: input.phone,
        total_price: finalPrice,
        original_price: input.total_price || currentOrder.original_price,
        discount_amount: discountAmount,
        payment_status: input.payment_status,
        payment_method: input.payment_method,
        paid_at: input.paid_at,
        address,
        order_items: orderItems,
      };

      // Cập nhật promotions nếu có
      if (orderPromotions) {
        orderUpdate.promotions = orderPromotions;
      }

      return this.orderRepository.update(input.id, orderUpdate);
    }

    if (
      input.payment_status === PaymentStatus.PAID &&
      previousPaymentStatus !== PaymentStatus.PAID
    ) {
      await this.updateProductStockFromOrderItems(
        currentOrder.order_items,
        true,
      );
    }

    if (
      input.status === OrderStatus.CANCELLED &&
      previousOrderStatus !== OrderStatus.CANCELLED &&
      (previousPaymentStatus === PaymentStatus.PAID ||
        currentOrder.payment_status === PaymentStatus.PAID)
    ) {
      await this.updateProductStockFromOrderItems(
        currentOrder.order_items,
        false,
      );
    }

    const orderUpdate: Partial<Order> = {
      status: input.status,
      phone: input.phone,
      total_price: finalPrice,
      discount_amount: discountAmount,
      payment_status: input.payment_status,
      payment_method: input.payment_method,
      paid_at: input.paid_at,
      address,
    };

    // Cập nhật promotions nếu có
    if (orderPromotions) {
      orderUpdate.promotions = orderPromotions;
    }

    return this.orderRepository.update(input.id, orderUpdate);
  }

  async deleteOrder(id: number) {
    return this.orderRepository.delete(id);
  }

  async updatePaymentStatus(
    orderId: number,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
  ) {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        throw new BadRequestException(
          `Không tìm thấy đơn hàng với ID ${orderId}`,
        );
      }

      const previousPaymentStatus = order.payment_status;
      order.payment_status = paymentStatus;
      order.payment_method = paymentMethod;

      if (paymentStatus === PaymentStatus.PAID) {
        order.paid_at = new Date();
        if (order.status === OrderStatus.PENDING) {
          order.payment_status = PaymentStatus.PAID;
        }

        if (previousPaymentStatus !== PaymentStatus.PAID) {
          await this.updateProductStockFromOrderItems(order.order_items, true);
        }
      } else if (
        paymentStatus === PaymentStatus.REFUNDED ||
        paymentStatus === PaymentStatus.FAILED
      ) {
        if (previousPaymentStatus === PaymentStatus.PAID) {
          await this.updateProductStockFromOrderItems(order.order_items, false);
        }
      }

      return this.orderRepository.update(order.id, order);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  private async updateProductStockFromOrderItems(
    orderItems: OrderItem[],
    isDecrease: boolean,
  ) {
    try {
      const items = orderItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await this.productService.updateMultipleProductsStock(items, isDecrease);
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw new BadRequestException('Không thể cập nhật số lượng sản phẩm');
    }
  }
}
