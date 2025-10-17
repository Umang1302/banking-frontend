import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  UPIRegisterRequest,
  UPIRegisterResponse,
  UPIAccount,
  UPIValidationResponse,
  UPIPaymentRequest,
  UPIPaymentInitiateResponse,
  UPIPaymentSettleRequest,
  UPIPaymentSettleResponse,
  UPITransaction,
  UPIDeleteResponse,
  UPISetPrimaryResponse
} from '../models/upi-payment.models';

@Injectable({
  providedIn: 'root'
})
export class UPIPaymentService {
  private apiService = inject(ApiService);

  /**
   * Register a new UPI ID
   * API: POST /api/upi/register
   */
  registerUPI(request: UPIRegisterRequest): Observable<UPIRegisterResponse> {
    return this.apiService.post('upi/register', request);
  }

  /**
   * Get all UPI accounts linked to the user
   * API: GET /api/upi/accounts
   */
  getUPIAccounts(): Observable<UPIAccount[]> {
    return this.apiService.get('upi/accounts');
  }

  /**
   * Validate UPI ID format and provider
   * API: GET /api/upi/validate/{upiId}
   */
  validateUPI(upiId: string): Observable<UPIValidationResponse> {
    return this.apiService.get(`upi/validate/${upiId}`);
  }

  /**
   * Initiate UPI payment
   * API: POST /api/upi/pay
   */
  initiatePayment(request: UPIPaymentRequest): Observable<UPIPaymentInitiateResponse> {
    return this.apiService.post('upi/pay', request);
  }

  /**
   * Settle UPI payment after Razorpay completion
   * API: POST /api/upi/settle
   */
  settlePayment(request: UPIPaymentSettleRequest): Observable<UPIPaymentSettleResponse> {
    return this.apiService.post('upi/settle', request);
  }

  /**
   * Get UPI transaction history for an account
   * API: GET /api/upi/transactions/{accountNumber}
   */
  getUPITransactionHistory(accountNumber: string): Observable<UPITransaction[]> {
    return this.apiService.get(`upi/transactions/${accountNumber}`);
  }

  /**
   * Deactivate a UPI ID
   * API: DELETE /api/upi/accounts/{upiId}
   */
  deactivateUPI(upiId: string): Observable<UPIDeleteResponse> {
    return this.apiService.delete(`upi/accounts/${upiId}`);
  }

  /**
   * Set a UPI ID as primary
   * API: PUT /api/upi/accounts/{upiId}/set-primary
   */
  setUPIAsPrimary(upiId: string): Observable<UPISetPrimaryResponse> {
    return this.apiService.put(`upi/accounts/${upiId}/set-primary`, {});
  }

  /**
   * Get customer accounts
   */
  getCustomerAccounts(): Observable<any[]> {
    return this.apiService.get('users/accounts/customer');
  }

  /**
   * Validate UPI ID format (client-side)
   */
  isValidUPIFormat(upiId: string): boolean {
    // UPI ID format: username@provider
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
    return upiRegex.test(upiId);
  }

  /**
   * Get UPI provider from UPI ID
   */
  getUPIProvider(upiId: string): string {
    const parts = upiId.split('@');
    if (parts.length === 2) {
      const provider = parts[1].toLowerCase();
      const providerMap: { [key: string]: string } = {
        'paytm': 'PAYTM',
        'ybl': 'PHONEPE',
        'okaxis': 'GOOGLEPAY',
        'okhdfcbank': 'GOOGLEPAY',
        'okicici': 'GOOGLEPAY',
        'oksbi': 'GOOGLEPAY',
        'gpay': 'GOOGLEPAY',
        'phonepe': 'PHONEPE',
        'bhim': 'BHIM'
      };
      return providerMap[provider] || 'OTHER';
    }
    return 'OTHER';
  }
}

