import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../store/userStore/user.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transaction.html',
  styleUrls: ['./transaction.css']
})
export class TransactionComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private navigationService = inject(NavigationService);
  
  user$ = this.userService.user$;
  userRole$ = this.userService.role$;
  
  tabs = [
    {
      id: 'history',
      label: 'Transaction History',
      icon: '📊',
      route: '/dashboard/transactions/history',
      show: true
    },
    {
      id: 'create',
      label: 'New Transaction',
      icon: '💳',
      route: '/dashboard/transactions/create',
      show: false // Will be set based on permissions
    },
    {
      id: 'bulk',
      label: 'Bulk Upload',
      icon: '📤',
      route: '/dashboard/transactions/bulk-upload',
      show: false // Will be set based on permissions
    },
    {
      id: 'statement',
      label: 'Statements',
      icon: '📄',
      route: '/dashboard/transactions/statements',
      show: true
    }
  ];

  ngOnInit(): void {
    // Load navigation config first
    this.navigationService.loadNavigationConfig().subscribe(() => {
      // Check user role and set permissions from navigation.json
      this.userService.role$.subscribe(role => {
        // Update tab visibility based on navigation.json permissions
        this.tabs = this.tabs.map(tab => {
          let navItemId = '';
          
          // Map tab IDs to navigation.json item IDs
          switch(tab.id) {
            case 'history':
              navItemId = 'transaction-history';
              break;
            case 'create':
              navItemId = 'new-transaction';
              break;
            case 'bulk':
              navItemId = 'bulk-upload';
              break;
            case 'statement':
              navItemId = 'statements';
              break;
          }
          
          // Check if user has access to this navigation item
          const hasAccess = this.navigationService.canAccessNavigationItem(navItemId, role);
          return { ...tab, show: hasAccess };
        });
      });
    });

    // Auto-navigate to history if on base transactions path
    const currentPath = this.router.url;
    if (currentPath === '/dashboard/transactions') {
      this.router.navigate(['/dashboard/transactions/history']);
    }
  }

  getVisibleTabs() {
    return this.tabs.filter(tab => tab.show);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}

