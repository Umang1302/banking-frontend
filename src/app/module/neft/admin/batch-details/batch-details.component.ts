import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { BatchDetailsResponse, BatchTransaction } from '../../models/neft.models';

@Component({
  selector: 'app-batch-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batch-details.component.html',
  styleUrls: ['./batch-details.component.css']
})
export class BatchDetailsComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  batchDetails = signal<BatchDetailsResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  batchId = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['batchId'];
      if (id) {
        this.batchId.set(id);
        this.loadBatchDetails(id);
      }
    });
  }

  loadBatchDetails(batchId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.neftService.getBatchById(batchId).subscribe({
      next: (response) => {
        console.log('Batch Details API Response:', response);
        if (response.status === 'success') {
          this.batchDetails.set(response);
        } else {
          this.error.set('Failed to load batch details');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading batch details:', err);
        this.error.set(err.error?.message || 'Failed to load batch details');
        this.loading.set(false);
      }
    });
  }

  get data() {
    return this.batchDetails()?.data;
  }

  get transactions(): BatchTransaction[] {
    return this.data?.transactions || [];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PROCESSING': return 'status-processing';
      case 'FAILED': return 'status-failed';
      case 'PARTIALLY_COMPLETED': return 'status-partial';
      default: return 'status-scheduled';
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
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatTime(timeString: string): string {
    return timeString;
  }

  getSuccessRate(): number {
    const data = this.data;
    if (!data || data.totalTransactions === 0) return 0;
    return (data.successfulTransactions / data.totalTransactions) * 100;
  }

  backToBatches() {
    this.router.navigate(['/dashboard/admin-neft/batches']);
  }

  viewTransactionDetails(eftReference: string) {
    this.router.navigate(['/dashboard/admin-neft/transactions', eftReference]);
  }
}

