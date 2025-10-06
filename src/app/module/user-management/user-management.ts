import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UserService } from '../../store/userStore/user.service';
import { User, UserStatus, UserRole } from '../../store/userStore/user.action';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagementComponent implements OnInit {
  userService = inject(UserService);
  
  // Mock data for demonstration
  pendingUsers: User[] = [
    {
      id: '1',
      username: 'john_doe',
      email: 'john.doe@example.com',
      mobile: '+27123456789',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      status: UserStatus.PENDING_APPROVAL,
      address: '123 Main Street',
      city: 'Cape Town',
      state: 'Western Cape',
      zipCode: '8001',
      dateOfBirth: '1990-05-15',
      occupation: 'Software Developer',
      annualIncome: 750000,
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+27987654321',
      profileCompletedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      username: 'mary_smith',
      email: 'mary.smith@example.com',
      mobile: '+27234567890',
      firstName: 'Mary',
      lastName: 'Smith',
      role: UserRole.USER,
      status: UserStatus.PENDING_APPROVAL,
      address: '456 Oak Avenue',
      city: 'Johannesburg',
      state: 'Gauteng',
      zipCode: '2000',
      dateOfBirth: '1985-08-22',
      occupation: 'Marketing Manager',
      annualIncome: 850000,
      emergencyContactName: 'Peter Smith',
      emergencyContactPhone: '+27876543210',
      profileCompletedAt: '2024-01-16T14:15:00Z'
    }
  ];

  UserStatus = UserStatus;
  UserRole = UserRole;

  ngOnInit(): void {
    console.log('User Management component initialized');
  }

  approveUser(user: User): void {
    if (user.id) {
      this.userService.approveProfile(user.id);
      // In a real app, this would update the user list from the backend
      user.status = UserStatus.ACTIVE;
      user.role = UserRole.CUSTOMER;
      user.profileApprovedAt = new Date().toISOString();
      console.log(`User ${user.username} approved and converted to CUSTOMER`);
    }
  }

  rejectUser(user: User): void {
    if (user.id) {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason) {
        this.userService.rejectProfile(user.id, reason);
        // In a real app, this would update the user list from the backend
        user.status = UserStatus.REJECTED;
        user.rejectionReason = reason;
        user.profileRejectedAt = new Date().toISOString();
        console.log(`User ${user.username} rejected: ${reason}`);
      }
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case UserStatus.PENDING_APPROVAL:
        return 'badge-pending';
      case UserStatus.ACTIVE:
        return 'badge-active';
      case UserStatus.REJECTED:
        return 'badge-rejected';
      default:
        return 'badge-default';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount?: number): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
}
