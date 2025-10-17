import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RtgsService } from '../../services/rtgs.service';
import { RTGSTransaction, Account } from '../../models/rtgs.models';

@Component({
  selector: 'app-rtgs-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rtgs-history.component.html',
  styleUrls: ['./rtgs-history.component.css']
})
export class RtgsHistoryComponent implements OnInit {
  private rtgsService = inject(RtgsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  transactions = signal<RTGSTransaction[]>([]);
  filteredTransactions = signal<RTGSTransaction[]>([]);
  accounts = signal<Account[]>([]);
  selectedAccountNumber = signal<string>('');
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filters
  searchTerm = signal('');
  statusFilter = signal('ALL');
  dateFilter = signal('ALL');
  
  // Modal
  showDetailsModal = signal(false);
  selectedTransaction = signal<RTGSTransaction | null>(null);
  
  highlightedReference = signal<string | null>(null);

  ngOnInit() {
    // Check for highlighted transaction
    this.route.queryParams.subscribe(params => {
      if (params['highlight']) {
        this.highlightedReference.set(params['highlight']);
      }
    });
    
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.rtgsService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        if (accounts.length > 0) {
          this.selectedAccountNumber.set(accounts[0].accountNumber);
          this.loadTransactionHistory();
        } else {
          this.error.set('No accounts found');
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
        this.error.set('Failed to load accounts');
        this.loading.set(false);
      }
    });
  }

  loadTransactionHistory() {
    const accountNumber = this.selectedAccountNumber();
    if (!accountNumber) {
      this.error.set('Please select an account');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    this.rtgsService.getRTGSHistory(accountNumber).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.transactions.set(response.transactions || []);
          this.applyFilters();
        } else {
          this.error.set('Failed to load RTGS transaction history');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transaction history:', err);
        this.error.set('Failed to load RTGS transaction history');
        this.loading.set(false);
      }
    });
  }

  onAccountChange(event: Event) {
    const accountNumber = (event.target as HTMLSelectElement).value;
    this.selectedAccountNumber.set(accountNumber);
    this.loadTransactionHistory();
  }

  applyFilters() {
    let filtered = [...this.transactions()];
    
    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(t =>
        t.beneficiaryName?.toLowerCase().includes(search) ||
        t.eftReference?.toLowerCase().includes(search) ||
        t.amount.toString().includes(search) ||
        t.beneficiaryBank?.toLowerCase().includes(search)
      );
    }
    
    // Status filter
    if (this.statusFilter() !== 'ALL') {
      filtered = filtered.filter(t => t.status === this.statusFilter());
    }
    
    // Date filter
    const now = new Date();
    if (this.dateFilter() !== 'ALL') {
      filtered = filtered.filter(t => {
        const dateString = t.initiatedAt;
        if (!dateString) return false;
        const transferDate = new Date(dateString);
        const diffDays = Math.floor((now.getTime() - transferDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (this.dateFilter()) {
          case 'TODAY':
            return diffDays === 0;
          case 'LAST_7':
            return diffDays <= 7;
          case 'LAST_30':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }
    
    this.filteredTransactions.set(filtered);
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onStatusFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.applyFilters();
  }

  onDateFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.dateFilter.set(value);
    this.applyFilters();
  }

  openDetailsModal(transaction: RTGSTransaction) {
    this.selectedTransaction.set(transaction);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedTransaction.set(null);
  }

  navigateToNewTransfer() {
    this.router.navigate(['/dashboard/rtgs/transfer']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-success';
      case 'PROCESSING': return 'status-info';
      case 'FAILED': return 'status-danger';
      default: return 'status-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'PROCESSING': return '⟳';
      case 'FAILED': return '✗';
      default: return '•';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PROCESSING': return 'Processing';
      case 'COMPLETED': return 'Completed';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'N/A';
    return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  downloadReceipt(reference: string) {
    console.log('Downloading receipt for:', reference);
    alert('Receipt download feature coming soon!');
  }

  isHighlighted(transaction: RTGSTransaction): boolean {
    return transaction.eftReference === this.highlightedReference();
  }

  getTransactionStats() {
    const txns = this.transactions();
    return {
      total: txns.length,
      completed: txns.filter(t => t.status === 'COMPLETED').length,
      processing: txns.filter(t => t.status === 'PROCESSING').length,
      failed: txns.filter(t => t.status === 'FAILED').length,
      totalAmount: txns.reduce((sum, t) => sum + t.amount, 0),
      totalCharges: txns.reduce((sum, t) => sum + t.charges, 0)
    };
  }
}

