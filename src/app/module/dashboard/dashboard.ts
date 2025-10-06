import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';

import { User } from '../../store/userStore/user.action';
import { selectUser, selectUserFullName, selectUserInitials } from '../../store/userStore/user.selectors';
import { userActions } from '../../store/userStore/user.action';

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
  isLoading$ = this.userService.isLoading$;
  error$ = this.userService.error$;
  userFullName$ = this.userService.userFullName$;
  userInitials$ = this.userService.userInitials$;
  
  // Navigation items - simple array approach
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
  }

  //print user profile
  printUserProfile(): void {
    this.userService.user$.subscribe(user => {
      console.log("User Profile:", user);
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
