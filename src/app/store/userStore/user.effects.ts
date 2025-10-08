import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';
import { SessionService } from '../../services/session.service';
import { userActions, AuthResponse, UserStatus, UserRole } from './user.action';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private sessionService = inject(SessionService);

  // Login effect
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.loginRequest),
      exhaustMap(({ credentials }) =>
        this.apiService.post('auth/login', credentials).pipe(
          map((response: any) => {
            // Store token with expiry using SessionService
            this.sessionService.storeTokenWithExpiry(response.token, response.expiresIn);
            
            console.log("response", response);
            const authResponse: AuthResponse = {
              user: response.user || {
                id: response.userId || '',
                email: credentials.usernameOrEmailOrMobile,
                username: response.username || credentials.usernameOrEmailOrMobile,
                mobile: response.mobile || credentials.usernameOrEmailOrMobile,
                role: response.role.toLowerCase(),
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
            // Store token with expiry using SessionService
            this.sessionService.storeTokenWithExpiry(response.token, response.expiresIn);
            
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
        this.sessionService.clearSession();
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
        
        // Check if user is admin
        const userRole = user.roles?.[0]?.name || user.role;
        console.log("userRole", userRole);
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        const isAccountant = userRole === 'accountant';
        
        if (isAdmin) {
          // Redirect admin users to admin dashboard
          this.router.navigate(['/dashboard/admin']);
        } else if (isAccountant) {
          // Redirect accountant users directly to bulk-upload
          this.router.navigate(['/dashboard/transactions/bulk-upload']);
        } else if (!isProfileComplete) {
          // Redirect to profile page if incomplete
          this.router.navigate(['/dashboard/profile'], { 
            queryParams: { firstLogin: 'true' } 
          });
        } else {
          // Redirect to dashboard home if profile is complete
          this.router.navigate(['/dashboard/home']);
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
        
        // Check if user is admin
        const userRole = user.roles?.[0]?.name || user.role;
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        const isAccountant = userRole === 'accountant';
        
        if (isAdmin) {
          // Redirect admin users to admin dashboard
          this.router.navigate(['/dashboard/admin']);
        } else if (isAccountant) {
          // Redirect accountant users directly to bulk-upload
          this.router.navigate(['/dashboard/transactions/bulk-upload']);
        } else if (!isProfileComplete) {
          // Redirect to profile page for profile completion
          this.router.navigate(['/dashboard/profile'], { 
            queryParams: { firstLogin: 'true' } 
          });
        } else {
          // Redirect to dashboard home if profile is somehow already complete
          this.router.navigate(['/dashboard/home']);
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
            // Handle both direct customer response and nested user.customer response
            const customer = response.customer || response;
            
            const user = {
              id: response.userId?.toString() || response.id?.toString() || customer.customerId?.toString(),
              username: response.username || customer.firstName + customer.lastName,
              email: response.email || customer.email,
              mobile: response.mobile || customer.mobile,
              status: response.status || customer.status, // Keep original API status
              role: response.roles?.[0]?.name?.toLowerCase() || 'customer',
              // Include full customer data
              customer: customer,
              roles: response.roles || [],
              permissions: response.permissions || [],
              accounts: response.accounts || [],
              transactions: response.recentTransactions || [],
              // Extract fields from customer object for backward compatibility
              firstName: customer?.firstName,
              lastName: customer?.lastName,
              address: customer?.address,
              nationalId: customer?.nationalId,
              dateOfBirth: customer?.dateOfBirth,
              // Parse otherInfo if available
              ...(customer?.otherInfo ? (() => {
                try {
                  return JSON.parse(customer.otherInfo);
                } catch (e) {
                  console.warn('Failed to parse otherInfo:', e);
                  return {};
                }
              })() : {})
            };
            
            console.log('Normalized user object:', user);
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


  // Submit profile for approval effect
  submitProfileForApproval$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(userActions.submitProfileForApproval),
      exhaustMap(({ profileData }) => {
        // Transform form data to match API structure
        console.log("profileData", profileData);
        const apiPayload = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          address: profileData.address,
          nationalId: profileData.nationalId || '', // You might need to add this field to your form
          mobile: profileData.mobile,
          email: profileData.email,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString() : null,
          otherInfo: {
            occupation: profileData.occupation,
            salary: profileData.annualIncome,
            city: profileData.city,
            state: profileData.state,
            zipCode: profileData.zipCode,
            emergencyContactName: profileData.emergencyContactName,
            emergencyContactPhone: profileData.emergencyContactPhone,
            reason: profileData.reason // Include reason for updates
          }
        };

        console.log('Submitting profile data:', apiPayload);

        return this.apiService.post('users/customer-details', apiPayload, { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }).pipe(
          map((response: any) => {
            console.log('Profile submission API response:', response);
            
            return userActions.submitProfileSuccess({ status: response.userStatus });
          }),
          catchError((error) => {
            console.error('Profile submission error:', error);
            return of(userActions.submitProfileFailure({ 
              error: error.error?.message || error.message || 'Failed to submit profile for approval' 
            }));
          })
        );
      })
    );
  })

  // Submit profile success effect - automatically reload profile
  submitProfileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.submitProfileSuccess),
      tap(({ status }) => {
        console.log('Profile submitted successfully:', status);
      }),
      map(() => {
        // Automatically trigger profile reload after successful submission
        return userActions.loadProfile();
      })
    )
  );  

  // Submit profile failure effect
  submitProfileFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.submitProfileFailure),
      tap(({ error }) => {
        console.error('Profile submission failed:', error);
      })
    ),
    { dispatch: false }
  );

  // Session expired effect
  sessionExpired$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.sessionExpired),
      tap(() => {
        console.warn('Session has expired');
        this.sessionService.clearSession();
      }),
      map(() => userActions.logoutSuccess())
    )
  );

}
