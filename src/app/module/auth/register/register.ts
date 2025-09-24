import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../store/userStore/user.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private userService = inject(UserService);
  
  // Form fields
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  mobile = signal('');
  password = signal('');
  confirmPassword = signal('');
  acceptTerms = signal(false);
  isLoading = signal(false);
  
  // Validation signals
  firstNameError = signal('');
  lastNameError = signal('');
  emailError = signal('');
  mobileError = signal('');
  passwordError = signal('');
  confirmPasswordError = signal('');
  termsError = signal('');
  isFormTouched = signal(false);


  // Validation methods
  private validateName(name: string, fieldName: string): string {
    if (!name) return `${fieldName} is required`;
    if (name.length < 2) return `${fieldName} must be at least 2 characters`;
    return '';
  }

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

  private validatePassword(password: string): string {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 6 characters';
    // if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    // if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    // if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    // if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)';
    return '';
  }

  private validateConfirmPassword(confirmPassword: string): string {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== this.password()) return 'Passwords do not match';
    return '';
  }

  private validateTerms(accepted: boolean): string {
    if (!accepted) return 'You must accept the terms and conditions';
    return '';
  }

  // Password requirement checker methods
  hasLowercase(): boolean {
    return /[a-z]/.test(this.password());
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.password());
  }

  hasNumber(): boolean {
    return /\d/.test(this.password());
  }

  hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.password());
  }

  // Individual field validation methods
  validateFirstName(): void {
    this.firstNameError.set(this.validateName(this.firstName(), 'First name'));
  }

  validateLastName(): void {
    this.lastNameError.set(this.validateName(this.lastName(), 'Last name'));
  }

  validateEmailField(): void {
    this.emailError.set(this.validateEmail(this.email()));
  }

  validateMobileField(): void {
    this.mobileError.set(this.validateMobile(this.mobile()));
  }

  validatePasswordField(): void {
    this.passwordError.set(this.validatePassword(this.password()));
    // Also revalidate confirm password if it has been touched
    if (this.confirmPassword()) {
      this.confirmPasswordError.set(this.validateConfirmPassword(this.confirmPassword()));
    }
  }

  validateConfirmPasswordField(): void {
    this.confirmPasswordError.set(this.validateConfirmPassword(this.confirmPassword()));
  }

  validateTermsField(): void {
    this.termsError.set(this.validateTerms(this.acceptTerms()));
  }

  // Blur event handlers
  onFirstNameBlur(): void {
    this.isFormTouched.set(true);
    this.validateFirstName();
  }

  onLastNameBlur(): void {
    this.isFormTouched.set(true);
    this.validateLastName();
  }

  onEmailBlur(): void {
    this.isFormTouched.set(true);
    this.validateEmailField();
  }

  onMobileBlur(): void {
    this.isFormTouched.set(true);
    this.validateMobileField();
  }

  onPasswordBlur(): void {
    this.isFormTouched.set(true);
    this.validatePasswordField();
  }

  onConfirmPasswordBlur(): void {
    this.isFormTouched.set(true);
    this.validateConfirmPasswordField();
  }

  private validateForm(): boolean {
    this.validateFirstName();
    // Note: lastName field doesn't exist in the form, so skip validation
    this.validateEmailField();
    this.validateMobileField();
    this.validatePasswordField();
    this.validateConfirmPasswordField();
    this.validateTermsField();
    
    return !this.firstNameError() && !this.emailError() && 
           !this.mobileError() && !this.passwordError() && !this.confirmPasswordError() && 
           !this.termsError();
  }

  // Event handlers
  onFirstNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    console.log('🔤 First name changed to:', target.value);
    this.firstName.set(target.value);
    
    if (this.isFormTouched()) {
      this.validateFirstName();
    }
  }

  onLastNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.lastName.set(target.value);
    
    if (this.isFormTouched()) {
      this.validateLastName();
    }
  }

  onEmailChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.email.set(target.value);
    
    if (this.isFormTouched()) {
      this.validateEmailField();
    }
  }

  onMobileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.mobile.set(target.value);
    
    if (this.isFormTouched()) {
      this.validateMobileField();
    }
  }

  onPasswordChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.password.set(target.value);
    
    if (this.isFormTouched()) {
      this.validatePasswordField();
    }
  }

  onConfirmPasswordChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.confirmPassword.set(target.value);
    
    if (this.isFormTouched()) {
      this.validateConfirmPasswordField();
    }
  }

  onAcceptTermsChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.acceptTerms.set(target.checked);
    
    if (this.isFormTouched()) {
      this.validateTermsField();
    }
  }

  onSubmit() {
    console.log('Register button clicked!');
    
    if (this.isLoading()) {
      console.log('Already loading, skipping...');
      return;
    }
    
    // Mark form as touched to show validation errors
    this.isFormTouched.set(true);
    
    // Validate form before submission
    const isValid = this.validateForm();
    console.log('✅ Form validation result:', isValid);
    console.log('❌ Form errors:', {
      firstName: this.firstNameError(),
      email: this.emailError(),
      mobile: this.mobileError(),
      password: this.passwordError(),
      confirmPassword: this.confirmPasswordError(),
      terms: this.termsError()
    });
    
    if (!isValid) {
      console.log('❌ Form validation failed, not submitting');
      return;
    }
    
    // Set loading state
    this.isLoading.set(true);
    console.log('⏳ Set loading to true');
    
    const registrationData = {
      username: this.firstName(),
      email: this.email(),
      mobile: this.mobile(),
      password: this.password()
    };
    
    console.log('📝 Form field values:', {
      firstName: this.firstName(),
      email: this.email(),
      mobile: this.mobile(),
      password: this.password(),
      confirmPassword: this.confirmPassword(),
      acceptTerms: this.acceptTerms()
    });
    console.log('📝 Starting registration with data:', registrationData);
    
    try {
      this.userService.register(registrationData);
      console.log('✅ UserService.register() called successfully');
    } catch (error) {
      console.error('❌ Error calling UserService.register():', error);
      this.isLoading.set(false);
    }
  }
}
