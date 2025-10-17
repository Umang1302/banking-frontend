import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRPaymentService } from '../services/qr-payment.service';
import { QRParseResponse, QRPaymentResponse } from '../models/qr-payment.models';
import { PaymentModalComponent } from '../../../component/payment-modal/payment-modal.component';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentModalComponent],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css']
})
export class QRScannerComponent implements OnInit {
  private qrService = inject(QRPaymentService);
  private router = inject(Router);

  // Form data
  accounts = signal<any[]>([]);
  selectedPayerAccount = signal('');
  
  // QR Code data
  uploadedQRFile = signal<File | null>(null);
  qrImagePreview = signal<string | null>(null);
  parsedQRData = signal<QRParseResponse | null>(null);

  // Payment flow
  currentStep = signal<'upload' | 'review' | 'processing' | 'complete'>('upload');
  paymentResponse = signal<QRPaymentResponse | null>(null);

  // UI state
  loading = signal(false);
  parsing = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);

  // Payment modal
  showPaymentModal = signal(false);
  paymentSuccess = signal(false);
  paymentMessage = signal('');

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.qrService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        if (accounts.length > 0) {
          this.selectedPayerAccount.set(accounts[0].accountNumber);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
        this.error.set('Failed to load accounts');
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error.set('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('File size should not exceed 5MB');
        return;
      }

      this.uploadedQRFile.set(file);
      this.error.set(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.qrImagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async parseQRCode() {
    const file = this.uploadedQRFile();
    if (!file) {
      this.error.set('Please upload a QR code image');
      return;
    }

    this.parsing.set(true);
    this.error.set(null);

    try {
      // Convert file to base64
      const base64Data = await this.qrService.fileToBase64(file);

      // Parse QR code
      this.qrService.parseQRCode({ qrCodeData: base64Data }).subscribe({
        next: (response) => {
          if (response.valid) {
            this.parsedQRData.set(response);
            this.currentStep.set('review');
          } else {
            this.error.set(response.message || 'Invalid QR code');
          }
          this.parsing.set(false);
        },
        error: (err) => {
          console.error('Error parsing QR code:', err);
          this.error.set(err.error?.message || 'Failed to parse QR code');
          this.parsing.set(false);
        }
      });
    } catch (err) {
      console.error('Error converting file:', err);
      this.error.set('Failed to read QR code image');
      this.parsing.set(false);
    }
  }

  initiatePayment() {
    const parsedData = this.parsedQRData();
    if (!parsedData || !parsedData.requestId) {
      this.error.set('Invalid payment data');
      return;
    }

    if (!this.selectedPayerAccount()) {
      this.error.set('Please select a payer account');
      return;
    }

    // Check if payer is trying to pay themselves
    if (this.selectedPayerAccount() === parsedData.receiverAccountNumber) {
      this.error.set('Cannot pay to the same account');
      return;
    }

    // Check if QR has expired
    if (parsedData.expired) {
      this.error.set('QR code has expired. Please request a new one.');
      return;
    }

    // Check sufficient balance
    const selectedAccount = this.getSelectedAccount();
    if (selectedAccount && parsedData.amount && selectedAccount.balance < parsedData.amount) {
      this.error.set(`Insufficient balance. Available: ₹${selectedAccount.balance.toFixed(2)}, Required: ₹${parsedData.amount.toFixed(2)}`);
      return;
    }

    this.processing.set(true);
    this.error.set(null);
    this.currentStep.set('processing');

    // Process internal bank transfer
    this.qrService.processPayment({
      requestId: parsedData.requestId,
      payerAccountNumber: this.selectedPayerAccount()
    }).subscribe({
      next: (response) => {
        this.paymentResponse.set(response);
        this.paymentSuccess.set(response.success);
        this.paymentMessage.set(response.message);
        this.showPaymentModal.set(true);
        this.processing.set(false);
        
        if (response.success) {
          this.currentStep.set('complete');
        } else {
          this.currentStep.set('review');
        }
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.paymentSuccess.set(false);
        this.paymentMessage.set(err.error?.message || 'Payment processing failed');
        this.showPaymentModal.set(true);
        this.processing.set(false);
        this.currentStep.set('review');
      }
    });
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    if (this.paymentSuccess()) {
      this.resetForm();
    }
  }

  downloadReceipt() {
    // TODO: Implement receipt generation
    alert('Receipt download feature coming soon!');
  }

  viewTransaction() {
    this.router.navigate(['/dashboard/qr-payment/history']);
  }

  resetForm() {
    this.uploadedQRFile.set(null);
    this.qrImagePreview.set(null);
    this.parsedQRData.set(null);
    this.paymentResponse.set(null);
    this.currentStep.set('upload');
    this.error.set(null);
  }

  goBack() {
    if (this.currentStep() === 'review') {
      this.currentStep.set('upload');
      this.parsedQRData.set(null);
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  getSelectedAccount() {
    return this.accounts().find(acc => acc.accountNumber === this.selectedPayerAccount());
  }

  isQRExpired(): boolean {
    const parsedData = this.parsedQRData();
    return parsedData?.expired || false;
  }
}

