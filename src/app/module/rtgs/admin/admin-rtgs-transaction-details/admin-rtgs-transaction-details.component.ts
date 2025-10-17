import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RtgsService } from '../../services/rtgs.service';
import { RTGSTransactionDetailsResponse } from '../../models/rtgs.models';

@Component({
  selector: 'app-admin-rtgs-transaction-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-rtgs-transaction-details.component.html',
  styleUrls: ['./admin-rtgs-transaction-details.component.css']
})
export class AdminRtgsTransactionDetailsComponent implements OnInit {
  private rtgsService = inject(RtgsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  transactionDetails = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  reference = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      const ref = params['reference'];
      if (ref) {
        this.reference.set(ref);
        this.loadTransactionDetails(ref);
      }
    });
  }

  loadTransactionDetails(reference: string) {
    this.loading.set(true);
    this.error.set(null);

    this.rtgsService.getRTGSTransactionByReference(reference).subscribe({
      next: (response) => {
        this.transactionDetails.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading transaction details:', err);
        this.error.set('Failed to load transaction details');
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/admin-rtgs/transactions']);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentDateTime(): string {
    return this.formatDateTime(new Date().toISOString());
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'status-success';
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return 'status-info';
      case 'FAILED':
      case 'ERROR':
        return 'status-danger';
      case 'PENDING':
      case 'QUEUED':
        return 'status-warning';
      default:
        return 'status-info';
    }
  }
}

