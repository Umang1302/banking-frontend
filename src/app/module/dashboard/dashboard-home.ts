import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { User, Account, Transaction } from '../../store/userStore/user.action';
import { UserService } from '../../store/userStore/user.service';

export interface QuickLink {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  action?: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardHomeComponent implements OnInit {
  userService = inject(UserService);
  private router = inject(Router);
  
  user$ = this.userService.user$;
  userFullName$ = this.userService.userFullName$;
  customerId$ = this.userService.customerId$;
  copySuccess = false;
  
  // Banking Quick Links
  quickLinks: QuickLink[] = [
    {
      id: 'qr-payment',
      title: 'QR Payments',
      description: 'Generate or scan QR codes for instant payments',
      icon: '📱',
      route: '/dashboard/qr-payment/generate'
    },
    {
      id: 'upi-payments',
      title: 'UPI Payments',
      description: 'Pay instantly using UPI',
      icon: '💰',
      route: '/dashboard/upi-payment/pay'
    },
    {
      id: 'neft-transfer',
      title: 'NEFT Transfer',
      description: 'Send money to any bank account',
      icon: '💸',
      route: '/dashboard/neft/transfer'
    },
    {
      id: 'rtgs-transfer',
      title: 'RTGS Transfer',
      description: 'High-value instant transfers',
      icon: '⚡',
      route: '/dashboard/rtgs/transfer'
    },
    {
      id: 'beneficiaries',
      title: 'My Beneficiaries',
      description: 'Manage your saved beneficiaries',
      icon: '👥',
      route: '/dashboard/neft/beneficiaries'
    },
    {
      id: 'transaction-history',
      title: 'Transaction History',
      description: 'View all your transactions',
      icon: '📊',
      route: '/dashboard/transactions/history'
    },
    {
      id: 'new-transaction',
      title: 'New Transaction',
      description: 'Create a new banking transaction',
      icon: '💳',
      route: '/dashboard/transactions/create'
    },
    {
      id: 'view-statements',
      title: 'View Statements',
      description: 'Download your account statements',
      icon: '📄',
      route: '/dashboard/transactions/statements'
    }
  ];

  ngOnInit(): void {
    console.log('Dashboard Home component initialized');
    // Refresh user data when dashboard loads
    this.userService.loadProfile();
  }

  navigateToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  getTotalBalance(): number {
    let total = 0;
    this.user$.subscribe(user => {
      if (user?.accounts) {
        const filteredAccounts = this.getFilteredAccounts(user.accounts);
        total = filteredAccounts.reduce((sum, account) => {
          const balance = parseFloat(account.availableBalance || '0');
          return sum + balance;
        }, 0);
      }
    });
    return total;
  }

  getFilteredAccounts(accounts: Account[] | undefined): Account[] {
    if (!accounts) {
      return [];
    }
    return accounts.filter(account => 
      account.accountType === 'SAVINGS' || 
      account.accountType === 'CURRENT' || 
      account.accountType === 'FIXED_DEPOSIT'
    );
  }

  getAccountIcon(accountType: string): string {
    const icons: { [key: string]: string } = {
      'SAVINGS': '💰',
      'CURRENT': '💼',
      'CREDIT': '💳',
      'LOAN': '🏦',
      'FIXED_DEPOSIT': '🏛️'
    };
    return icons[accountType] || '💳';
  }

  getAccountTypeDisplay(accountType: string): string {
    const displays: { [key: string]: string } = {
      'SAVINGS': 'Savings Account',
      'CURRENT': 'Current Account',
      'CREDIT': 'Credit Card',
      'LOAN': 'Loan Account',
      'FIXED_DEPOSIT': 'Fixed Deposit'
    };
    return displays[accountType] || accountType;
  }

  onQuickLinkClick(link: QuickLink): void {
    console.log('Quick link clicked:', link);
    console.log('Link route:', link.route);
    console.log('Router:', this.router);
    
    if (link.route) {
      console.log('Navigating to:', link.route);
      this.router.navigate([link.route]).then(
        (success) => {
          console.log('Navigation successful:', success);
        },
        (error) => {
          console.error('Navigation failed:', error);
        }
      );
    } else if (link.action) {
      // Handle specific actions
      console.log('Action not implemented:', link.action);
    } else {
      console.warn('No route or action defined for link:', link);
    }
  }

  getRecentTransactions(transactions: Transaction[] | undefined): Transaction[] {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    // Sort by date (newest first) and return top 5
    return [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5);
  }

  formatTransactionDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  formatAmount(amount: string): string {
    return parseFloat(amount).toFixed(2);
  }

  getTransactionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'DEBIT': '💸',
      'CREDIT': '💰',
      'TRANSFER': '🔄',
      'WITHDRAWAL': '🏧',
      'DEPOSIT': '💵'
    };
    return icons[type] || '💳';
  }

  viewAllTransactions(): void {
    this.router.navigate(['/dashboard/transactions/history']);
  }

  copyCustomerId(): void {
    this.customerId$.subscribe(customerId => {
      if (customerId) {
        navigator.clipboard.writeText(String(customerId)).then(() => {
          this.copySuccess = true;
          setTimeout(() => {
            this.copySuccess = false;
          }, 2000); // Reset after 2 seconds
        }).catch(err => {
          console.error('Failed to copy customer ID:', err);
        });
      }
    }).unsubscribe();
  }
}

