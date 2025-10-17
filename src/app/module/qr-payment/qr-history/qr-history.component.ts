import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRPaymentService } from '../services/qr-payment.service';
import { QRTransaction, QRRequest } from '../models/qr-payment.models';

@Component({
  selector: 'app-qr-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-history.component.html',
  styleUrls: ['./qr-history.component.css']
})
export class QRHistoryComponent implements OnInit {
  private qrService = inject(QRPaymentService);
  private router = inject(Router);

  // Data
  accounts = signal<any[]>([]);
  selectedAccountNumber = signal('');
  transactions = signal<QRTransaction[]>([]);
  myRequests = signal<QRRequest[]>([]);
  
  // View mode
  viewMode = signal<'transactions' | 'requests'>('transactions');

  // Filters
  searchTerm = signal('');
  statusFilter = signal('all');
  dateFilter = signal('all');

  // UI state
  loading = signal(false);
  error = signal<string | null>(null);

  // Expanded transaction
  expandedTransactionId = signal<number | null>(null);

  ngOnInit() {
    // Check navigation state for view mode
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state?.['viewMode']) {
      this.viewMode.set(state['viewMode']);
      if (state['viewMode'] === 'requests') {
        this.loadMyRequests();
        return;
      }
    }
    
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.qrService.getCustomerAccounts().subscribe({
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

    this.qrService.getQRTransactionHistory(this.selectedAccountNumber()).subscribe({
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

  loadMyRequests() {
    this.loading.set(true);
    this.error.set(null);

    this.qrService.getMyQRRequests().subscribe({
      next: (requests) => {
        this.myRequests.set(requests);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.error.set('Failed to load QR requests');
        this.loading.set(false);
      }
    });
  }

  onAccountChange() {
    if (this.viewMode() === 'transactions') {
      this.loadTransactions();
    }
  }

  switchView(mode: 'transactions' | 'requests') {
    this.viewMode.set(mode);
    if (mode === 'requests') {
      this.loadMyRequests();
    } else {
      this.loadTransactions();
    }
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

  getFilteredRequests() {
    let filtered = this.myRequests();

    // Status filter
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter().toUpperCase());
    }

    // Search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(r => 
        r.requestId?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  toggleTransaction(id: number) {
    if (this.expandedTransactionId() === id) {
      this.expandedTransactionId.set(null);
    } else {
      this.expandedTransactionId.set(id);
    }
  }

  downloadQRCode(request: QRRequest) {
    this.qrService.downloadQRCode(request.qrCodeData, request.requestId);
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
      case 'SETTLED':
      case 'PAID':
      case 'COMPLETED':
        return 'status-success';
      case 'INITIATED':
      case 'CREATED':
      case 'PENDING':
        return 'status-warning';
      case 'FAILED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'status-danger';
      default:
        return 'status-default';
    }
  }

  exportToCSV() {
    const data = this.viewMode() === 'transactions' 
      ? this.getFilteredTransactions()
      : this.getFilteredRequests();

    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // TODO: Implement CSV export
    alert('CSV export feature coming soon!');
  }
}

