import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { User } from '../../store/userStore/user.action';
import { UserService } from '../../store/userStore/user.service';
import { NavigationService, NavigationItem } from '../../services/navigation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  userService = inject(UserService);
  private router = inject(Router);
  private navigationService = inject(NavigationService);
  
  user$ = this.userService.user$;
  userFullName$ = this.userService.userFullName$;
  userInitials$ = this.userService.userInitials$;
  
  // Navigation items
  navigationItems: NavigationItem[] = [];

  constructor() {
    // Subscribe to role changes and update navigation items
    this.userService.role$.subscribe(role => {
      console.log('User role changed:', role);
      if (role) {
        this.navigationService.getNavigationItems(role).subscribe(items => {
          this.navigationItems = items;
          console.log('Navigation items loaded:', items);
        });
      } else {
        this.navigationItems = [];
      }
    });
  }
  
  ngOnInit(): void {
    console.log("Dashboard component initialized");
    this.userService.loadProfile();
    
    // Auto-redirect based on user role
    this.userService.role$.subscribe(role => {
      console.log("User Role:", role);
      const currentPath = this.router.url;
      
      // Only redirect if on base dashboard path
      if (currentPath === '/dashboard' || currentPath === '/') {
        if (role === 'admin' || role === 'superadmin') {
          console.log('Admin user detected, redirecting to admin dashboard');
          this.router.navigate(['/dashboard/admin']);
        } else if (role === 'accountant') {
          console.log('Accountant user detected, redirecting to bulk-upload');
          this.router.navigate(['/dashboard/transactions/bulk-upload']);
        } else if (role === 'customer') {
          console.log('Customer user detected, redirecting to home');
          this.router.navigate(['/dashboard/home']);
        }
      }
    });
  }

  onLogout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  getUserRoleDisplay(user: User | null): string {
    if (!user?.role) return 'User';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  }
}
