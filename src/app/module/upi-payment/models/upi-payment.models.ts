// UPI Payment Models and Interfaces

// UPI Account Registration Request (API: POST /api/upi/register)
export interface UPIRegisterRequest {
  upiId: string;
  accountNumber: string;
  isPrimary: boolean;
}

// UPI Account Registration Response (API: POST /api/upi/register)
export interface UPIRegisterResponse {
  success: boolean;
  message: string;
  id?: number;
  upiId?: string;
  accountNumber?: string;
  upiProvider?: 'PAYTM' | 'PHONEPE' | 'GOOGLEPAY' | 'BHIM' | 'OTHER' | 'BOP';
  isPrimary?: boolean; // Request uses isPrimary
  primary?: boolean; // API might return primary
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt?: string;
}

// UPI Account (API: GET /api/upi/accounts)
export interface UPIAccount {
  id: number;
  upiId: string;
  accountNumber: string;
  upiProvider: 'PAYTM' | 'PHONEPE' | 'GOOGLEPAY' | 'BHIM' | 'OTHER' | 'BOP';
  primary: boolean; // API uses 'primary' not 'isPrimary'
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  verified: boolean; // API uses 'verified' not 'isVerified'
  verifiedAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

// UPI ID Validation (API: GET /api/upi/validate/{upiId})
export interface UPIValidationResponse {
  valid: boolean;
  message: string;
  provider?: 'PAYTM' | 'PHONEPE' | 'GOOGLEPAY' | 'BHIM' | 'OTHER';
}

// UPI Payment Request (API: POST /api/upi/pay)
export interface UPIPaymentRequest {
  receiverUpiId: string;
  payerAccountNumber: string;
  amount: number;
  description?: string;
  currency: string;
}

// UPI Payment Initiation Response (API: POST /api/upi/pay)
export interface UPIPaymentInitiateResponse {
  success: boolean;
  message: string;
  transactionReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string | null;
  paymentLink?: string;
  receiverUpiId?: string;
  receiverAccountNumber?: string;
  receiverName?: string;
  payerAccountNumber?: string;
  amount?: number;
  currency?: string;
  status: 'INITIATED' | 'SETTLED' | 'FAILED';
  initiatedAt?: string;
}

// UPI Payment Settle Request (API: POST /api/upi/settle)
export interface UPIPaymentSettleRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// UPI Payment Settle Response (API: POST /api/upi/settle)
export interface UPIPaymentSettleResponse {
  success: boolean;
  message: string;
  transactionReference?: string;
  razorpayPaymentId?: string;
  receiverUpiId?: string;
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

// UPI Transaction (API: GET /api/upi/transactions/{accountNumber})
export interface UPITransaction {
  id: number;
  transactionReference: string;
  paymentType: 'UPI';
  razorpayPaymentId: string;
  razorpayOrderId: string;
  payerAccountNumber: string;
  receiverAccountNumber: string;
  receiverName: string;
  amount: number;
  razorpayFee: number;
  netAmount: number;
  currency: string;
  status: 'INITIATED' | 'SETTLED' | 'FAILED';
  paymentMethod: string;
  description?: string;
  initiatedBy: string;
  failureReason?: string | null;
  initiatedAt: string;
  settledAt?: string | null;
  debitTransactionId?: number;
  creditTransactionId?: number;
}

// Delete/Deactivate UPI Response (API: DELETE /api/upi/accounts/{upiId})
export interface UPIDeleteResponse {
  message: string;
}

// Set Primary UPI Response (API: PUT /api/upi/accounts/{upiId}/set-primary)
export interface UPISetPrimaryResponse {
  message: string;
}

// Razorpay UPI Options
export interface RazorpayUPIOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  method: 'upi';
  handler: (response: RazorpayUPIResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

// Razorpay UPI Response
export interface RazorpayUPIResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// State Management
export interface UPIState {
  upiAccounts: UPIAccount[];
  primaryUPI: UPIAccount | null;
  upiTransactions: UPITransaction[];
  loading: boolean;
  error: string | null;
}

// Common Payment State
export interface PaymentState {
  initiatedPayment: {
    orderId: string;
    amount: number;
    type: 'QR' | 'UPI';
  } | null;
  paymentInProgress: boolean;
  paymentSuccess: boolean;
  paymentError: string | null;
}

