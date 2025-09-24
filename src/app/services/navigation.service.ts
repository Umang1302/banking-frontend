import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface NavigationItem {
  id: string;
  label: string;
  routerLink: string;
  icon: string;
  roles: string[];
  order: number;
  isActive?: boolean;
}

export interface NavigationConfig {
  items: NavigationItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private http = inject(HttpClient);
  private configLoaded = new BehaviorSubject<boolean>(false);
  
  private navigationConfig: NavigationConfig = {
    items: [
      {
        id: 'profile',
        label: 'Profile',
        routerLink: '/profile',
        icon: '👤',
        roles: ['user', 'admin', 'superadmin'],
        order: 1
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        routerLink: '/dashboard',
        icon: '🏠',
        roles: ['user', 'admin', 'superadmin'],
        order: 2
      },
      {
        id: 'accounts',
        label: 'My Accounts',
        routerLink: '/accounts',
        icon: '💳',
        roles: ['user', 'admin', 'superadmin'],
        order: 3
      },
      {
        id: 'transfers',
        label: 'Transfers',
        routerLink: '/transfers',
        icon: '💸',
        roles: ['user', 'admin', 'superadmin'],
        order: 4
      },
      {
        id: 'transactions',
        label: 'Transaction History',
        routerLink: '/transactions',
        icon: '📋',
        roles: ['user', 'admin', 'superadmin'],
        order: 5
      },
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        routerLink: '/admin-dashboard',
        icon: '⚙️',
        roles: ['admin', 'superadmin'],
        order: 10
      },
      {
        id: 'user-management',
        label: 'User Management',
        routerLink: '/user-management',
        icon: '👥',
        roles: ['admin', 'superadmin'],
        order: 11
      },
      {
        id: 'reports',
        label: 'Reports',
        routerLink: '/reports',
        icon: '📊',
        roles: ['admin', 'superadmin'],
        order: 12
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        routerLink: '/system-settings',
        icon: '🔧',
        roles: ['superadmin'],
        order: 20
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        routerLink: '/audit-logs',
        icon: '📝',
        roles: ['superadmin'],
        order: 21
      }
    ]
  };

  loadNavigationConfig(): Observable<NavigationConfig> {
    return this.http.get<NavigationConfig>('config/navigation.json').pipe(
      map(config => {
        this.navigationConfig = config;
        this.configLoaded.next(true);
        return config;
      }),
      catchError(error => {
        console.warn('Failed to load navigation config from JSON, using default config:', error);
        this.configLoaded.next(true);
        return of(this.navigationConfig);
      })
    );
  }

  getNavigationItems(userRole: string | null): Observable<NavigationItem[]> {
    if (!userRole) {
      return of([]);
    }

    // Ensure config is loaded first
    return this.ensureConfigLoaded().pipe(
      map(() => {
        const filteredItems = this.navigationConfig.items
          .filter(item => item.roles.includes(userRole))
          .sort((a, b) => a.order - b.order);

        return filteredItems;
      })
    );
  }

  private ensureConfigLoaded(): Observable<NavigationConfig> {
    if (this.configLoaded.value) {
      return of(this.navigationConfig);
    }
    
    return this.loadNavigationConfig();
  }

  getAllNavigationItems(): Observable<NavigationItem[]> {
    return of(this.navigationConfig.items.sort((a, b) => a.order - b.order));
  }

  hasAccess(routePath: string, userRole: string | null): boolean {
    if (!userRole) return false;
    
    const item = this.navigationConfig.items.find(item => 
      item.routerLink === routePath || item.routerLink === `/${routePath}`
    );
    
    return item ? item.roles.includes(userRole) : false;
  }

  updateNavigationConfig(config: NavigationConfig): void {
    this.navigationConfig = config;
  }

  addNavigationItem(item: NavigationItem): void {
    this.navigationConfig.items.push(item);
  }

  removeNavigationItem(itemId: string): void {
    this.navigationConfig.items = this.navigationConfig.items.filter(
      item => item.id !== itemId
    );
  }
}
