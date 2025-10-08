import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../store/userStore/user.service';


@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  username = signal('');
  password = signal('');
  rememberMe = signal(false);
  isLoading = signal(false);
  loginType = signal<'email' | 'mobile'>('email');
  
  // Validation signals
  usernameError = signal('');
  passwordError = signal('');
  isFormTouched = signal(false);
  
  // Session expiry message
  sessionExpiredMessage = signal('');

  constructor() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Use setTimeout to ensure router is ready
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 0);
    }
    
    // Check if session expired query parameter is present
    this.route.queryParams.subscribe(params => {
      if (params['sessionExpired'] === 'true') {
        this.sessionExpiredMessage.set('Your session has expired. Please login again.');
        // Clear the query parameter after a delay
        setTimeout(() => {
          this.sessionExpiredMessage.set('');
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }, 5000);
      }
    });
  }


  // Validation methods
  private validateEmail(email: string): string {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  }

  private validateMobile(mobile: string): string {
    if (!mobile) return 'Mobile number is required';
    // Remove all non-digit characters for validation
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) return 'Mobile number must be at least 10 digits';
    if (cleanMobile.length > 15) return 'Mobile number must be less than 16 digits';
    // Basic mobile number pattern (starts with digit, allows common formats)
    const mobileRegex = /^[\+]?[1-9][\d]{9,14}$/;
    if (!mobileRegex.test(mobile.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid mobile number';
    }
    return '';
  }

  validatePassword(password: string): string {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

  validateUsername(): void {
    const username = this.username();
    const loginType = this.loginType();
    
    if (loginType === 'email') {
      this.usernameError.set(this.validateEmail(username));
    } else {
      this.usernameError.set(this.validateMobile(username));
    }
  }

  // Blur event handlers
  onUsernameBlur(): void {
    this.isFormTouched.set(true);
    this.validateUsername();
  }

  onPasswordBlur(): void {
    this.isFormTouched.set(true);
    this.passwordError.set(this.validatePassword(this.password()));
  }

  private validateForm(): boolean {
    this.validateUsername();
    this.passwordError.set(this.validatePassword(this.password()));
    
    return !this.usernameError() && !this.passwordError();
  }

  // Event handlers
  onUsernameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.username.set(target.value);
    
    // Validate on change if form has been touched
    if (this.isFormTouched()) {
      this.validateUsername();
    }
  }

  onPasswordChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.password.set(target.value);
    
    // Validate on change if form has been touched
    if (this.isFormTouched()) {
      this.passwordError.set(this.validatePassword(target.value));
    }
  }

  onRememberMeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.rememberMe.set(target.checked);
  }

  onLoginTypeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const loginType = target.checked ? 'mobile' : 'email';
    this.loginType.set(loginType);
    // Clear username and its error when switching login types
    this.username.set('');
    this.usernameError.set('');
  }

  onSubmit() {
    if (this.isLoading()) return;
    
    // Mark form as touched to show validation errors
    this.isFormTouched.set(true);
    
    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }
    
    // Use the user service to handle login
    // Redirection will be handled by the effects after successful login
    this.userService.login({
      usernameOrEmailOrMobile: this.username(),
      password: this.password()
    });
  }
}