import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import moment from 'moment';
import * as querystring from 'qs';
import { Request } from 'express';
import axios from 'axios';

@Injectable()
export class VnpayService {
  constructor(private configService: ConfigService) {
    // Kiểm tra cấu hình khi khởi tạo service
    const tmnCode = this.configService.get<string>('vnpay.vnp_TmnCode');
    const secretKey = this.configService.get<string>('vnpay.vnp_HashSecret');
    const vnpUrl = this.configService.get<string>('vnpay.vnp_Url');
    const vnpApi = this.configService.get<string>('vnpay.vnp_Api');
    const returnUrl = this.configService.get<string>('vnpay.vnp_ReturnUrl');

    console.log('VnpayService initialized with config:', {
      tmnCode: tmnCode || 'undefined',
      secretKey: secretKey ? 'defined' : 'undefined',
      vnpUrl: vnpUrl || 'undefined',
      vnpApi: vnpApi || 'undefined',
      returnUrl: returnUrl || 'undefined',
    });
  }

  private sortObject(obj: any) {
    const sorted: any = {};
    const str: string[] = [];
    let key: string | number;

    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }

    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  async createPaymentUrl(
    amount: number,
    orderId: string,
    bankCode: string = '',
    locale: string = 'vn',
    ipAddr: string,
    returnUrl?: string,
  ) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    const tmnCode = this.configService.get<string>('vnpay.vnp_TmnCode');
    const secretKey = this.configService.get<string>('vnpay.vnp_HashSecret');
    const vnpUrl = this.configService.get<string>('vnpay.vnp_Url');
    const defaultReturnUrl = this.configService.get<string>(
      'vnpay.vnp_ReturnUrl',
    );

    console.log('createPaymentUrl config:', {
      tmnCode: tmnCode || 'undefined',
      secretKey: secretKey ? 'defined' : 'undefined',
      vnpUrl: vnpUrl || 'undefined',
      defaultReturnUrl: defaultReturnUrl || 'undefined',
    });

    if (!secretKey) {
      throw new Error('VNPay Hash Secret is not configured');
    }

    const currCode = 'VND';
    const vnpParams: any = {};

    vnpParams['vnp_Version'] = '2.1.0';
    vnpParams['vnp_Command'] = 'pay';
    vnpParams['vnp_TmnCode'] = tmnCode;
    vnpParams['vnp_Locale'] = locale;
    vnpParams['vnp_CurrCode'] = currCode;
    vnpParams['vnp_TxnRef'] = orderId;
    vnpParams['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnpParams['vnp_OrderType'] = 'other';
    vnpParams['vnp_Amount'] = amount * 100;
    vnpParams['vnp_ReturnUrl'] = returnUrl || defaultReturnUrl;
    vnpParams['vnp_IpAddr'] = ipAddr;
    vnpParams['vnp_CreateDate'] = createDate;

    if (bankCode && bankCode !== '') {
      vnpParams['vnp_BankCode'] = bankCode;
    }

    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;
    const paymentUrl =
      vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false });

    return paymentUrl;
  }

  verifyReturnUrl(vnpParams: any) {
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnpParams);
    const secretKey = this.configService.get<string>('vnpay.vnp_HashSecret');

    console.log(
      'verifyReturnUrl secretKey:',
      secretKey ? 'defined' : 'undefined',
    );

    if (!secretKey) {
      throw new Error('VNPay Hash Secret is not configured');
    }

    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  processIpnCallback(vnpParams: any) {
    const secureHash = vnpParams['vnp_SecureHash'];
    const orderId = vnpParams['vnp_TxnRef'];
    const rspCode = vnpParams['vnp_ResponseCode'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnpParams);
    const secretKey = this.configService.get<string>('vnpay.vnp_HashSecret');

    console.log(
      'processIpnCallback secretKey:',
      secretKey ? 'defined' : 'undefined',
    );

    if (!secretKey) {
      throw new Error('VNPay Hash Secret is not configured');
    }

    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // Kiểm tra checksum thành công
      return {
        isSuccess: true,
        orderId,
        rspCode,
        message: rspCode === '00' ? 'Success' : 'Failed',
      };
    } else {
      // Kiểm tra checksum thất bại
      return {
        isSuccess: false,
        orderId,
        rspCode: '97',
        message: 'Checksum failed',
      };
    }
  }

  async queryTransaction(
    orderId: string,
    transactionDate: string,
    ipAddr: string,
  ) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();

    const tmnCode = this.configService.get<string>('vnpay.vnp_TmnCode');
    const secretKey = this.configService.get<string>('vnpay.vnp_HashSecret');
    const vnpApi = this.configService.get<string>('vnpay.vnp_Api');

    console.log('queryTransaction config:', {
      tmnCode: tmnCode || 'undefined',
      secretKey: secretKey ? 'defined' : 'undefined',
      vnpApi: vnpApi || 'undefined',
    });

    if (!secretKey) {
      throw new Error('VNPay Hash Secret is not configured');
    }

    const vnpRequestId = moment(date).format('HHmmss');
    const vnpVersion = '2.1.0';
    const vnpCommand = 'querydr';
    const vnpOrderInfo = 'Truy van GD ma:' + orderId;
    const vnpCreateDate = moment(date).format('YYYYMMDDHHmmss');

    const data =
      vnpRequestId +
      '|' +
      vnpVersion +
      '|' +
      vnpCommand +
      '|' +
      tmnCode +
      '|' +
      orderId +
      '|' +
      transactionDate +
      '|' +
      vnpCreateDate +
      '|' +
      ipAddr +
      '|' +
      vnpOrderInfo;

    const hmac = crypto.createHmac('sha512', secretKey);
    const vnpSecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

    const dataObj = {
      vnp_RequestId: vnpRequestId,
      vnp_Version: vnpVersion,
      vnp_Command: vnpCommand,
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: vnpOrderInfo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: vnpCreateDate,
      vnp_IpAddr: ipAddr,
      vnp_SecureHash: vnpSecureHash,
    };

    try {
      const response = await axios.post(vnpApi, dataObj);
      return response.data;
    } catch (error) {
      throw new Error('Failed to query transaction: ' + error.message);
    }
  }

  async refundTransaction(
    orderId: string,
    transactionDate: string,
    amount: number,
    transactionType: string,
    user: string,
    ipAddr: string,
  ) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();

    const tmnCode = this.configService.get<string>('vnpay.vnp_TmnCode');
    const secretKey = this.configService.get<string>('vnpay.vnp_HashSecret');
    const vnpApi = this.configService.get<string>('vnpay.vnp_Api');

    console.log('refundTransaction config:', {
      tmnCode: tmnCode || 'undefined',
      secretKey: secretKey ? 'defined' : 'undefined',
      vnpApi: vnpApi || 'undefined',
    });

    if (!secretKey) {
      throw new Error('VNPay Hash Secret is not configured');
    }

    const vnpAmount = amount * 100;
    const vnpRequestId = moment(date).format('HHmmss');
    const vnpVersion = '2.1.0';
    const vnpCommand = 'refund';
    const vnpOrderInfo = 'Hoan tien GD ma:' + orderId;
    const vnpCreateDate = moment(date).format('YYYYMMDDHHmmss');
    const vnpTransactionNo = '0';

    const data =
      vnpRequestId +
      '|' +
      vnpVersion +
      '|' +
      vnpCommand +
      '|' +
      tmnCode +
      '|' +
      transactionType +
      '|' +
      orderId +
      '|' +
      vnpAmount +
      '|' +
      vnpTransactionNo +
      '|' +
      transactionDate +
      '|' +
      user +
      '|' +
      vnpCreateDate +
      '|' +
      ipAddr +
      '|' +
      vnpOrderInfo;

    const hmac = crypto.createHmac('sha512', secretKey);
    const vnpSecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

    const dataObj = {
      vnp_RequestId: vnpRequestId,
      vnp_Version: vnpVersion,
      vnp_Command: vnpCommand,
      vnp_TmnCode: tmnCode,
      vnp_TransactionType: transactionType,
      vnp_TxnRef: orderId,
      vnp_Amount: vnpAmount,
      vnp_TransactionNo: vnpTransactionNo,
      vnp_CreateBy: user,
      vnp_OrderInfo: vnpOrderInfo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: vnpCreateDate,
      vnp_IpAddr: ipAddr,
      vnp_SecureHash: vnpSecureHash,
    };

    try {
      const response = await axios.post(vnpApi, dataObj);
      return response.data;
    } catch (error) {
      throw new Error('Failed to refund transaction: ' + error.message);
    }
  }

  getIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress
    );
  }
}
