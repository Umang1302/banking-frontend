import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { AdminDashboardResponse, PendingTransactionsResponse, StatisticsResponse, AdminTransaction } from '../../models/neft.models';

@Component({
  selector: 'app-admin-neft-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-neft-dashboard.component.html',
  styleUrls: ['./admin-neft-dashboard.component.css']
})
export class AdminNeftDashboardComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);

  // Dashboard Stats - using correct API response structure from backend
  dashboardData = signal<AdminDashboardResponse | null>(null);
  pendingTransactions = signal<AdminTransaction[]>([]);
  statisticsData = signal<StatisticsResponse | null>(null);
  failedTransactions = signal<AdminTransaction[]>([]);
  
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    // Load dashboard data using correct APIs from backend documentation
    Promise.all([
      this.neftService.getDashboardStats().toPromise(),
      this.neftService.getPendingTransactions().toPromise(),
      this.neftService.getStatistics().toPromise(),
      this.neftService.getAllTransactions('FAILED').toPromise()
    ]).then(([dashboard, pending, statistics, failedTxns]) => {
      console.log('Dashboard API Response:', dashboard);
      console.log('Pending Transactions Response:', pending);
      console.log('Statistics Response:', statistics);
      console.log('Failed Transactions Response:', failedTxns);
      
      this.dashboardData.set(dashboard || null);
      this.pendingTransactions.set(pending?.transactions || []);
      this.statisticsData.set(statistics || null);
      this.failedTransactions.set(failedTxns?.transactions || []);
      this.loading.set(false);
    }).catch(err => {
      console.error('Error loading dashboard data:', err);
      this.error.set('Failed to load dashboard data');
      this.loading.set(false);
    });
  }

  processBatchNow() {
    // Check if there are pending transactions
    const pendingCount = this.transactionCounts?.pending || 0;
    if (pendingCount === 0) {
      alert('No pending transactions to process');
      return;
    }

    if (confirm('Are you sure you want to process the current batch now?')) {
      this.neftService.processBatch().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            alert(response.message || 'Batch processing initiated successfully!');
            this.loadDashboardData();
          } else {
            alert('Failed to process batch: ' + response.message);
          }
        },
        error: (err) => {
          console.error('Error processing batch:', err);
          alert('Failed to process batch');
        }
      });
    }
  }

  navigateTo(route: string) {
    // Parse query parameters if present
    const [path, queryString] = route.split('?');
    
    if (queryString) {
      // Parse query parameters
      const queryParams: { [key: string]: string } = {};
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[key] = value;
        }
      });
      
      // Navigate with query parameters
      this.router.navigate([path], { queryParams });
    } else {
      // Navigate without query parameters
      this.router.navigate([route]);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatTime(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper methods for accessing dashboard data based on backend API structure

  // For stats cards - mapped from dashboard API response
  stats() {
    const dashboard = this.dashboardData();
    const statistics = this.statisticsData();
    
    if (!dashboard) return null;
    
    const counts = dashboard.transactionCounts;
    // Calculate actual total if backend returns 0 (sum of all status counts)
    const actualTotal = counts?.total || (
      (counts?.pending || 0) + 
      (counts?.queued || 0) + 
      (counts?.processing || 0) + 
      (counts?.completed || 0) + 
      (counts?.failed || 0)
    );
    
    // Calculate actual success rate based on completed vs total
    // If backend provides incorrect rate, recalculate
    const completedCount = counts?.completed || 0;
    const failedCount = counts?.failed || 0;
    const calculatedTotal = completedCount + failedCount + (counts?.pending || 0) + (counts?.queued || 0) + (counts?.processing || 0);
    const actualSuccessRate = calculatedTotal > 0 
      ? ((completedCount / calculatedTotal) * 100).toFixed(2)
      : '0.00';
    
    return {
      totalTransactions: actualTotal,
      totalAmount: dashboard.financial?.totalAmount || 0,
      successRate: parseFloat(actualSuccessRate),
      completedCount: completedCount,
      failedCount: failedCount,
      pendingCount: counts?.pending || 0,
      processingCount: counts?.processing || 0
    };
  }

  // For failed transfers widget
  failedTransfers() {
    return this.failedTransactions().slice(0, 3); // Show only first 3
  }

  // For today's activity widget
  todayActivity() {
    const dashboard = this.dashboardData();
    if (!dashboard) return null;
    
    const counts = dashboard.transactionCounts;
    // Calculate actual total if backend returns 0
    const actualTotal = counts?.total || (
      (counts?.pending || 0) + 
      (counts?.queued || 0) + 
      (counts?.processing || 0) + 
      (counts?.completed || 0) + 
      (counts?.failed || 0)
    );
    
    // Calculate actual success rate
    const completedCount = counts?.completed || 0;
    const calculatedTotal = completedCount + (counts?.failed || 0) + (counts?.pending || 0) + (counts?.queued || 0) + (counts?.processing || 0);
    const actualSuccessRate = calculatedTotal > 0 
      ? ((completedCount / calculatedTotal) * 100).toFixed(2)
      : '0.00';
    
    return {
      totalTransfers: actualTotal,
      totalVolume: dashboard.financial?.totalAmount || 0,
      successRate: parseFloat(actualSuccessRate)
    };
  }

  get transactionCounts() {
    return this.dashboardData()?.transactionCounts;
  }

  get financial() {
    return this.dashboardData()?.financial;
  }

  get totalBatches() {
    return this.statisticsData()?.totalBatches || 0;
  }
}

