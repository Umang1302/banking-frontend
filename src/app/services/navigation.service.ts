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
  order?: number;
  isActive?: boolean;
  children?: NavigationItem[];
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
    items: []
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
          .sort((a, b) => (a.order || 0) - (b.order || 0));

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

  // Get navigation item by ID (including children)
  getNavigationItemById(itemId: string): NavigationItem | null {
    for (const item of this.navigationConfig.items) {
      if (item.id === itemId) {
        return item;
      }
      // Check in children
      if (item.children) {
        const childItem = item.children.find(child => child.id === itemId);
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  }

  // Check if a user role has access to a navigation item
  canAccessNavigationItem(itemId: string, userRole: string | null): boolean {
    if (!userRole) return false;
    
    const item = this.getNavigationItemById(itemId);
    if (!item) return false;
    
    // If roles array is empty, allow all roles
    if (item.roles.length === 0) return true;
    
    // Otherwise check if user role is in the allowed roles
    return item.roles.includes(userRole);
  }

  // Check if a user role has access to a specific route path
  canAccessRoute(routePath: string, userRole: string | null): Observable<boolean> {
    if (!userRole) return of(false);
    
    return this.ensureConfigLoaded().pipe(
      map(() => {
        // Normalize the route path (remove leading slash and query params)
        const normalizedPath = routePath.replace(/^\//, '').split('?')[0];
        
        // First, check all children routes (more specific routes have priority)
        for (const item of this.navigationConfig.items) {
          if (item.children) {
            for (const child of item.children) {
              const childPath = child.routerLink.replace(/^\//, '');
              
              // Check for exact match or path starting with child path
              if (normalizedPath === childPath || normalizedPath.startsWith(childPath + '/')) {
                // If roles array is empty, allow all roles
                if (child.roles.length === 0) return true;
                // Check if user role is in the allowed roles
                return child.roles.includes(userRole);
              }
            }
          }
        }
        
        // Then check parent routes (only if no child match found)
        for (const item of this.navigationConfig.items) {
          const itemPath = item.routerLink.replace(/^\//, '');
          
          // Check if the route matches this item
          if (normalizedPath === itemPath || normalizedPath.startsWith(itemPath + '/')) {
            // If roles array is empty, allow all roles
            if (item.roles.length === 0) return true;
            // Check if user role is in the allowed roles
            return item.roles.includes(userRole);
          }
        }
        
        // If no matching route found in navigation config, deny access
        return false;
      })
    );
  }
}
