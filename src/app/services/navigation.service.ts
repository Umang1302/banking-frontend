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
  hidden?: boolean; // New property to hide from menu display
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
    // Add cache-busting parameter to force reload
    const cacheBuster = new Date().getTime();
    return this.http.get<NavigationConfig>(`config/navigation.json?v=${cacheBuster}`).pipe(
      map(config => {
        console.log('Navigation config loaded:', config);
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
          .filter(item => {
            // Filter out hidden items from menu display
            if (item.hidden === true) return false;
            // If roles array is empty, allow all roles
            if (item.roles.length === 0) return true;
            // Otherwise check if user role is in the allowed roles
            return item.roles.includes(userRole);
          })
          .map(item => {
            // If item has children, filter them based on user role as well
            if (item.children && item.children.length > 0) {
              const filteredChildren = item.children.filter(child => {
                // Filter out hidden children from menu display
                if (child.hidden === true) return false;
                // If roles array is empty, allow all roles
                if (child.roles.length === 0) return true;
                // Otherwise check if user role is in the allowed roles
                return child.roles.includes(userRole);
              });
              
              // Return the item with filtered children
              return { ...item, children: filteredChildren };
            }
            
            // Return item as-is if it has no children
            return item;
          })
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
    console.log('canAccessRoute called:', routePath, 'userRole:', userRole);
    if (!userRole) {
      console.log('No user role provided, denying access');
      return of(false);
    }
    
    return this.ensureConfigLoaded().pipe(
      map(() => {
        // Normalize the route path (remove leading slash and query params)
        const normalizedPath = routePath.replace(/^\//, '').split('?')[0];
        console.log('Normalized path:', normalizedPath);
        
        // First, check all children routes (more specific routes have priority)
        for (const item of this.navigationConfig.items) {
          if (item.children) {
            for (const child of item.children) {
              const childPath = child.routerLink.replace(/^\//, '');
              
              // Check for exact match or path starting with child path
              if (normalizedPath === childPath || normalizedPath.startsWith(childPath + '/')) {
                console.log('Child route matched:', child.routerLink, 'roles:', child.roles);
                // If roles array is empty, allow all roles
                if (child.roles.length === 0) return true;
                // Check if user role is in the allowed roles
                const hasAccess = child.roles.includes(userRole);
                console.log('Access granted?', hasAccess);
                return hasAccess;
              }
            }
            
            // Check if the normalized path could be a parent route that has children
            // For example, /dashboard/rtgs should be allowed if /dashboard/rtgs/transfer is allowed
            const parentPath = item.routerLink.replace(/^\//, '');
            // Extract the base path from parent routerLink (e.g., dashboard/rtgs from dashboard/rtgs/transfer)
            const parentBasePath = parentPath.split('/').slice(0, -1).join('/');
            
            // If normalized path matches the base path of a parent with children, check parent's roles
            if (parentBasePath && normalizedPath === parentBasePath) {
              console.log('Parent base path matched:', parentBasePath, 'item roles:', item.roles);
              // If parent has roles defined, check them
              if (item.roles.length === 0) return true;
              const hasAccess = item.roles.includes(userRole);
              console.log('Access granted?', hasAccess);
              return hasAccess;
            }
          }
        }
        
        // Then check parent routes (only if no child match found)
        for (const item of this.navigationConfig.items) {
          const itemPath = item.routerLink.replace(/^\//, '');
          
          // Check if the route matches this item
          if (normalizedPath === itemPath || normalizedPath.startsWith(itemPath + '/')) {
            console.log('Parent route matched:', item.routerLink, 'roles:', item.roles);
            // If roles array is empty, allow all roles
            if (item.roles.length === 0) return true;
            // Check if user role is in the allowed roles
            const hasAccess = item.roles.includes(userRole);
            console.log('Access granted?', hasAccess);
            return hasAccess;
          }
        }
        
        // If no matching route found in navigation config, deny access
        console.log('No matching route found in navigation config, denying access');
        return false;
      })
    );
  }
}
