import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { AdminTransaction, StatisticsResponse } from '../../models/neft.models';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);

  transactions = signal<AdminTransaction[]>([]);
  filteredTransactions = signal<AdminTransaction[]>([]);
  statistics = signal<StatisticsResponse | null>(null);
  totalCount = signal<number>(0);
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filters
  searchTerm = signal('');
  statusFilter = signal('ALL');
  dateFilter = signal('ALL');

  ngOnInit() {
    this.loadTransactions();
    this.loadStatistics();
  }

  loadTransactions() {
    this.loading.set(true);
    this.error.set(null);
    
    // Load transactions with optional status filter
    const status = this.statusFilter() !== 'ALL' ? this.statusFilter() : undefined;
    
    this.neftService.getAllTransactions(status).subscribe({
      next: (response) => {
        // Response structure: { status, filter?, count, transactions }
        this.transactions.set(response.transactions || []);
        this.totalCount.set(response.count || 0);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.error.set('Failed to load transactions');
        this.loading.set(false);
      }
    });
  }

  loadStatistics() {
    this.neftService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.transactions()];
    
    // Search filter - search by reference, beneficiary name, or initiator
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(t =>
        t.eftReference?.toLowerCase().includes(search) ||
        t.beneficiaryName?.toLowerCase().includes(search) ||
        t.beneficiaryAccountNumber?.toLowerCase().includes(search) ||
        t.initiatedBy?.toLowerCase().includes(search)
      );
    }
    
    // Note: Status filter is now applied at API level in loadTransactions()
    // But we keep this for local filtering if needed
    if (this.statusFilter() !== 'ALL') {
      filtered = filtered.filter(t => t.status === this.statusFilter());
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
    // Reload from API when status filter changes
    this.loadTransactions();
  }

  openDetailsModal(transaction: AdminTransaction) {
    // Navigate to transaction details page
    this.router.navigate(['/dashboard/admin-neft/transactions', transaction.eftReference]);
  }

  // View transaction details
  viewTransactionDetails(eftReference: string) {
    this.neftService.getTransactionByReference(eftReference).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          // Show full transaction details in modal
          console.log('Transaction details:', response.data);
          // You can implement a detailed modal here
        }
      },
      error: (err) => {
        console.error('Error loading transaction details:', err);
        alert('Failed to load transaction details');
      }
    });
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  formatTime(dateString: string | Date): string {
    return new Date(dateString).toLocaleTimeString('en-IN');
  }

  // Stats computed from transactions
  stats() {
    const txns = this.transactions();
    if (txns.length === 0) return null;
    
    const totalAmount = txns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const completedCount = txns.filter(t => t.status === 'COMPLETED').length;
    const pendingCount = txns.filter(t => t.status === 'PENDING' || t.status === 'QUEUED').length;
    const successRate = txns.length > 0 ? ((completedCount / txns.length) * 100).toFixed(2) : '0';
    
    return {
      totalTransactions: txns.length,
      totalAmount: totalAmount,
      successRate: parseFloat(successRate),
      pendingCount: pendingCount
    };
  }

  backToDashboard() {
    this.router.navigate(['/dashboard/admin-neft/dashboard']);
  }

}

