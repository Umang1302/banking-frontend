import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TransactionService, TransferRequest, TransferResponse, RecipientValidationResponse } from '../transaction.service';
import { selectUser } from '../../../store/userStore/user.selectors';
import { Account, userActions } from '../../../store/userStore/user.action';

type ViewState = 'form' | 'confirmation' | 'receipt';

interface TransferFormData {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number | null;
  description: string;
  notes: string;
}

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-transaction.html',
  styleUrls: ['./create-transaction.css']
})
export class CreateTransactionComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private store = inject(Store);
  private router = inject(Router);
  
  // View state management
  currentView: ViewState = 'form';
  
  // Form data
  formData: TransferFormData = {
    fromAccountNumber: '',
    toAccountNumber: '',
    amount: null,
    description: '',
    notes: ''
  };

  // User accounts from store
  userAccounts: Account[] = [];
  selectedAccount: Account | null = null;

  // Recipient validation
  recipientDetails: RecipientValidationResponse | null = null;
  validating = false;

  // Loading and messages
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Transfer result
  transferResult: TransferResponse | null = null;

  ngOnInit(): void {
    // Subscribe to user accounts from store
    this.store.select(selectUser).subscribe(user => {
      if (user?.accounts) {
        this.userAccounts = user.accounts as Account[];
      }
    });
  }

  // Handle account selection
  onAccountSelect(): void {
    this.selectedAccount = this.userAccounts.find(
      acc => acc.accountNumber === this.formData.fromAccountNumber
    ) || null;
    this.error = null;
  }

  // Validate recipient account on blur
  onRecipientAccountBlur(): void {
    const accountNumber = this.formData.toAccountNumber.trim();
    
    if (!accountNumber) {
      this.recipientDetails = null;
      return;
    }

    // Check if user is trying to send to their own account
    if (accountNumber === this.formData.fromAccountNumber) {
      this.error = 'Cannot transfer to the same account';
      this.recipientDetails = null;
      return;
    }

    this.validateRecipientAccount(accountNumber);
  }

  // Validate recipient account via API
  validateRecipientAccount(accountNumber: string): void {
    this.validating = true;
    this.error = null;

    this.transactionService.validateRecipientAccount(accountNumber).subscribe({
      next: (data) => {
        this.validating = false;
        this.recipientDetails = data;
      },
      error: (err) => {
        this.validating = false;
        this.error = err.error?.message || 'Invalid account number';
        this.recipientDetails = null;
      }
    });
  }

  // Validate form before submission
  validateForm(): boolean {
    if (!this.formData.fromAccountNumber) {
      this.error = 'Please select a source account';
      return false;
    }

    if (!this.formData.toAccountNumber) {
      this.error = 'Please enter recipient account number';
      return false;
    }

    if (!this.recipientDetails) {
      this.error = 'Please validate the recipient account first';
      return false;
    }

    if (!this.formData.amount || this.formData.amount <= 0) {
      this.error = 'Please enter a valid amount greater than 0';
      return false;
    }

    if (this.selectedAccount && this.formData.amount > parseFloat(this.selectedAccount.availableBalance)) {
      this.error = `Insufficient balance. Available: ${this.selectedAccount.currency} ${this.formatAmount(parseFloat(this.selectedAccount.availableBalance))}`;
      return false;
    }

    if (!this.formData.description.trim()) {
      this.error = 'Please enter a description';
      return false;
    }

    return true;
  }

  // Handle form submission - show confirmation
  handleSubmit(): void {
    if (!this.validateForm()) {
      return;
    }
    this.error = null;
    this.currentView = 'confirmation';
  }

  // Confirm and execute transfer
  confirmTransfer(): void {
    this.loading = true;
    this.error = null;

    const transferRequest: TransferRequest = {
      fromAccountNumber: this.formData.fromAccountNumber,
      toAccountNumber: this.formData.toAccountNumber,
      amount: this.formData.amount!,
      description: this.formData.description,
      notes: this.formData.notes || undefined
    };

    this.transactionService.sendMoneyTransfer(transferRequest).subscribe({
      next: (result) => {
        this.loading = false;
        this.transferResult = result;
        this.success = 'Transfer completed successfully!';
        this.currentView = 'receipt';
        
        // Reload user profile to update balances immediately
        this.store.dispatch(userActions.loadProfile());
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Transfer failed. Please try again.';
        this.currentView = 'form';
      }
    });
  }

  // Cancel confirmation and go back to form
  cancelConfirmation(): void {
    this.currentView = 'form';
  }

  // Reset form and return to form view
  resetForm(): void {
    this.formData = {
      fromAccountNumber: '',
      toAccountNumber: '',
      amount: null,
      description: '',
      notes: ''
    };
    this.recipientDetails = null;
    this.selectedAccount = null;
    this.error = null;
    this.success = null;
    this.transferResult = null;
    this.currentView = 'form';
  }

  // Close receipt and redirect to dashboard
  closeReceipt(): void {
    // Reload user profile to get updated balances
    this.store.dispatch(userActions.loadProfile());
    
    // Navigate to dashboard with a delay to show success
    setTimeout(() => {
      this.router.navigate(['/dashboard/home']);
    }, 500);
  }

  // Get balance after transfer
  getBalanceAfterTransfer(): number {
    if (!this.selectedAccount || !this.formData.amount) return 0;
    return parseFloat(this.selectedAccount.availableBalance) - this.formData.amount;
  }

  // Format amount helper
  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  // Parse and format amount from string
  formatAmountFromString(amount: string): string {
    return parseFloat(amount).toFixed(2);
  }

  // Parse string to float
  parseFloat(value: string): number {
    return parseFloat(value);
  }

  // Format date helper
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
  }

  // Download receipt (print)
  downloadReceipt(): void {
    window.print();
  }

  // Share receipt
  shareReceipt(): void {
    if (navigator.share && this.transferResult) {
      navigator.share({
        title: 'Transfer Receipt',
        text: `Transfer of ${this.transferResult.currency} ${this.transferResult.amount} completed successfully. Reference: ${this.transferResult.transactionReference}`
      }).catch(err => console.log('Error sharing:', err));
    }
  }
}

