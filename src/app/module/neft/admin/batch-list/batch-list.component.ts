import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { BatchSummary } from '../../models/neft.models';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batch-list.component.html',
  styleUrls: ['./batch-list.component.css']
})
export class BatchListComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);

  batches = signal<BatchSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  selectedStatus = signal<string>('ALL');
  searchTerm = signal<string>('');

  ngOnInit() {
    this.loadBatches();
  }

  loadBatches() {
    this.loading.set(true);
    this.error.set(null);

    this.neftService.getBatches().subscribe({
      next: (response) => {
        console.log('Batches API Response:', response);
        if (response.status === 'success') {
          this.batches.set(response.batches || []);
        } else {
          this.error.set('Failed to load batches');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.error.set('Failed to load batches');
        this.loading.set(false);
      }
    });
  }

  filteredBatches() {
    let filtered = this.batches();

    // Filter by status
    if (this.selectedStatus() !== 'ALL') {
      filtered = filtered.filter(batch => batch.status === this.selectedStatus());
    }

    // Filter by search term (batch ID)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(batch => 
        batch.batchId.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  viewBatchDetails(batchId: string) {
    this.router.navigate(['/dashboard/admin-neft/batches', batchId]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'PROCESSING': return 'status-processing';
      case 'FAILED': return 'status-failed';
      case 'PARTIAL': return 'status-partial';
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

  formatDateTime(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(timeString: string): string {
    return timeString;
  }

  // Summary calculations
  getTotalTransactionCount(): number {
    return this.filteredBatches().reduce((sum, b) => sum + b.transactionCount, 0);
  }

  getTotalAmount(): number {
    return this.filteredBatches().reduce((sum, b) => sum + b.totalAmount, 0);
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value);
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard/admin-neft/dashboard']);
  }
}

