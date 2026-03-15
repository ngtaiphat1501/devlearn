// src/services/vnpay.service.ts
import crypto from 'crypto';
import querystring from 'querystring';

export function createVNPayUrl(orderId: string, amount: number, ipAddr: string): string {
  const tmnCode   = process.env.VNPAY_TMN_CODE!;
  const secretKey = process.env.VNPAY_HASH_SECRET!;
  const vnpUrl    = process.env.VNPAY_URL!;
  const returnUrl = process.env.VNPAY_RETURN_URL!;

  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  const params: Record<string, string> = {
    vnp_Version:   '2.1.0',
    vnp_Command:   'pay',
    vnp_TmnCode:   tmnCode,
    vnp_Locale:    'vn',
    vnp_CurrCode:  'VND',
    vnp_TxnRef:    orderId,
    vnp_OrderInfo: `Thanh toan khoa hoc DevLearn - ${orderId}`,
    vnp_OrderType: 'billpayment',
    vnp_Amount:    String(Math.round(amount) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr:    ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: (s) => s });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  sortedParams['vnp_SecureHash'] = signed;

  return `${vnpUrl}?${querystring.stringify(sortedParams)}`;
}

export function verifyVNPayReturn(params: Record<string, string>): { isValid: boolean; orderId: string } {
  const secretKey = process.env.VNPAY_HASH_SECRET!;
  const secureHash = params['vnp_SecureHash'];
  const responseCode = params['vnp_ResponseCode'];

  const p = { ...params };
  delete p['vnp_SecureHash'];
  delete p['vnp_SecureHashType'];

  const sorted = sortObject(p);
  const signData = querystring.stringify(sorted, undefined, undefined, { encodeURIComponent: (s) => s });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = secureHash === signed && responseCode === '00';
  return { isValid, orderId: params['vnp_TxnRef'] };
}

function sortObject(obj: Record<string, string>) {
  return Object.keys(obj).sort().reduce((res, key) => {
    res[key] = obj[key];
    return res;
  }, {} as Record<string, string>);
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
