import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RtgsService } from '../../services/rtgs.service';
import { RTGSDashboardResponse, AdminRTGSTransaction, RTGSTransactionsResponse } from '../../models/rtgs.models';

@Component({
  selector: 'app-admin-rtgs-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-rtgs-dashboard.component.html',
  styleUrls: ['./admin-rtgs-dashboard.component.css']
})
export class AdminRtgsDashboardComponent implements OnInit {
  private rtgsService = inject(RtgsService);
  private router = inject(Router);

  dashboardData = signal<RTGSDashboardResponse | null>(null);
  recentTransactions = signal<AdminRTGSTransaction[]>([]);
  failedTransactions = signal<AdminRTGSTransaction[]>([]);
  
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    Promise.all([
      this.rtgsService.getRTGSDashboard().toPromise(),
      this.rtgsService.getRTGSTransactions('COMPLETED').toPromise(),
      this.rtgsService.getRTGSTransactions('FAILED').toPromise()
    ]).then(([dashboard, recent, failed]) => {
      console.log('RTGS Dashboard Response:', dashboard);
      console.log('Recent Transactions Response:', recent);
      console.log('Failed Transactions Response:', failed);
      
      this.dashboardData.set(dashboard || null);
      this.recentTransactions.set((recent?.transactions || []).slice(0, 5)); // Last 5
      this.failedTransactions.set(failed?.transactions || []);
      this.loading.set(false);
    }).catch(err => {
      console.error('Error loading RTGS dashboard data:', err);
      this.error.set('Failed to load RTGS dashboard data');
      this.loading.set(false);
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDateTime(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatsCards() {
    const dashboard = this.dashboardData();
    if (!dashboard) return null;

    const counts = dashboard.transactionCounts;
    const financial = dashboard.financial;
    const statistics = dashboard.statistics;

    return {
      total: counts?.total || 0,
      processing: counts?.processing || 0,
      completed: counts?.completed || 0,
      failed: counts?.failed || 0,
      totalAmount: financial?.totalAmount || 0,
      totalCharges: financial?.totalCharges || 0,
      revenue: financial?.revenue || 0,
      successRate: statistics?.successRate || '0%',
      failureRate: statistics?.failureRate || '0%'
    };
  }

  getChartData() {
    const stats = this.getStatsCards();
    if (!stats) return null;

    return {
      statusDistribution: [
        { label: 'Completed', value: stats.completed, color: '#28a745' },
        { label: 'Processing', value: stats.processing, color: '#17a2b8' },
        { label: 'Failed', value: stats.failed, color: '#dc3545' }
      ],
      successRate: parseFloat(stats.successRate.replace('%', '')),
      failureRate: parseFloat(stats.failureRate.replace('%', ''))
    };
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

  viewTransactionDetails(reference: string) {
    this.router.navigate([`/dashboard/admin-rtgs/transactions/${reference}`]);
  }

  refreshDashboard() {
    this.loadDashboardData();
  }
}

