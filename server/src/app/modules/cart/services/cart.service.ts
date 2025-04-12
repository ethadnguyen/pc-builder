import { Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from '../repositories/cart.repositories';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductRepository } from '../../products/repositories/products.repositories';
import { CreateCartItemInput } from './types/create-cart-item.input';
import { UpdateCartItemInput } from './types/update-cart-item.input';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getOrCreateCart(user_id: number): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(user_id);

    if (!cart) {
      const newCart = new Cart();
      newCart.user_id = user_id;
      cart = await this.cartRepository.create(newCart);
    }

    return cart;
  }

  async addToCart(
    user_id: number,
    createCartItemDto: CreateCartItemInput,
  ): Promise<CartItem> {
    const { product_id, quantity } = createCartItemDto;

    const product = await this.productRepository.findById(product_id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    const cart = await this.getOrCreateCart(user_id);

    const cartItem = new CartItem();
    cartItem.cart = cart;
    cartItem.product = product;
    cartItem.cart_id = cart.id;
    cartItem.product_id = product_id;
    cartItem.quantity = quantity;
    cartItem.price = product.price;

    return await this.cartRepository.addItem(cartItem);
  }

  async updateCartItem(
    user_id: number,
    updateCartItemDto: UpdateCartItemInput,
  ): Promise<CartItem> {
    const { product_id, quantity } = updateCartItemDto;

    const cart = await this.cartRepository.findByUserId(user_id);
    if (!cart) {
      throw new NotFoundException(`Cart not found for user ${user_id}`);
    }

    const product = await this.productRepository.findById(product_id);
    if (product) {
      await this.cartRepository.updateItemPrice(
        cart.id,
        product_id,
        product.price,
      );
    }

    return await this.cartRepository.updateItemQuantity(
      cart.id,
      product_id,
      quantity,
    );
  }

  async removeFromCart(user_id: number, product_id: number): Promise<void> {
    const cart = await this.cartRepository.findByUserId(user_id);
    if (!cart) {
      throw new NotFoundException(`Cart not found for user ${user_id}`);
    }

    await this.cartRepository.removeItem(cart.id, product_id);
  }

  async clearCart(user_id: number): Promise<void> {
    const cart = await this.cartRepository.findByUserId(user_id);
    if (!cart) {
      throw new NotFoundException(`Cart not found for user ${user_id}`);
    }

    await this.cartRepository.clearCart(cart.id);
  }

  // Phương thức đồng bộ giá sản phẩm trong giỏ hàng với giá sản phẩm hiện tại
  async synchronizeCartItemPrices(
    cart_id: number,
    items: CartItem[],
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const priceUpdatePromises = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.product_id);
      if (product && product.price !== item.price) {
        priceUpdatePromises.push(
          this.cartRepository.updateItemPrice(
            cart_id,
            item.product_id,
            product.price,
          ),
        );
      }
    }

    if (priceUpdatePromises.length > 0) {
      await Promise.all(priceUpdatePromises);
    }
  }

  async getCart(user_id: number): Promise<{
    items: CartItem[];
    total: number;
    item_count: number;
  }> {
    const cart = await this.cartRepository.findByUserId(user_id);
    if (!cart) {
      return {
        items: [],
        total: 0,
        item_count: 0,
      };
    }

    // Đồng bộ hóa giá sản phẩm trong giỏ hàng với giá hiện tại
    if (cart.items && cart.items.length > 0) {
      await this.synchronizeCartItemPrices(cart.id, cart.items);
      // Lấy lại giỏ hàng sau khi đồng bộ giá
      const updatedCart = await this.cartRepository.findById(cart.id);
      cart.items = updatedCart.items;
    }

    const [total, item_count] = await Promise.all([
      this.cartRepository.getCartTotal(cart.id),
      this.cartRepository.getItemCount(cart.id),
    ]);

    return {
      items: cart.items,
      total,
      item_count,
    };
  }

  async deleteCart(user_id: number): Promise<void> {
    const cart = await this.cartRepository.findByUserId(user_id);
    if (!cart) {
      throw new NotFoundException(`Cart not found for user ${user_id}`);
    }

    await this.cartRepository.delete(cart.id);
  }
}
