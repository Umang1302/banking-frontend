// QR Payment Models and Interfaces
// Version 2.0 - Pure Internal Bank Transfer (No Razorpay)
// QR Format: BOP_PAY|<requestId>|<accountNumber>|<amount>|<description>

// QR Code Generation Request (API: POST /api/qr/generate)
export interface QRGenerateRequest {
  accountNumber: string;
  amount: number;
  description?: string;
  currency?: string;
  expiryHours?: number;
}

// QR Code Generation Response (API: POST /api/qr/generate)
export interface QRGenerateResponse {
  id: number;
  requestId: string;
  accountNumber: string;
  receiverName: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'CREATED' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  qrCodeData: string; // Base64 encoded PNG image
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

// QR Code Parse Request (API: POST /api/qr/parse)
export interface QRParseRequest {
  qrCodeData: string; // Base64 encoded image (with or without data URL prefix)
}

// QR Code Parse Response (API: POST /api/qr/parse)
export interface QRParseResponse {
  valid: boolean;
  message: string;
  requestId?: string;
  receiverAccountNumber?: string;
  receiverName?: string;
  amount?: number;
  currency?: string;
  description?: string;
  expiresAt?: string;
  expired?: boolean;
}

// QR Payment Request (API: POST /api/qr/pay)
export interface QRPaymentRequest {
  requestId: string;
  payerAccountNumber: string;
}

// QR Payment Response (API: POST /api/qr/pay)
export interface QRPaymentResponse {
  success: boolean;
  message: string;
  transactionReference?: string;
  qrRequestId?: string;
  payerAccountNumber?: string;
  receiverAccountNumber?: string;
  receiverName?: string;
  amount?: number;
  currency?: string;
  status: 'INITIATED' | 'SETTLED' | 'FAILED';
  payerBalanceBefore?: number;
  payerBalanceAfter?: number;
  paidAt?: string;
  debitTransactionId?: number;
  creditTransactionId?: number;
}

// My QR Requests (API: GET /api/qr/my-requests)
export interface QRRequest {
  id: number;
  requestId: string;
  accountNumber: string;
  receiverName: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'CREATED' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  qrCodeData: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

// QR Transaction (API: GET /api/qr/transactions/{accountNumber})
export interface QRTransaction {
  id: number;
  transactionReference: string;
  paymentType: 'QR_CODE';
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  payerAccountNumber: string;
  receiverAccountNumber: string;
  receiverName: string;
  amount: number;
  razorpayFee: number;
  netAmount: number;
  currency: string;
  status: 'INITIATED' | 'PENDING' | 'SETTLED' | 'FAILED';
  paymentMethod: 'INTERNAL' | 'UPI';
  description?: string;
  initiatedBy: string;
  failureReason?: string | null;
  initiatedAt: string;
  settledAt?: string | null;
  debitTransactionId?: number;
  creditTransactionId?: number;
}

// State Management
export interface QRPaymentState {
  activeQRRequests: QRRequest[];
  currentQRCode: string | null;
  selectedQRRequest: QRRequest | null;
  qrTransactions: QRTransaction[];
  loading: boolean;
  error: string | null;
}

