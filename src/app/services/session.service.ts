import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { interval, Subscription } from 'rxjs';
import { userActions } from '../store/userStore/user.action';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private router = inject(Router);
  private store = inject(Store);
  private sessionCheckInterval?: Subscription;
  private readonly CHECK_INTERVAL = 10000; // Check every minute

  /**
   * Initialize session monitoring
   * This should be called when the app starts
   */
  initializeSessionMonitoring(): void {
    // Clear any existing monitoring
    this.stopSessionMonitoring();

    // Start checking session expiry periodically
    this.sessionCheckInterval = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkSessionExpiry();
    });

    // Also check immediately on initialization
    this.checkSessionExpiry();
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      this.sessionCheckInterval.unsubscribe();
      this.sessionCheckInterval = undefined;
    }
  }

  /**
   * Check if the current session has expired
   */
  checkSessionExpiry(): void {
    const token = localStorage.getItem('token');
    const expiryTime = localStorage.getItem('tokenExpiry');

    if (!token) {
      // No token means user is not logged in, no action needed
      return;
    }

    if (expiryTime) {
      const currentTime = Date.now();
      const expiry = parseInt(expiryTime, 10);

      if (currentTime >= expiry) {
        // Session has expired
        console.warn('Session has expired. Logging out...');
        this.handleSessionExpiry();
      }
    }
  }

  /**
   * Handle session expiry by logging out the user
   */
  private handleSessionExpiry(): void {
    // Dispatch session expired action
    this.store.dispatch(userActions.sessionExpired());
    
    // Clear all session data
    this.clearSession();
    
    // Navigate to login with a message
    this.router.navigate(['/login'], {
      queryParams: { sessionExpired: 'true' }
    });
  }

  /**
   * Store token and its expiry time
   */
  storeTokenWithExpiry(token: string, expiresIn?: number): void {
    localStorage.setItem('token', token);
    
    if (expiresIn) {
      const expiryTime = Date.now() + (expiresIn);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    const expiryTime = localStorage.getItem('tokenExpiry');

    if (!token) {
      return true;
    }

    if (!expiryTime) {
      // If no expiry time is set, assume token is valid
      // This handles backward compatibility
      return false;
    }

    const currentTime = Date.now();
    const expiry = parseInt(expiryTime, 10);

    return currentTime >= expiry;
  }

  /**
   * Get remaining session time in seconds
   */
  getRemainingSessionTime(): number {
    const expiryTime = localStorage.getItem('tokenExpiry');

    if (!expiryTime) {
      return -1; // Unknown expiry
    }

    const currentTime = Date.now();
    const expiry = parseInt(expiryTime, 10);
    const remaining = Math.max(0, expiry - currentTime);

    return Math.floor(remaining / 1000); // Convert to seconds
  }

  /**
   * Clear all session data
   */
  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
  }

  /**
   * Check if user is authenticated and session is valid
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !this.isTokenExpired();
  }
}

