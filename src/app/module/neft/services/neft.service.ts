import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  Beneficiary,
  BeneficiariesResponse,
  BeneficiaryResponse,
  BeneficiaryDeleteResponse,
  IFSCValidationResponse,
  NEFTTransfer,
  NEFTHistoryResponse,
  TransferRequest,
  TransferResponse,
  TransactionStatusResponse,
  NEFTCharges,
  Account,
  AdminDashboardResponse,
  BatchesResponse,
  BatchDetailsResponse,
  TransactionsResponse,
  PendingTransactionsResponse,
  TransactionDetailsResponse,
  AdminBeneficiariesResponse,
  StatisticsResponse,
  BatchProcessResponse,
  AdminTransaction,
  PendingBeneficiariesResponse,
  ApproveBeneficiaryResponse,
  BeneficiaryActionResponse,
  BeneficiaryActionRequest
} from '../models/neft.models';

@Injectable({
  providedIn: 'root'
})
export class NeftService {
  private apiService = inject(ApiService);

  // ============= Customer APIs =============

  // Beneficiary Management (APIs 1-6)
  
  // API 2: GET /api/eft/beneficiaries
  getBeneficiaries(): Observable<BeneficiariesResponse> {
    return this.apiService.get('eft/beneficiaries');
  }

  // API 3: GET /api/eft/beneficiaries/active
  getActiveBeneficiaries(): Observable<BeneficiariesResponse> {
    return this.apiService.get('eft/beneficiaries/active');
  }

  // API 4: GET /api/eft/beneficiaries/{id}
  getBeneficiaryById(id: string): Observable<BeneficiaryResponse> {
    return this.apiService.get(`eft/beneficiaries/${id}`);
  }

  // API 1: POST /api/eft/beneficiaries
  addBeneficiary(beneficiary: Partial<Beneficiary>): Observable<BeneficiaryResponse> {
    return this.apiService.post('eft/beneficiaries', beneficiary);
  }

  // API 5: PUT /api/eft/beneficiaries/{id}
  updateBeneficiary(id: string, beneficiary: Partial<Beneficiary>): Observable<BeneficiaryResponse> {
    return this.apiService.put(`eft/beneficiaries/${id}`, beneficiary);
  }

  // API 6: DELETE /api/eft/beneficiaries/{id}
  deleteBeneficiary(id: string): Observable<BeneficiaryDeleteResponse> {
    return this.apiService.delete(`eft/beneficiaries/${id}`);
  }

  // API 7: GET /api/eft/validate-ifsc/{ifscCode}
  validateIFSC(ifscCode: string): Observable<IFSCValidationResponse> {
    return this.apiService.get(`eft/validate-ifsc/${ifscCode}`);
  }

  // NEFT Transfer Operations (APIs 8-10)
  
  // Helper method to get customer accounts
  getCustomerAccounts(): Observable<Account[]> {
    return this.apiService.get('users/accounts/customer');
  }

  // Helper method to calculate charges (not in API spec but used by UI)
  calculateCharges(amount: number): Observable<NEFTCharges> {
    return this.apiService.post('eft/calculate-charges', { amount });
  }

  // API 8: POST /api/eft/transfer/initiate
  initiateTransfer(transferRequest: TransferRequest): Observable<TransferResponse> {
    return this.apiService.post('eft/transfer/initiate', transferRequest);
  }

  // API 9: GET /api/eft/neft/status/{reference}
  getTransferStatus(reference: string): Observable<TransactionStatusResponse> {
    return this.apiService.get(`eft/neft/status/${reference}`);
  }

  // API 10: GET /api/eft/neft/history/{accountNumber}
  getTransferHistory(accountNumber: string): Observable<NEFTHistoryResponse> {
    return this.apiService.get(`eft/neft/history/${accountNumber}`);
  }

  // ============= Admin APIs (Phase 1 - Already Implemented in Backend) =============

  // 1. Dashboard API - GET /api/admin/eft/dashboard
  // Authorization: TRANSACTION_READ
  getDashboardStats(): Observable<AdminDashboardResponse> {
    return this.apiService.get('admin/eft/dashboard');
  }

  // 2. Get All Batches - GET /api/admin/eft/batches
  // Authorization: TRANSACTION_READ
  getBatches(): Observable<BatchesResponse> {
    return this.apiService.get('admin/eft/batches');
  }

  // 3. Get Batch Details - GET /api/admin/eft/batches/{batchId}
  // Authorization: TRANSACTION_READ
  getBatchById(batchId: string): Observable<BatchDetailsResponse> {
    return this.apiService.get(`admin/eft/batches/${batchId}`);
  }

  // 4. Get Pending Transactions - GET /api/admin/eft/pending
  // Authorization: TRANSACTION_READ
  getPendingTransactions(): Observable<PendingTransactionsResponse> {
    return this.apiService.get('admin/eft/pending');
  }

  // 5. Get All Transactions - GET /api/admin/eft/transactions?status={status}
  // Authorization: TRANSACTION_READ
  getAllTransactions(status?: string): Observable<TransactionsResponse> {
    const queryParams = status ? `?status=${status}` : '';
    return this.apiService.get(`admin/eft/transactions${queryParams}`);
  }

  // 6. Get Transaction by Reference - GET /api/admin/eft/transactions/{reference}
  // Authorization: TRANSACTION_READ
  getTransactionByReference(reference: string): Observable<TransactionDetailsResponse> {
    return this.apiService.get(`admin/eft/transactions/${reference}`);
  }

  // 7. Get All Beneficiaries - GET /api/admin/eft/beneficiaries
  // Authorization: ACCOUNT_READ
  getAllBeneficiaries(): Observable<AdminBeneficiariesResponse> {
    return this.apiService.get('admin/eft/beneficiaries');
  }

  // 8. Get Statistics - GET /api/admin/eft/statistics
  // Authorization: TRANSACTION_READ
  getStatistics(): Observable<StatisticsResponse> {
    return this.apiService.get('admin/eft/statistics');
  }

  // 9. Process Batch Manually - POST /api/admin/eft/process-batch
  // Authorization: TRANSACTION_WRITE
  processBatch(): Observable<BatchProcessResponse> {
    return this.apiService.post('admin/eft/process-batch', {});
  }

  // ============= Beneficiary Approval APIs =============

  // Approval API 1: Get Pending Beneficiaries - GET /api/admin/eft/beneficiaries/pending
  // Authorization: ACCOUNT_READ
  getPendingBeneficiaries(): Observable<PendingBeneficiariesResponse> {
    return this.apiService.get('admin/eft/beneficiaries/pending');
  }

  // Approval API 2: Approve Beneficiary - POST /api/admin/eft/beneficiaries/{id}/approve
  // Authorization: ACCOUNT_WRITE
  approveBeneficiary(id: number): Observable<ApproveBeneficiaryResponse> {
    return this.apiService.post(`admin/eft/beneficiaries/${id}/approve`, {});
  }

  // Approval API 3: Reject Beneficiary - POST /api/admin/eft/beneficiaries/{id}/reject
  // Authorization: ACCOUNT_WRITE
  rejectBeneficiary(id: number, request?: BeneficiaryActionRequest): Observable<BeneficiaryActionResponse> {
    return this.apiService.post(`admin/eft/beneficiaries/${id}/reject`, request || {});
  }

  // Approval API 4: Block Beneficiary - POST /api/admin/eft/beneficiaries/{id}/block
  // Authorization: ACCOUNT_WRITE
  blockBeneficiary(id: number, request?: BeneficiaryActionRequest): Observable<BeneficiaryActionResponse> {
    return this.apiService.post(`admin/eft/beneficiaries/${id}/block`, request || {});
  }
}

