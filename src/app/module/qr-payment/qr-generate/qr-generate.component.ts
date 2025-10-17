import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRPaymentService } from '../services/qr-payment.service';
import { QRGenerateRequest, QRGenerateResponse } from '../models/qr-payment.models';

@Component({
  selector: 'app-qr-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-generate.component.html',
  styleUrls: ['./qr-generate.component.css']
})
export class QRGenerateComponent implements OnInit {
  private qrService = inject(QRPaymentService);
  private router = inject(Router);

  // Form data
  accounts = signal<any[]>([]);
  selectedAccountNumber = signal('');
  amount = signal<number>(0);
  description = signal('');
  currency = signal('INR');
  expiryHours = signal(24);

  // Generated QR data
  generatedQR = signal<QRGenerateResponse | null>(null);
  qrImageSrc = signal<string | null>(null);

  // UI state
  loading = signal(false);
  generating = signal(false);
  error = signal<string | null>(null);
  showQRCode = signal(false);
  amountError = signal<string | null>(null);

  quickAmounts = [100, 500, 1000, 2000, 5000];
  expiryOptions = [
    { value: 1, label: '1 Hour' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' },
    { value: 48, label: '2 Days' },
    { value: 72, label: '3 Days' }
  ];

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.qrService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        if (accounts.length > 0) {
          this.selectedAccountNumber.set(accounts[0].accountNumber);
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

  setQuickAmount(amount: number) {
    this.amount.set(amount);
    this.validateAmount();
  }

  validateAmount() {
    const amount = this.amount();
    
    if (!amount || amount === 0) {
      this.amountError.set(null); // Don't show error for empty field
      return;
    }

    if (amount < 1) {
      this.amountError.set('Amount must be at least ₹1');
      return;
    }

    if (amount > 100000) {
      this.amountError.set('Amount cannot exceed ₹1,00,000');
      return;
    }

    // Clear error if validation passes
    this.amountError.set(null);
  }

  generateQRCode() {
    // Validation
    if (!this.selectedAccountNumber()) {
      this.error.set('Please select an account');
      return;
    }

    if (!this.amount() || this.amount() <= 0) {
      this.error.set('Please enter a valid amount');
      return;
    }

    if (this.amount() > 100000) {
      this.error.set('Amount cannot exceed ₹1,00,000');
      return;
    }

    this.generating.set(true);
    this.error.set(null);

    const request: QRGenerateRequest = {
      accountNumber: this.selectedAccountNumber(),
      amount: this.amount(),
      description: this.description() || undefined,
      currency: this.currency(),
      expiryHours: this.expiryHours()
    };

    this.qrService.generateQRCode(request).subscribe({
      next: (response) => {
        this.generatedQR.set(response);
        this.qrImageSrc.set(`data:image/png;base64,${response.qrCodeData}`);
        this.showQRCode.set(true);
        this.generating.set(false);
      },
      error: (err) => {
        console.error('Error generating QR code:', err);
        this.error.set(err.error?.message || 'Failed to generate QR code');
        this.generating.set(false);
      }
    });
  }

  downloadQRCode() {
    const qr = this.generatedQR();
    if (qr) {
      this.qrService.downloadQRCode(qr.qrCodeData, qr.requestId);
    }
  }

  copyRequestId() {
    const qr = this.generatedQR();
    if (qr?.requestId) {
      navigator.clipboard.writeText(qr.requestId).then(() => {
        alert('Request ID copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }

  shareQRCode() {
    const qr = this.generatedQR();
    if (qr && navigator.share) {
      // Share QR code image
      const qrImageSrc = this.qrImageSrc();
      if (qrImageSrc) {
        // Convert base64 to blob for sharing
        fetch(qrImageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `QR_${qr.requestId}.png`, { type: 'image/png' });
            navigator.share({
              title: 'Payment QR Code',
              text: `Request ID: ${qr.requestId}\nAmount: ₹${qr.amount}\nScan to pay`,
              files: [file]
            }).catch(err => {
              console.error('Error sharing:', err);
              this.copyRequestId();
            });
          })
          .catch(err => {
            console.error('Error converting image:', err);
            this.copyRequestId();
          });
      }
    } else {
      this.copyRequestId();
    }
  }

  generateAnother() {
    this.showQRCode.set(false);
    this.generatedQR.set(null);
    this.qrImageSrc.set(null);
    this.amount.set(0);
    this.description.set('');
  }

  viewMyRequests() {
    this.router.navigate(['/dashboard/qr-payment/history'], { 
      state: { viewMode: 'requests' } 
    });
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
    return this.accounts().find(acc => acc.accountNumber === this.selectedAccountNumber());
  }
}

