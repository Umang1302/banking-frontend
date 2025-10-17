import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, take, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserService } from '../store/userStore/user.service';
import { NavigationService } from '../services/navigation.service';

export const roleGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  console.log("roleGuard checking access for:", state.url);
  const router = inject(Router);
  const userService = inject(UserService);
  const navigationService = inject(NavigationService);

  // Check if user is authenticated first
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found, redirecting to login');
    return new Observable(observer => {
      observer.next(router.parseUrl('/login'));
      observer.complete();
    });
  }

  // Get the user's role and check if they can access this route
  return userService.role$.pipe(
    take(1),
    switchMap(role => {
      console.log('User role:', role, 'Checking access to:', state.url);
      
      if (!role) {
        console.log('No role found, denying access');
        return new Observable<UrlTree>(observer => {
          observer.next(router.parseUrl('/dashboard'));
          observer.complete();
        });
      }

      // Check if the user can access this route
      return navigationService.canAccessRoute(state.url, role).pipe(
        map(hasAccess => {
          if (hasAccess) {
            console.log('Access granted for role:', role);
            return true;
          } else {
            console.log('Access denied for role:', role, 'redirecting to dashboard');
            // Redirect to appropriate dashboard based on role
            if (role === 'admin' || role === 'superadmin') {
              return router.parseUrl('/dashboard/admin');
            } else if (role === 'accountant') {
              return router.parseUrl('/dashboard/transactions/bulk-upload');
            } else {
              return router.parseUrl('/dashboard/home');
            }
          }
        })
      );
    })
  );
};

