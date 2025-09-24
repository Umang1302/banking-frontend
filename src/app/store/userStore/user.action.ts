import { createActionGroup, props, emptyProps } from "@ngrx/store";

// User status enum for the 4-phase flow
export enum UserStatus {
  PENDING_DETAILS = 'PENDING_DETAILS',
  PENDING_APPROVAL = 'PENDING_APPROVAL', 
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

// User role enum
export enum UserRole {
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

// User interface for type safety
export interface User {
  id?: string;
  username: string;
  email: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole | string;
  status?: UserStatus | string;
  // Additional profile fields
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  occupation?: string;
  annualIncome?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Profile completion tracking
  profileCompletedAt?: string;
  profileApprovedAt?: string;
  profileRejectedAt?: string;
  rejectionReason?: string;
}

// Authentication response interface
export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: number;
}

// User actions for comprehensive state management
export const userActions = createActionGroup({
    source: 'User',
    events: {
        // Authentication actions
        'Login Request': props<{ credentials: { usernameOrEmailOrMobile: string; password: string } }>(),
        'Login Success': props<{ authResponse: AuthResponse }>(),
        'Login Failure': props<{ error: string }>(),
        
        'Register Request': props<{ userData: { username: string; email: string; mobile: string; password: string } }>(),
        'Register Success': props<{ authResponse: AuthResponse }>(),
        'Register Failure': props<{ error: string }>(),

        'Logout Request': emptyProps(),
        'Logout Success': emptyProps(),
        'Logout Failure': props<{ error: string }>(),

        'Load Profile': emptyProps(),
        'Load Profile Success': props<{ user: User }>(),
        'Load Profile Failure': props<{ error: string }>(),

        // Profile completion actions
        'Submit Profile For Approval': props<{ profileData: any }>(),
        'Submit Profile Success': props<{ user: User }>(),
        'Submit Profile Failure': props<{ error: string }>(),

        // Admin approval actions
        'Approve Profile': props<{ userId: string }>(),
        'Approve Profile Success': props<{ user: User }>(),
        'Approve Profile Failure': props<{ error: string }>(),

        'Reject Profile': props<{ userId: string; reason: string }>(),
        'Reject Profile Success': props<{ user: User }>(),
        'Reject Profile Failure': props<{ error: string }>(),

        // Utility actions
        'Clear Error': emptyProps(),
        'Initialize User State': emptyProps(),
    }
});