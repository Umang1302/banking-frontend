import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { TransactionDetailsResponse } from '../../models/neft.models';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  transactionDetails = signal<TransactionDetailsResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  eftReference = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      const reference = params['reference'];
      if (reference) {
        this.eftReference.set(reference);
        this.loadTransactionDetails(reference);
      }
    });
  }

  loadTransactionDetails(reference: string) {
    this.loading.set(true);
    this.error.set(null);

    this.neftService.getTransactionByReference(reference).subscribe({
      next: (response) => {
        console.log('Transaction Details API Response:', response);
        if (response.status === 'success') {
          this.transactionDetails.set(response);
        } else {
          this.error.set('Failed to load transaction details');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transaction details:', err);
        this.error.set(err.error?.message || 'Transaction not found');
        this.loading.set(false);
      }
    });
  }

  get data() {
    return this.transactionDetails()?.data;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PROCESSING': return 'status-processing';
      case 'FAILED': return 'status-failed';
      case 'PENDING':
      case 'QUEUED': return 'status-pending';
      default: return 'status-scheduled';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'PROCESSING': return '⟳';
      case 'FAILED': return '✗';
      case 'PENDING': return '⏳';
      case 'QUEUED': return '📋';
      default: return '•';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatTime(timeString: string | null): string {
    if (!timeString) return 'N/A';
    return timeString;
  }

  backToTransactions() {
    this.router.navigate(['/dashboard/admin-neft/transactions']);
  }

  viewBatchDetails() {
    const batchId = this.data?.batchId;
    if (batchId) {
      this.router.navigate(['/dashboard/admin-neft/batches', batchId]);
    }
  }
}

