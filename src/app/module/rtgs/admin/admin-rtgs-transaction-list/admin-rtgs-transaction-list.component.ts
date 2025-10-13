import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RtgsService } from '../../services/rtgs.service';
import { AdminRTGSTransaction } from '../../models/rtgs.models';

@Component({
  selector: 'app-admin-rtgs-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-rtgs-transaction-list.component.html',
  styleUrls: ['./admin-rtgs-transaction-list.component.css']
})
export class AdminRtgsTransactionListComponent implements OnInit {
  private rtgsService = inject(RtgsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  transactions = signal<AdminRTGSTransaction[]>([]);
  filteredTransactions = signal<AdminRTGSTransaction[]>([]);
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  statusFilter = signal('ALL');
  searchTerm = signal('');

  ngOnInit() {
    // Check query params for status filter
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter.set(params['status']);
      }
    });

    this.loadTransactions();
  }

  loadTransactions() {
    this.loading.set(true);
    this.error.set(null);

    const status = this.statusFilter() === 'ALL' ? undefined : this.statusFilter();
    
    this.rtgsService.getRTGSTransactions(status).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.error.set('Failed to load RTGS transactions');
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.transactions()];
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(t =>
        t.eftReference.toLowerCase().includes(search) ||
        t.beneficiaryName.toLowerCase().includes(search) ||
        t.sourceAccount.customer.firstName.toLowerCase().includes(search) ||
        t.sourceAccount.customer.lastName.toLowerCase().includes(search) ||
        t.amount.toString().includes(search)
      );
    }
    
    this.filteredTransactions.set(filtered);
  }

  onStatusFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.loadTransactions();
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFilters();
  }

  viewTransactionDetails(reference: string) {
    this.router.navigate([`/dashboard/admin-rtgs/transactions/${reference}`]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-success';
      case 'PROCESSING': return 'status-info';
      case 'FAILED': return 'status-danger';
      default: return 'status-secondary';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

