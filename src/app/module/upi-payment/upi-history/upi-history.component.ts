import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UPIPaymentService } from '../services/upi-payment.service';
import { UPITransaction } from '../models/upi-payment.models';

@Component({
  selector: 'app-upi-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upi-history.component.html',
  styleUrls: ['./upi-history.component.css']
})
export class UPIHistoryComponent implements OnInit {
  private upiService = inject(UPIPaymentService);

  // Data
  accounts = signal<any[]>([]);
  selectedAccountNumber = signal('');
  transactions = signal<UPITransaction[]>([]);

  // Filters
  searchTerm = signal('');
  statusFilter = signal('all');
  dateFilter = signal('all');

  // UI state
  loading = signal(false);
  error = signal<string | null>(null);
  expandedTransactionId = signal<number | null>(null);

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.upiService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        if (accounts.length > 0) {
          this.selectedAccountNumber.set(accounts[0].accountNumber);
          this.loadTransactions();
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

  loadTransactions() {
    if (!this.selectedAccountNumber()) return;

    this.loading.set(true);
    this.error.set(null);

    this.upiService.getUPITransactionHistory(this.selectedAccountNumber()).subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.error.set('Failed to load transaction history');
        this.loading.set(false);
      }
    });
  }

  onAccountChange() {
    this.loadTransactions();
  }

  getFilteredTransactions() {
    let filtered = this.transactions();

    // Status filter
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(t => t.status === this.statusFilter().toUpperCase());
    }

    // Search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(t => 
        t.transactionReference?.toLowerCase().includes(term) ||
        t.receiverName?.toLowerCase().includes(term) ||
        t.payerAccountNumber?.toLowerCase().includes(term)
      );
    }

    // Date filter
    if (this.dateFilter() !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (this.dateFilter()) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(t => new Date(t.initiatedAt) >= filterDate);
    }

    return filtered;
  }

  toggleTransaction(id: number) {
    this.expandedTransactionId.set(this.expandedTransactionId() === id ? null : id);
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'SETTLED': return 'status-success';
      case 'INITIATED': return 'status-warning';
      case 'FAILED': return 'status-danger';
      default: return 'status-default';
    }
  }

  exportToCSV() {
    alert('CSV export feature coming soon!');
  }
}

