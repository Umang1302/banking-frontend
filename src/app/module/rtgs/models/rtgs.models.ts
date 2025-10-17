// RTGS Models and Interfaces

// Reuse Beneficiary and Account from NEFT
export interface Beneficiary {
  id?: string | number;
  beneficiaryId?: string | number;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: string;
  nickName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';
  verified?: boolean; // API uses 'verified' not 'isVerified'
  isVerified?: boolean; // Legacy field for backward compatibility
  addedOn?: string;
  createdAt?: string;
  lastUsedAt?: string | null;
}

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  active: boolean;
}

// Customer API - RTGS Transfer Models

// API: POST /api/eft/rtgs/transfer - Request
export interface RTGSTransferRequest {
  fromAccountNumber: string;
  beneficiaryId: number;
  amount: number;
  purpose: string;
  remarks?: string;
}

// API: POST /api/eft/rtgs/transfer - Response
export interface RTGSTransferResponse {
  status: string;
  message: string;
  data: {
    eftTransactionId: number;
    eftReference: string;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    fromAccountNumber: string;
    beneficiaryAccountNumber: string;
    beneficiaryName: string;
    beneficiaryBank: string;
    beneficiaryIfsc: string;
    amount: number;
    charges: number;
    totalAmount: number;
    currency: string;
    purpose: string;
    processedAt?: string;
    initiatedAt: string;
    message: string;
  };
}

// API: GET /api/eft/rtgs/status/{reference} - Response
export interface RTGSStatusResponse {
  status: string;
  message: string;
  data: {
    eftTransactionId: number;
    eftReference: string;
    eftType: string;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    fromAccountNumber: string;
    beneficiaryAccountNumber: string;
    beneficiaryName: string;
    beneficiaryBank: string;
    amount: number;
    charges: number;
    totalAmount: number;
    currency: string;
    purpose: string;
    actualCompletion?: string;
    initiatedAt: string;
    updatedAt: string;
  };
}

// API: GET /api/eft/rtgs/history/{accountNumber} - Transaction in response
export interface RTGSTransaction {
  eftTransactionId: number;
  eftReference: string;
  eftType: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fromAccountNumber: string;
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  amount: number;
  charges: number;
  totalAmount: number;
  currency: string;
  purpose: string;
  failureReason?: string | null;
  actualCompletion?: string | null;
  initiatedAt: string;
  updatedAt: string;
}

// API: GET /api/eft/rtgs/history/{accountNumber} - Response
export interface RTGSHistoryResponse {
  status: string;
  accountNumber: string;
  count: number;
  transactions: RTGSTransaction[];
}

// API: GET /api/eft/beneficiaries/active - Response
export interface BeneficiariesResponse {
  status: string;
  count: number;
  beneficiaries: Beneficiary[];
}

// API: GET /api/eft/validate-ifsc/{ifscCode} - Response
// Updated to use Razorpay IFSC API for comprehensive bank details
export interface IFSCValidationResponse {
  status: string;
  message: string;
  ifsc: string;
  bank: string;
  bankCode: string;
  branch: string;
  branchCode: string;
  address: string;
  contact: string;
  city: string;
  district: string;
  state: string;
  centre: string;
  micr: string;
  imps: boolean;
  rtgs: boolean;
  neft: boolean;
  upi: boolean;
  swift: string | null;
  iso3166: string;
  // Legacy fields for backward compatibility
  ifscCode?: string; // Maps to 'ifsc'
  bankName?: string; // Maps to 'bank'
  isValid?: boolean; // Derived from status
}

// Admin API Models

// API: GET /api/admin/eft/rtgs/dashboard - Response
export interface RTGSDashboardResponse {
  status: string;
  eftType: string;
  transactionCounts: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
  };
  financial: {
    totalAmount: number;
    totalCharges: number;
    revenue: number;
  };
  statistics: {
    successRate: string;
    failureRate: string;
  };
}

// API: GET /api/admin/eft/rtgs/transactions?status={status} - Admin Transaction
export interface AdminRTGSTransaction {
  id: number;
  eftReference: string;
  eftType: string;
  sourceAccount: {
    id: number;
    accountNumber: string;
    customer: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  beneficiaryIfsc: string;
  beneficiaryBankName: string;
  amount: number;
  charges: number;
  totalAmount: number;
  currency: string;
  purpose: string;
  status: string;
  initiatedBy: string;
  processedBy: string;
  actualCompletion?: string | null;
  createdAt: string;
  updatedAt: string;
}

// API: GET /api/admin/eft/rtgs/transactions?status={status} - Response
export interface RTGSTransactionsResponse {
  status: string;
  filter?: string;
  count: number;
  transactions: AdminRTGSTransaction[];
}

// API: GET /api/admin/eft/rtgs/statistics - Response
export interface RTGSStatisticsResponse {
  status: string;
  eftType: string;
  statusCounts: {
    PROCESSING: number;
    COMPLETED: number;
    FAILED: number;
  };
  totalBatches: number;
}

// API: GET /api/admin/eft/overview - Response
export interface EFTOverviewResponse {
  status: string;
  neft: {
    total: number;
    completed: number;
    failed: number;
    successRate: string;
  };
  rtgs: {
    total: number;
    completed: number;
    failed: number;
    successRate: string;
  };
  combined: {
    totalTransactions: number;
    totalCompleted: number;
    totalFailed: number;
  };
}

// API: GET /api/admin/eft/transactions/{reference} - Response
export interface RTGSTransactionDetailsResponse {
  status: string;
  message: string;
  data: {
    id: number;
    eftReference: string;
    eftType: string;
    sourceAccount: {
      id: number;
      accountNumber: string;
      accountType: string;
      balance: number;
      customer: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
      };
    };
    beneficiary: {
      id: number;
      beneficiaryName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
    };
    amount: number;
    charges: number;
    totalAmount: number;
    currency: string;
    purpose: string;
    remarks?: string;
    status: string;
    initiatedBy: string;
    processedBy: string;
    transaction: {
      id: number;
      transactionType: string;
      amount: number;
      status: string;
    };
    actualCompletion?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// RTGS Specific Constants
export const RTGS_CONSTANTS = {
  MIN_AMOUNT: 200000,
  MAX_AMOUNT: 10000000000, // 100 crores
  OPERATING_HOURS: {
    START: 9,
    END: 16.5 // 4:30 PM
  },
  CHARGES: {
    LOW: 30,    // For ₹2L - ₹5L
    HIGH: 55    // For > ₹5L
  }
};

// UI Helper Interfaces
export interface RTGSCharges {
  amount: number;
  charges: number;
  total: number;
}

