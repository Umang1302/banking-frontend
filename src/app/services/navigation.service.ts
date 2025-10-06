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
}
