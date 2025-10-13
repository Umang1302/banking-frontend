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
      id: 'neft-transfer',
      title: 'NEFT Transfer',
      description: 'Send money to any bank account',
      icon: '💸',
      route: '/dashboard/neft/transfer'
    },
    {
      id: 'new-transaction',
      title: 'New Transaction',
      description: 'Create a new banking transaction',
      icon: '💳',
      route: '/dashboard/transactions/create'
    },
    {
      id: 'beneficiaries',
      title: 'My Beneficiaries',
      description: 'Manage your saved beneficiaries',
      icon: '👥',
      route: '/dashboard/neft/beneficiaries'
    },
    {
      id: 'view-statements',
      title: 'View Statements',
      description: 'Download your account statements',
      icon: '📄',
      route: '/dashboard/transactions/statements'
    },
    {
      id: 'transaction-history',
      title: 'Transaction History',
      description: 'View all your transactions',
      icon: '📊',
      route: '/dashboard/transactions/history'
    },
    {
      id: 'upi-payments',
      title: 'UPI Payments',
      description: 'Quick UPI payments (Coming Soon)',
      icon: '📱',
      action: 'upi-coming-soon'
    },
    {
      id: 'apply-loan',
      title: 'Apply for Loan',
      description: 'Explore loan options (Coming Soon)',
      icon: '🏦',
      action: 'loan-coming-soon'
    }
    // ,
    // {
    //   id: 'bulk-upload',
    //   title: 'Bulk Upload',
    //   description: 'Upload multiple transactions',
    //   icon: '📤',
    //   route: '/dashboard/transactions/bulk-upload'
    // }
  ];

  ngOnInit(): void {
    console.log('Dashboard Home component initialized');
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
      account.accountType === 'SAVINGS' || account.accountType === 'CURRENT'
    );
  }

  getAccountIcon(accountType: string): string {
    const icons: { [key: string]: string } = {
      'SAVINGS': '💰',
      'CURRENT': '💼',
      'CREDIT': '💳',
      'LOAN': '🏦'
    };
    return icons[accountType] || '💳';
  }

  getAccountTypeDisplay(accountType: string): string {
    const displays: { [key: string]: string } = {
      'SAVINGS': 'Savings Account',
      'CURRENT': 'Current Account',
      'CREDIT': 'Credit Card',
      'LOAN': 'Loan Account'
    };
    return displays[accountType] || accountType;
  }

  onQuickLinkClick(link: QuickLink): void {
    console.log('Quick link clicked:', link);
    if (link.route) {
      this.router.navigate([link.route]);
    } else if (link.action) {
      // Handle specific actions
      switch (link.action) {
        case 'upi-coming-soon':
          alert('🚀 UPI Payments feature coming soon! Stay tuned for quick and easy payments.');
          break;
        case 'loan-coming-soon':
          alert('🏦 Loan application feature coming soon! We\'ll notify you when it\'s available.');
          break;
        default:
          console.log('Action not implemented:', link.action);
      }
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

