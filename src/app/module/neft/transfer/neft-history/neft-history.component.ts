import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { NEFTTransfer, Account } from '../../models/neft.models';

@Component({
  selector: 'app-neft-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './neft-history.component.html',
  styleUrls: ['./neft-history.component.css']
})
export class NeftHistoryComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  transfers = signal<NEFTTransfer[]>([]);
  filteredTransfers = signal<NEFTTransfer[]>([]);
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
  selectedTransfer = signal<NEFTTransfer | null>(null);
  activeTab = signal('overview');
  
  highlightedReference = signal<string | null>(null);

  ngOnInit() {
    // Check for highlighted transaction
    this.route.queryParams.subscribe(params => {
      if (params['highlight']) {
        this.highlightedReference.set(params['highlight']);
      }
    });
    
    // Load accounts first, then load history for first account
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading.set(true);
    this.neftService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        if (accounts.length > 0) {
          this.selectedAccountNumber.set(accounts[0].accountNumber);
          this.loadTransferHistory();
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

  loadTransferHistory() {
    const accountNumber = this.selectedAccountNumber();
    if (!accountNumber) {
      this.error.set('Please select an account');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    this.neftService.getTransferHistory(accountNumber).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.transfers.set(response.transactions || []);
          this.applyFilters();
        } else {
          this.error.set('Failed to load transfer history');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transfer history:', err);
        this.error.set('Failed to load transfer history');
        this.loading.set(false);
      }
    });
  }

  onAccountChange(event: Event) {
    const accountNumber = (event.target as HTMLSelectElement).value;
    this.selectedAccountNumber.set(accountNumber);
    this.loadTransferHistory();
  }

  applyFilters() {
    let filtered = [...this.transfers()];
    
    // Search filter - API 10: NEFTTransfer fields
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(t =>
        t.beneficiaryName?.toLowerCase().includes(search) ||
        t.eftReference?.toLowerCase().includes(search) ||
        t.amount.toString().includes(search)
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
    
    this.filteredTransfers.set(filtered);
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

  openDetailsModal(transfer: NEFTTransfer) {
    this.selectedTransfer.set(transfer);
    this.showDetailsModal.set(true);
    this.activeTab.set('overview');
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedTransfer.set(null);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  navigateToNewTransfer() {
    this.router.navigate(['/dashboard/neft/transfer']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-success';
      case 'PENDING':
      case 'QUEUED': return 'status-warning';
      case 'PROCESSING': return 'status-info';
      case 'FAILED': return 'status-danger';
      case 'CANCELLED': return 'status-secondary';
      default: return 'status-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'PENDING':
      case 'QUEUED': return '⏱';
      case 'PROCESSING': return '⟳';
      case 'FAILED': return '✗';
      case 'CANCELLED': return '⊘';
      default: return '•';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'QUEUED': return 'Queued for Batch';
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'COMPLETED': return 'Completed';
      case 'FAILED': return 'Failed';
      case 'CANCELLED': return 'Cancelled';
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
    });
  }

  downloadReceipt(transferId: string) {
    // Download receipt logic
    console.log('Downloading receipt for:', transferId);
    // This would call the API to download the receipt
  }

  isHighlighted(transfer: NEFTTransfer): boolean {
    return transfer.eftReference === this.highlightedReference();
  }
}

