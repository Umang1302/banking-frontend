import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UPIPaymentService } from '../services/upi-payment.service';
import { UPIPaymentRequest, UPIPaymentInitiateResponse } from '../models/upi-payment.models';
import { PaymentModalComponent } from '../../../component/payment-modal/payment-modal.component';

@Component({
  selector: 'app-upi-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentModalComponent],
  templateUrl: './upi-payment.component.html',
  styleUrls: ['./upi-payment.component.css']
})
export class UPIPaymentComponent implements OnInit {
  private upiService = inject(UPIPaymentService);
  private router = inject(Router);

  // Form data
  accounts = signal<any[]>([]);
  receiverUpiId = signal('');
  selectedPayerAccount = signal('');
  amount = signal<number>(0);
  description = signal('');
  
  // Validation
  upiValid = signal<boolean | null>(null);
  validating = signal(false);
  
  // Payment response
  paymentResponse = signal<UPIPaymentInitiateResponse | null>(null);
  
  // UI state
  loading = signal(false);
  processing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Payment modal
  showPaymentModal = signal(false);
  paymentSuccess = signal(false);
  paymentMessage = signal('');

  quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.upiService.getCustomerAccounts().subscribe({
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

  validateUPI() {
    const upiId = this.receiverUpiId();
    
    if (!upiId) {
      this.upiValid.set(null);
      return;
    }

    // Client-side format validation
    if (!this.upiService.isValidUPIFormat(upiId)) {
      this.upiValid.set(false);
      return;
    }

    // Server-side validation
    this.validating.set(true);
    this.upiService.validateUPI(upiId).subscribe({
      next: (response) => {
        this.upiValid.set(response.valid);
        this.validating.set(false);
      },
      error: (err) => {
        console.error('Error validating UPI:', err);
        this.upiValid.set(false);
        this.validating.set(false);
      }
    });
  }

  setQuickAmount(amount: number) {
    this.amount.set(amount);
  }

  initiatePayment() {
    // Validation
    if (!this.receiverUpiId()) {
      this.error.set('Please enter receiver UPI ID');
      return;
    }

    // Validate UPI format
    if (this.upiValid() === false) {
      this.error.set('Please enter a valid UPI ID');
      return;
    }

    if (!this.selectedPayerAccount()) {
      this.error.set('Please select payer account');
      return;
    }

    if (!this.amount() || this.amount() <= 0) {
      this.error.set('Please enter valid amount');
      return;
    }

    if (this.amount() > 100000) {
      this.error.set('Amount cannot exceed ₹1,00,000');
      return;
    }

    // Check sufficient balance
    const selectedAccount = this.getSelectedAccount();
    if (selectedAccount && selectedAccount.balance < this.amount()) {
      this.error.set(`Insufficient balance. Available: ₹${selectedAccount.balance.toFixed(2)}, Required: ₹${this.amount().toFixed(2)}`);
      return;
    }

    console.log('Initiating UPI payment...', {
      receiverUpiId: this.receiverUpiId(),
      amount: this.amount(),
      payerAccount: this.selectedPayerAccount()
    });

    this.processing.set(true);
    this.error.set(null);
    this.success.set(null);

    const request: UPIPaymentRequest = {
      receiverUpiId: this.receiverUpiId(),
      payerAccountNumber: this.selectedPayerAccount(),
      amount: this.amount(),
      description: this.description() || undefined,
      currency: 'INR'
    };

    // Process payment with backend
    this.upiService.initiatePayment(request).subscribe({
      next: (response) => {
        console.log('Payment response:', response);
        
        // Store the response
        this.paymentResponse.set(response);
        this.paymentSuccess.set(response.success);
        this.paymentMessage.set(response.message);
        
        // Show payment modal
        this.showPaymentModal.set(true);
        this.processing.set(false);
        
        // Reload accounts to reflect updated balance
        if (response.success) {
          this.loadAccounts();
        }
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        console.error('Error details:', err.error);
        
        this.paymentSuccess.set(false);
        this.paymentMessage.set(err.error?.message || err.message || 'Failed to process payment. Please try again.');
        this.showPaymentModal.set(true);
        this.processing.set(false);
      }
    });
  }


  closePaymentModal() {
    this.showPaymentModal.set(false);
    if (this.paymentSuccess()) {
      const response = this.paymentResponse();
      if (response) {
        this.success.set(`Payment successful! Transaction reference: ${response.transactionReference}`);
      }
      this.resetForm();
    }
  }

  downloadReceipt() {
    alert('Receipt download feature coming soon!');
  }

  viewTransaction() {
    this.router.navigate(['/dashboard/upi-payment/history']);
  }

  resetForm() {
    this.receiverUpiId.set('');
    this.amount.set(0);
    this.description.set('');
    this.upiValid.set(null);
    this.error.set(null);
    this.success.set(null);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  getSelectedAccount() {
    return this.accounts().find(acc => acc.accountNumber === this.selectedPayerAccount());
  }
}

