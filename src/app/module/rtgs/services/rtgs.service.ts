import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  RTGSTransferRequest,
  RTGSTransferResponse,
  RTGSStatusResponse,
  RTGSHistoryResponse,
  BeneficiariesResponse,
  IFSCValidationResponse,
  RTGSDashboardResponse,
  RTGSTransactionsResponse,
  RTGSStatisticsResponse,
  EFTOverviewResponse,
  RTGSTransactionDetailsResponse,
  Account,
  RTGSCharges,
  RTGS_CONSTANTS
} from '../models/rtgs.models';

@Injectable({
  providedIn: 'root'
})
export class RtgsService {
  private apiService = inject(ApiService);

  // ============= Customer APIs =============

  // Helper method to get customer accounts
  getCustomerAccounts(): Observable<Account[]> {
    return this.apiService.get('users/accounts/customer');
  }

  // API: POST /api/eft/rtgs/transfer
  initiateRTGSTransfer(transferRequest: RTGSTransferRequest): Observable<RTGSTransferResponse> {
    return this.apiService.post('eft/rtgs/transfer', transferRequest);
  }

  // API: GET /api/eft/rtgs/status/{reference}
  getRTGSStatus(reference: string): Observable<RTGSStatusResponse> {
    return this.apiService.get(`eft/rtgs/status/${reference}`);
  }

  // API: GET /api/eft/rtgs/history/{accountNumber}
  getRTGSHistory(accountNumber: string): Observable<RTGSHistoryResponse> {
    return this.apiService.get(`eft/rtgs/history/${accountNumber}`);
  }

  // API: GET /api/eft/beneficiaries/active
  getActiveBeneficiaries(): Observable<BeneficiariesResponse> {
    return this.apiService.get('eft/beneficiaries/active');
  }

  // API: GET /api/eft/validate-ifsc/{ifscCode}
  validateIFSC(ifscCode: string): Observable<IFSCValidationResponse> {
    return this.apiService.get(`eft/validate-ifsc/${ifscCode}`);
  }

  // Helper method to calculate RTGS charges locally
  calculateRTGSCharges(amount: number): RTGSCharges {
    let charges = 0;
    
    if (amount < RTGS_CONSTANTS.MIN_AMOUNT) {
      charges = 0; // No charges, will show validation error
    } else if (amount <= 500000) {
      charges = RTGS_CONSTANTS.CHARGES.LOW; // ₹30 for 2L-5L
    } else {
      charges = RTGS_CONSTANTS.CHARGES.HIGH; // ₹55 for >5L
    }
    
    return {
      amount: amount,
      charges: charges,
      total: amount + charges
    };
  }

  // Helper method to check if RTGS is available (operating hours)
  isRTGSAvailable(): { available: boolean; message?: string } {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours() + now.getMinutes() / 60;

    // Check if weekend (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) {
      return {
        available: false,
        message: 'RTGS is not available on weekends. Operating hours: Monday to Friday, 9:00 AM to 4:30 PM'
      };
    }

    // Check if outside operating hours
    if (hours < RTGS_CONSTANTS.OPERATING_HOURS.START || hours >= RTGS_CONSTANTS.OPERATING_HOURS.END) {
      const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      return {
        available: false,
        message: `RTGS is not available at this time. Operating hours: 9:00 AM to 4:30 PM (Current time: ${currentTime})`
      };
    }

    return { available: true };
  }

  // ============= Admin APIs =============

  // API: GET /api/admin/eft/rtgs/dashboard
  getRTGSDashboard(): Observable<RTGSDashboardResponse> {
    return this.apiService.get('admin/eft/rtgs/dashboard');
  }

  // API: GET /api/admin/eft/rtgs/transactions?status={status}
  getRTGSTransactions(status?: string): Observable<RTGSTransactionsResponse> {
    const queryParams = status ? `?status=${status}` : '';
    return this.apiService.get(`admin/eft/rtgs/transactions${queryParams}`);
  }

  // API: GET /api/admin/eft/rtgs/statistics
  getRTGSStatistics(): Observable<RTGSStatisticsResponse> {
    return this.apiService.get('admin/eft/rtgs/statistics');
  }

  // API: GET /api/admin/eft/overview
  getEFTOverview(): Observable<EFTOverviewResponse> {
    return this.apiService.get('admin/eft/overview');
  }

  // API: GET /api/admin/eft/transactions/{reference}
  getRTGSTransactionByReference(reference: string): Observable<RTGSTransactionDetailsResponse> {
    return this.apiService.get(`admin/eft/transactions/${reference}`);
  }
}

