import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  QRGenerateRequest,
  QRGenerateResponse,
  QRParseRequest,
  QRParseResponse,
  QRPaymentRequest,
  QRPaymentResponse,
  QRRequest,
  QRTransaction
} from '../models/qr-payment.models';

@Injectable({
  providedIn: 'root'
})
export class QRPaymentService {
  private apiService = inject(ApiService);

  /**
   * Generate QR Code for receiving payment
   * API: POST /api/qr/generate
   */
  generateQRCode(request: QRGenerateRequest): Observable<QRGenerateResponse> {
    return this.apiService.post('qr/generate', request);
  }

  /**
   * Parse QR Code from uploaded/scanned image
   * API: POST /api/qr/parse
   */
  parseQRCode(request: QRParseRequest): Observable<QRParseResponse> {
    return this.apiService.post('qr/parse', request);
  }

  /**
   * Process QR payment (internal bank transfer)
   * API: POST /api/qr/pay
   */
  processPayment(request: QRPaymentRequest): Observable<QRPaymentResponse> {
    return this.apiService.post('qr/pay', request);
  }

  /**
   * Get all QR requests created by the user
   * API: GET /api/qr/my-requests
   */
  getMyQRRequests(): Observable<QRRequest[]> {
    return this.apiService.get('qr/my-requests');
  }

  /**
   * Get QR transaction history for an account
   * API: GET /api/qr/transactions/{accountNumber}
   */
  getQRTransactionHistory(accountNumber: string): Observable<QRTransaction[]> {
    return this.apiService.get(`qr/transactions/${accountNumber}`);
  }

  /**
   * Helper method to convert base64 to downloadable image
   */
  downloadQRCode(base64Data: string, requestId: string): void {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = `QR_Payment_${requestId}.png`;
    link.click();
  }

  /**
   * Helper method to convert file to base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get customer accounts
   */
  getCustomerAccounts(): Observable<any[]> {
    return this.apiService.get('users/accounts/customer');
  }
}

