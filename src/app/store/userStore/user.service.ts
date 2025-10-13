import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { userActions, User, AuthResponse } from './user.action';
import { UserState } from './user.reducer';
import {
  selectUser,
  selectToken,
  selectIsLoading,
  selectError,
  selectUserInitials,
  selectIsAuthenticated,
  selectUserFullName,
  selectRole,
  selectCustomer,
  selectCustomerNumber
} from './user.selectors';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private store = inject(Store<{ user: UserState }>);

  // Selectors as observables
  user$ = this.store.select(selectUser);
  token$ = this.store.select(selectToken);
  isLoading$ = this.store.select(selectIsLoading);
  error$ = this.store.select(selectError);
  userInitials$ = this.store.select(selectUserInitials);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  userFullName$ = this.store.select(selectUserFullName);
  role$ = this.store.select(selectRole);
  customer$ = this.store.select(selectCustomer);
  customerId$ = this.store.select(selectCustomerNumber);

  // Authentication methods
  login(credentials: { usernameOrEmailOrMobile: string; password: string }): void {
    this.store.dispatch(userActions.loginRequest({ credentials }));
  }

  register(userData: { username: string; email: string; mobile: string; password: string }): void {
    this.store.dispatch(userActions.registerRequest({ userData }));
  }

  logout(): void {
    this.store.dispatch(userActions.logoutRequest());
  }


  // Initialize user state from localStorage or check auth status
  initializeUserState(): void {
    this.store.dispatch(userActions.initializeUserState());
  }

  loadProfile(): void {
    this.store.dispatch(userActions.loadProfile());
  }

  // Profile completion methods
  submitProfileForApproval(profileData: any): void {
    this.store.dispatch(userActions.submitProfileForApproval({ profileData }));
  }

  // Admin methods
  approveProfile(userId: string): void {
    this.store.dispatch(userActions.approveProfile({ userId }));
  }

  rejectProfile(userId: string, reason: string): void {
    this.store.dispatch(userActions.rejectProfile({ userId, reason }));
  }

  getUserRole(): Observable<string | null> {
    return this.role$;
  }

  // Clear any error state
  clearError(): void {
    this.store.dispatch(userActions.clearError());
  }

}
