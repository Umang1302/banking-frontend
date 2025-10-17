import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

// Feature selector
export const selectUserState = createFeatureSelector<UserState>('user');

// Basic selectors
export const selectUser = createSelector(
  selectUserState,
  (state: UserState) => state.user
);

export const selectCustomer = createSelector(
  selectUser,
  (user) => user?.customer
);

export const selectCustomerNumber = createSelector(
  selectUser,
  (user) => user?.customer?.customerNumber
);

export const selectToken = createSelector(
  selectUserState,
  (state: UserState) => state.token
);

export const selectIsLoading = createSelector(
  selectUserState,
  (state: UserState) => state.isLoading
);

export const selectError = createSelector(
  selectUserState,
  (state: UserState) => state.error
);

export const selectUserInitials = createSelector(
  selectUser,
  (user) => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'NA';
  }
);

// Authentication status selector
export const selectIsAuthenticated = createSelector(
  selectUser,
  selectToken,
  (user, token) => !!(user && token)
);

// User full name selector
export const selectUserFullName = createSelector(
  selectUser,
  (user) => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (user.username) return user.username;
    return user.email || '';
  }
);

// User role selector
export const selectRole = createSelector(
  selectUser,
  (user) => user?.role || null
);
