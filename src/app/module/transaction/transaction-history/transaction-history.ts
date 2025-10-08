import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction, TransactionHistory } from '../transaction.service';
import { UserService } from '../../../store/userStore/user.service';
import { Account } from '../../../store/userStore/user.action';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-history.html',
  styleUrls: ['./transaction-history.css']
})
export class TransactionHistoryComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private userService = inject(UserService);
  
  transactions: Transaction[] = [];
  transactionCount = 0;
  startDate: string = '';
  endDate: string = '';
  loading = false;
  error: string | null = null;
  accountNumber: string = '';
  selectedTransaction: Transaction | null = null;
  userAccounts: Account[] = [];

  ngOnInit(): void {
    this.userService.user$.subscribe(user => {
      if (user && user.accounts && user.accounts.length > 0) {
        this.userAccounts = user.accounts;
        // Get the first active account or just the first account
        const activeAccount = user.accounts.find(acc => acc.status === 'ACTIVE') || user.accounts[0];
        this.accountNumber = activeAccount.accountNumber;
        this.loadTransactions();
      }
    });
  }

  onAccountChange(): void {
    // Reload transactions when account changes
    this.loadTransactions();
  }

  getAccountTypeDisplay(accountType: string): string {
    const displays: { [key: string]: string } = {
      'SAVINGS': 'Savings Account',
      'CURRENT': 'Current Account',
      'CREDIT': 'Credit Card',
      'LOAN': 'Loan Account'
    };
    return displays[accountType] || accountType;
  }

  loadTransactions(): void {
    if (!this.accountNumber) {
      this.error = 'No account number available';
      return;
    }

    this.loading = true;
    this.error = null;

    this.transactionService.getTransactionHistory(
      this.accountNumber,
      this.startDate || undefined,
      this.endDate || undefined
    ).subscribe({
      next: (data: TransactionHistory) => {
        this.transactions = data.transactions;
        this.transactionCount = data.count;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadTransactions();
  }

  viewDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
  }

  closeModal(): void {
    this.selectedTransaction = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAmount(amount: number): string {
    return parseFloat(amount.toString()).toFixed(2);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }
}

