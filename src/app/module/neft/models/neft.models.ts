// NEFT Models and Interfaces

// Customer API Beneficiary Models (APIs 1-6)
export interface Beneficiary {
  id?: string | number; // API returns "id" field
  beneficiaryId?: string | number; // Mapped from id for compatibility
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType: string;
  nickname?: string;
  email?: string; // Optional email field (API accepts this)
  mobile?: string; // Optional mobile field (API accepts 10-15 digits with optional +)
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';
  verified?: boolean; // API uses 'verified' not 'isVerified'
  isVerified?: boolean; // Legacy field for backward compatibility
  createdAt: string;
  lastUsedAt: string | null;
}

// API 2: GET /api/eft/beneficiaries - Response
export interface BeneficiariesResponse {
  status: string;
  count: number;
  beneficiaries: Beneficiary[];
}

// API 1, 4, 5: Single Beneficiary Response (Add, Get by ID, Update)
export interface BeneficiaryResponse {
  status: string;
  message: string;
  data: Beneficiary;
}

// API 6: DELETE /api/eft/beneficiaries/{id} - Response
export interface BeneficiaryDeleteResponse {
  status: string;
  message: string;
}

// API 7: GET /api/eft/validate-ifsc/{ifscCode} - Response
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

// Customer API NEFT Transfer Models (APIs 8-10)

// API 10: NEFT Transaction in history response
export interface NEFTTransfer {
  eftTransactionId: number;
  eftReference: string;
  eftType: string;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fromAccountNumber: string;
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  amount: number;
  charges: number;
  totalAmount: number;
  currency: string;
  purpose: string;
  batchId: string | null;
  batchTime: string | null;
  estimatedCompletion: string | null;
  actualCompletion: string | null;
  failureReason: string | null;
  initiatedAt: string;
  updatedAt: string;
}

// API 10: GET /api/eft/neft/history/{accountNumber} - Response
export interface NEFTHistoryResponse {
  status: string;
  accountNumber: string;
  count: number;
  transactions: NEFTTransfer[];
}

export interface NEFTBatch {
  id: string;
  batchTime: Date | string;
  scheduledTime: Date | string;
  processingStarted?: Date | string;
  processingCompleted?: Date | string;
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  transactionCount: number;
  successCount: number;
  failedCount: number;
  totalAmount: number;
  successRate: number;
  duration?: number;
}

export interface TransferTimeline {
  step: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'FAILED';
  timestamp?: Date | string;
  details?: string;
  processedBy?: string;
}

export interface ChargesSlab {
  minAmount: number;
  maxAmount: number;
  charges: number;
  gstRate: number;
  totalCharges: number;
}

export interface NEFTCharges {
  amount: number;
  charges: number;
  gst: number;
  total: number;
}

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  interestRate?: number | null;
  minimumBalance: number;
  createdAt: string;
  updatedAt: string;
  lastTransactionDate?: string | null;
  active: boolean;
}

// API 8: POST /api/eft/transfer/initiate - Request
export interface TransferRequest {
  fromAccountNumber: string;
  beneficiaryId: number;
  amount: number;
  purpose: string;
  remarks?: string;
}

// API 8: POST /api/eft/transfer/initiate - Response
export interface TransferResponse {
  status: string;
  message: string;
  data: {
    eftTransactionId: number;
    eftReference: string;
    eftType: string;
    status: string;
    fromAccountNumber: string;
    toAccountNumber: string;
    beneficiaryName: string;
    beneficiaryBank: string;
    beneficiaryIfsc: string;
    amount: number;
    charges: number;
    totalAmount: number;
    currency: string;
    purpose: string;
    nextBatchTime: string;
    estimatedCompletion: string;
    initiatedAt: string;
  };
}

// API 9: GET /api/eft/neft/status/{reference} - Response
export interface TransactionStatusResponse {
  status: string;
  message: string;
  data: NEFTTransfer;
}

// Admin specific interfaces

// Dashboard API Response
export interface AdminDashboardResponse {
  status: string;
  eftType: string;
  transactionCounts: {
    total: number;
    pending: number;
    queued: number;
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

// Batches List API Response
export interface BatchesResponse {
  status: string;
  count: number;
  batches: BatchSummary[];
}

// API 2: GET /api/admin/eft/batches - Batch Summary in list
export interface BatchSummary {
  batchId: string;
  batchTime: string;
  transactionCount: number;
  totalAmount: number;
  status: string;
  processedAt: string | null;
}

// Batch Details API Response (API 3: GET /api/admin/eft/batches/{batchId})
export interface BatchDetailsResponse {
  status: string;
  message: string;
  data: {
    batchId: string;
    batchTime: string;
    processedAt: string;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalAmount: number;
    status: string;
    transactions: BatchTransaction[];
  };
}

export interface BatchTransaction {
  eftTransactionId: number;
  eftReference: string;
  eftType: string;
  status: string;
  fromAccountNumber: string;
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  amount: number;
  charges: number;
  totalAmount: number;
  currency: string;
  purpose: string;
  batchId: string;
  batchTime: string;
  estimatedCompletion: string;
  actualCompletion: string | null;
  failureReason: string | null;
  initiatedAt: string;
  updatedAt: string;
}

// Transactions List API Response
export interface TransactionsResponse {
  status: string;
  filter?: string;
  count: number;
  transactions: AdminTransaction[];
}

// API 4 & API 5: Transaction in list responses (Pending & All Transactions)
export interface AdminTransaction {
  id: number;
  eftReference: string;
  eftType: string;
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
  batchId: string | null;
  batchTime: string | null;
  estimatedCompletion: string | null;
  actualCompletion: string | null;
  initiatedBy: string;
  processedBy: string | null;
  failureReason: string | null;
  externalReference: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

// Pending Transactions API Response
export interface PendingTransactionsResponse {
  status: string;
  count: number;
  transactions: AdminTransaction[];
}

// Transaction Details API Response (API 6: GET /api/admin/eft/transactions/{reference})
export interface TransactionDetailsResponse {
  status: string;
  message: string;
  data: {
    id: number;
    eftReference: string;
    eftType: string;
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
    batchId: string | null;
    batchTime: string | null;
    estimatedCompletion: string | null;
    actualCompletion: string | null;
    initiatedBy: string;
    processedBy: string | null;
    failureReason: string | null;
    externalReference: string | null;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Beneficiaries Admin API Response (API 7: GET /api/admin/eft/beneficiaries)
export interface AdminBeneficiariesResponse {
  status: string;
  count: number;
  beneficiaries: AdminBeneficiary[];
}

export interface AdminBeneficiary {
  id: number; // API returns "id" field
  beneficiaryId?: number; // For compatibility
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
  nickname: string;
  status: string;
  verified?: boolean; // API uses 'verified' not 'isVerified'
  isVerified?: boolean; // Legacy field for backward compatibility
  customerId: number;
  customerName: string;
  createdAt: string;
  lastUsedAt: string;
}

// Pending Beneficiaries API Response (Approval API 1: GET /api/admin/eft/beneficiaries/pending)
export interface PendingBeneficiariesResponse {
  status: string;
  count: number;
  beneficiaries: PendingBeneficiary[];
}

export interface PendingBeneficiary {
  id: number;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  nickname: string;
  email: string | null;
  mobile: string | null;
  verified?: boolean; // API uses 'verified' not 'isVerified'
  isVerified?: boolean; // Legacy field for backward compatibility
  status: string; // PENDING_VERIFICATION
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Approve Beneficiary API Response (Approval API 2: POST /api/admin/eft/beneficiaries/{id}/approve)
export interface ApproveBeneficiaryResponse {
  status: string;
  message: string;
  data: PendingBeneficiary;
}

// Reject/Block Beneficiary API Response (Approval API 3 & 4)
export interface BeneficiaryActionResponse {
  status: string;
  message: string;
}

// Reject/Block Request Body
export interface BeneficiaryActionRequest {
  reason?: string;
}

// Statistics API Response
export interface StatisticsResponse {
  status: string;
  eftType: string;
  statusCounts: {
    PENDING: number;
    QUEUED: number;
    PROCESSING: number;
    COMPLETED: number;
    FAILED: number;
  };
  totalBatches: number;
}

// Batch Processing API Response
export interface BatchProcessResponse {
  status: string;
  message: string;
}

export interface AdminStatistics {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
}

export interface FailedTransferAnalysis {
  failureReason: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface BankDistribution {
  bankName: string;
  count: number;
  amount: number;
  successRate: number;
}

