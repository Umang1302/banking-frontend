import { createReducer, on } from '@ngrx/store';
import { userActions, User } from './user.action';

// User state interface
export interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
export const initialUserState: UserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// User reducer
export const userReducer = createReducer(
  initialUserState,
  
  // Authentication actions
  on(userActions.loginRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  
  on(userActions.loginSuccess, (state, { authResponse }) => ({
    ...state,
    user: authResponse.user,
    token: authResponse.token,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })),
  
  on(userActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    isAuthenticated: false,
  })),
  
  on(userActions.registerRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  
  on(userActions.registerSuccess, (state, { authResponse }) => ({
    ...state,
    user: authResponse.user,
    token: authResponse.token,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })),
  
  on(userActions.registerFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    isAuthenticated: false,
  })),

  on(userActions.logoutRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  
  on(userActions.logoutSuccess, (state) => ({
    ...state,
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  })),
  
  on(userActions.logoutFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    isAuthenticated: false,
  })),


  // Utility actions
  on(userActions.clearError, (state) => ({
    ...state,
    error: null,
  })),

  on(userActions.initializeUserState, (state) => {
    // In a real app, you might load from localStorage here
    // For now, just maintain current state
    return state;
  }),

  on(userActions.loadProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  
  on(userActions.loadProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    isLoading: false,
    error: null,
  })),

  on(userActions.loadProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Profile submission actions
  on(userActions.submitProfileForApproval, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(userActions.submitProfileSuccess, (state, { status }) => ({
    ...state,
    status,
    isLoading: false,
    error: null,
  })),

  on(userActions.submitProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Admin approval actions
  on(userActions.approveProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(userActions.approveProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    isLoading: false,
    error: null,
  })),

  on(userActions.approveProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(userActions.rejectProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(userActions.rejectProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    isLoading: false,
    error: null,
  })),

  on(userActions.rejectProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Submit profile actions
  on(userActions.submitProfileForApproval, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  
  on(userActions.submitProfileSuccess, (state, { status }) => ({
    ...state,
    status,
    isLoading: false,
    error: null,
  })),
  
  on(userActions.submitProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
);
