import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { UserService } from '../../store/userStore/user.service';
import { AdminService } from './admin.service';

export interface DashboardData {
  userStatusCounts: {
    PENDING_DETAILS: number;
    PENDING_REVIEW: number;
    UNDER_REVIEW: number;
    ACTIVE: number;
    REJECTED: number;
    SUSPENDED: number;
    LOCKED: number;
    EXPIRED: number;
  };
  totalUsers: number;
  totalCustomers: number;
  totalAccounts: number;
  pendingActions: {
    pendingDetailsCount: number;
    pendingReviewCount: number;
    underReviewCount: number;
  };
  recentUsers: any[];
}

export interface PendingUser {
  userId: number;
  username: string;
  email: string;
  mobile?: string;
  status: string;
  createdAt: string;
  roles: { name: string }[];
  customer?: {
    customerId: number;
    firstName: string;
    lastName: string;
    nationalId: string;
    address: string;
    status: string;
    otherInfo?: string;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private adminService = inject(AdminService);

  user$ = this.userService.user$;
  isLoading = false;
  error: string | null = null;

  // Dashboard data
  dashboardData: DashboardData | null = null;
  pendingReviewUsers: PendingUser[] = [];
  pendingDetailsUsers: PendingUser[] = [];
  allUsers: PendingUser[] = [];

  // UI state
  activeTab = 'dashboard';
  selectedUser: PendingUser | null = null;
  showUserModal = false;
  showRejectModal = false;
  rejectionReason = '';
  isRefreshing = false;

  // Tab configuration
  tabs = [
    { id: 'dashboard', label: '📊 Dashboard', urgent: false },
    { id: 'pending-details', label: '📝 Pending Details', urgent: false },
    { id: 'pending-review', label: '⏳ Pending Review', urgent: true },
    { id: 'all-users', label: '👥 All Users', urgent: false }
  ];

  ngOnInit(): void {
    console.log('Admin Dashboard initialized');
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // Load dashboard statistics
      this.dashboardData = await this.adminService.getDashboardData() as DashboardData;
      
      // Load users for different tabs
      await Promise.all([
        this.loadPendingReviewUsers(),
        this.loadPendingDetailsUsers(),
        this.loadAllUsers()
      ]);

    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      this.error = error.message || 'Failed to load dashboard data';
    } finally {
      this.isLoading = false;
    }
  }

  async loadPendingReviewUsers(): Promise<void> {
    try {
      const response: any = await this.adminService.getPendingReviewUsers();
      this.pendingReviewUsers = response.users || [];
    } catch (error: any) {
      console.error('Failed to load pending review users:', error);
    }
  }

  async loadPendingDetailsUsers(): Promise<void> {
    try {
      const response: any = await this.adminService.getPendingDetailsUsers();
      this.pendingDetailsUsers = response.users || [];
    } catch (error: any) {
      console.error('Failed to load pending details users:', error);
    }
  }

  async loadAllUsers(): Promise<void> {
    try {
      const response: any = await this.adminService.getAllUsers();
      this.allUsers = response.users || [];
    } catch (error: any) {
      console.error('Failed to load all users:', error);
    }
  }

  async refreshDashboard(): Promise<void> {
    this.isRefreshing = true;
    await this.loadDashboardData();
    this.isRefreshing = false;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  viewUserDetails(user: PendingUser): void {
    this.selectedUser = user;
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  async approveUser(userId: number): Promise<void> {
    try {
      await this.adminService.approveUser(userId);
      this.showNotification('success', 'User approved successfully!');
      this.closeUserModal();
      await this.refreshDashboard();
    } catch (error: any) {
      console.error('Failed to approve user:', error);
      this.showNotification('error', error.message || 'Failed to approve user');
    }
  }

  showRejectUserModal(user: PendingUser): void {
    this.selectedUser = user;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedUser = null;
    this.rejectionReason = '';
  }

  async confirmRejectUser(): Promise<void> {
    if (!this.selectedUser || !this.rejectionReason.trim()) {
      this.showNotification('error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await this.adminService.rejectUser(this.selectedUser.userId, this.rejectionReason);
      this.showNotification('success', 'User rejected successfully');
      this.closeRejectModal();
      this.closeUserModal();
      await this.refreshDashboard();
    } catch (error: any) {
      console.error('Failed to reject user:', error);
      this.showNotification('error', error.message || 'Failed to reject user');
    }
  }

  private showNotification(type: 'success' | 'error', message: string): void {
    // Simple notification - you can enhance this with a proper notification service
    alert(`${type.toUpperCase()}: ${message}`);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  parseOtherInfo(otherInfo?: string): any {
    if (!otherInfo) return {};
    try {
      return JSON.parse(otherInfo);
    } catch {
      return {};
    }
  }

  getPendingReviewCount(): number {
    return this.dashboardData?.pendingActions?.pendingReviewCount || 0;
  }

  getPendingDetailsCount(): number {
    return this.dashboardData?.pendingActions?.pendingDetailsCount || 0;
  }
}
