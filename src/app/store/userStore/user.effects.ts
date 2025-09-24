import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { userActions, AuthResponse, UserStatus, UserRole } from './user.action';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Login effect
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.loginRequest),
      exhaustMap(({ credentials }) =>
        this.apiService.post('auth/login', credentials).pipe(
          map((response: any) => {
            // Store token in localStorage
            localStorage.setItem('token', response.token);
            const authResponse: AuthResponse = {
              user: response.user || {
                id: response.userId || '',
                email: credentials.usernameOrEmailOrMobile,
                username: response.username || credentials.usernameOrEmailOrMobile,
                mobile: response.mobile || credentials.usernameOrEmailOrMobile,
                role: response.roles?.[0]?.name?.toLowerCase() || UserRole.USER.toLowerCase(),
                status: response.status || UserStatus.PENDING_DETAILS,
              },
              token: response.token,
              expiresIn: response.expiresIn
            };
            
            return userActions.loginSuccess({ authResponse });
          }),
          catchError((error) =>
            of(userActions.loginFailure({ 
              error: error.message || 'Login failed' 
            }))
          )
        )
      )
    )
  );

  // Register effect
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.registerRequest),
      exhaustMap(({ userData }) => {
        return this.apiService.post('auth/register', userData).pipe(
          map((response: any) => {
            console.log('Register API response:', response);
            // Store token in localStorage
            localStorage.setItem('token', response.token);
            
            const authResponse: AuthResponse = {
              user: response.user || {
                id: response.userId || response.id || 'temp-id',
                email: userData.email,
                username: userData.username,
                mobile: userData.mobile,
                firstName: userData.username,
                role: UserRole.USER.toLowerCase(),
                status: UserStatus.PENDING_DETAILS,
              },
              token: response.token,
              expiresIn: response.expiresIn
            };
            
            console.log('Registration successful, dispatching success action');
            return userActions.registerSuccess({ authResponse });
          }),
          catchError((error) => {
            console.error('Registration failed:', error);
            return of(userActions.registerFailure({ 
              error: error.message || 'Registration failed' 
            }));
          })
        );
      })
    )
  );

  // Logout effect
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.logoutRequest),
      map(() => {
        localStorage.removeItem('token');
        console.log("Logout success");
        return userActions.logoutSuccess();
      }),
      catchError((error) =>
        of(userActions.logoutFailure({ 
          error: error.message || 'Logout failed' 
        }))
      )
    )
  );

  // Login success redirection effect
  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.loginSuccess),
      tap(({ authResponse }) => {
        // Check if profile is complete
        const user = authResponse.user;
        const isProfileComplete = this.isProfileComplete(user);
        
        if (!isProfileComplete) {
          // Redirect to profile page if incomplete
          this.router.navigate(['/profile'], { 
            queryParams: { firstLogin: 'true' } 
          });
        } else {
          // Redirect to dashboard if profile is complete
          this.router.navigate(['/dashboard']);
        }
      })
    ),
    { dispatch: false }
  );

  // Helper method to check if profile is complete
  private isProfileComplete(user: any): boolean {
    // If user has a status, use it to determine if profile is complete
    if (user.status) {
      // Profile is complete if status is ACTIVE or PENDING_REVIEW (which maps to PENDING_APPROVAL)
      return user.status === UserStatus.ACTIVE || user.status === 'ACTIVE' || user.status === 'PENDING_REVIEW';
    }
    
    // Fallback to field-based check for backward compatibility
    const requiredFields = ['firstName', 'lastName', 'email', 'mobile'];
    return requiredFields.every(field => user[field] && user[field].trim() !== '');
  }

  // Register success redirection effect
  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.registerSuccess),
      tap(({ authResponse }) => {
        // Check if profile is complete (same logic as login)
        const user = authResponse.user;
        const isProfileComplete = this.isProfileComplete(user);
        
        if (!isProfileComplete) {
          // Redirect to profile page for profile completion
          this.router.navigate(['/profile'], { 
            queryParams: { firstLogin: 'true' } 
          });
        } else {
          // Redirect to dashboard if profile is somehow already complete
          this.router.navigate(['/dashboard']);
        }
      })
    ),
    { dispatch: false }
  );

  // Logout success redirection effect
  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.logoutSuccess),
      tap(() => {
        this.router.navigate(['/login']);
      })
    ),
    { dispatch: false }
  );


  // Load profile effect
  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.loadProfile),
      exhaustMap(() => {
        return this.apiService.get('users/profile', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).pipe(
          map((response: any) => {
            console.log('Load profile API response:', response);
            
            // Create a normalized user object from the API response
            const user = {
              id: response.userId?.toString() || response.id?.toString(),
              username: response.username,
              email: response.email,
              mobile: response.mobile,
              status: response.status, // Keep original API status
              role: response.roles?.[0]?.name?.toLowerCase() || 'user',
              // Include customer data if available
              customer: response.customer,
              roles: response.roles,
              permissions: response.permissions,
              accounts: response.accounts,
              // Extract fields from customer object
              firstName: response.customer?.firstName,
              lastName: response.customer?.lastName,
              address: response.customer?.address,
              // Parse otherInfo if available
              ...(response.customer?.otherInfo ? (() => {
                try {
                  return JSON.parse(response.customer.otherInfo);
                } catch (e) {
                  return {};
                }
              })() : {})
            };
            
            return userActions.loadProfileSuccess({ user });
          }),
          catchError((error) => {
            return of(userActions.loadProfileFailure({ 
              error: error.message || 'Failed to load profile' 
            }));
          })
        );
      })
    )
  );

}
