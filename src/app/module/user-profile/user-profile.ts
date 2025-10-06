import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from '../../store/userStore/user.service';
import { User, UserStatus, UserRole } from '../../store/userStore/user.action';

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  nationalId?: string;
  dateOfBirth?: string;
  occupation?: string;
  annualIncome?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  reason?: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  userService = inject(UserService);

  user$ = this.userService.user$;
  isLoading$ = this.userService.isLoading$;
  error$ = this.userService.error$;

  profileForm: FormGroup;
  isEditing = false;
  isSubmitting = false;
  submitSuccess = false;
  isFirstLogin = false;
  
  // Status-based properties
  UserStatus = UserStatus; // Make enum available in template
  UserRole = UserRole; // Make enum available in template
  currentUserStatus: UserStatus | string = UserStatus.PENDING_DETAILS;
  currentUserRole: UserRole | string = UserRole.USER;

  constructor() {
    this.profileForm = this.fb.group({
      // Basic Information
      firstName: [''],
      lastName: [''],
      email: [''],
      mobile: [''],
      
      // Address Information
      address: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      
      // National ID (required by API)
      nationalId: [''],
      
      // Personal Information
      dateOfBirth: [''],
      occupation: [''],
      annualIncome: [null],
      
      // Emergency Contact
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      
      // Reason for update (only required when editing active profile)
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.userService.loadProfile();
    
    // Check if this is first login
    this.route.queryParams.subscribe(params => {
      this.isFirstLogin = params['firstLogin'] === 'true';
    });
    
    // Subscribe to user data and populate form
    this.user$.subscribe(user => {
      if (user) {
        console.log("MADE CHANGES");
        // Map API status to our enum values
        this.currentUserStatus = this.mapApiStatusToEnum(user.status) || UserStatus.PENDING_DETAILS;
        this.currentUserRole = this.mapApiRoleToEnum(user) || UserRole.USER;
        
        // Determine if user should be in editing mode based on status
        this.determineEditingState(user);
        
        this.populateForm(user);
      }
    });
  }

  // Map API status values to our enum values
  private mapApiStatusToEnum(apiStatus?: string): UserStatus {
    switch (apiStatus) {
      case 'PENDING_REVIEW':
        return UserStatus.PENDING_APPROVAL;
      case 'ACTIVE':
        return UserStatus.ACTIVE;
      case 'REJECTED':
        return UserStatus.REJECTED;
      case 'PENDING_DETAILS':
        return UserStatus.PENDING_DETAILS;
      default:
        return UserStatus.PENDING_DETAILS;
    }
  }

  // Map API role to our enum values
  private mapApiRoleToEnum(user: any): UserRole {
    // Check roles array first
    if (user.roles && user.roles.length > 0) {
      const roleName = user.roles[0].name;
      switch (roleName) {
        case 'CUSTOMER':
          return UserRole.CUSTOMER;
        case 'ADMIN':
          return UserRole.ADMIN;
        case 'USER':
          return UserRole.USER;
        default:
          return UserRole.USER;
      }
    }
    
    // Fallback to role field
    if (user.role) {
      switch (user.role.toUpperCase()) {
        case 'CUSTOMER':
          return UserRole.CUSTOMER;
        case 'ADMIN':
          return UserRole.ADMIN;
        case 'USER':
          return UserRole.USER;
        default:
          return UserRole.USER;
      }
    }
    
    return UserRole.USER;
  }

  determineEditingState(user: User): void {
    // Use the mapped status instead of the raw API status
    switch (this.currentUserStatus) {
      case UserStatus.PENDING_DETAILS:
        this.isEditing = true; // Always in editing mode for profile completion
        this.updateFormValidators(true); // All required fields mandatory
        break;
      case UserStatus.PENDING_APPROVAL:
        this.isEditing = false; // Read-only while waiting for approval
        break;
      case UserStatus.ACTIVE:
        this.isEditing = false; // Read-only by default, can be toggled
        this.updateFormValidators(false); // Reason required only for updates
        break;
      case UserStatus.REJECTED:
        this.isEditing = true; // Allow editing to resubmit
        this.updateFormValidators(true); // All required fields mandatory
        break;
      default:
        this.isEditing = false;
    }
  }

  updateFormValidators(isProfileCompletion: boolean): void {
    // Always set basic field validators
    this.profileForm.get('firstName')?.setValidators([Validators.required]);
    this.profileForm.get('lastName')?.setValidators([Validators.required]);
    this.profileForm.get('email')?.setValidators([Validators.required, Validators.email]);
    this.profileForm.get('mobile')?.setValidators([Validators.required]);
    
    if (isProfileCompletion) {
      // For profile completion, make more fields required
      this.profileForm.get('address')?.setValidators([Validators.required]);
      this.profileForm.get('city')?.setValidators([Validators.required]);
      this.profileForm.get('state')?.setValidators([Validators.required]);
      this.profileForm.get('dateOfBirth')?.setValidators([Validators.required]);
      this.profileForm.get('occupation')?.setValidators([Validators.required]);
      this.profileForm.get('nationalId')?.setValidators([Validators.required]);
      this.profileForm.get('reason')?.setValidators([]); // Not required for profile completion
    } else {
      // For profile updates, make fewer fields required
      this.profileForm.get('address')?.setValidators([]);
      this.profileForm.get('city')?.setValidators([]);
      this.profileForm.get('state')?.setValidators([]);
      this.profileForm.get('dateOfBirth')?.setValidators([]);
      this.profileForm.get('occupation')?.setValidators([]);
      this.profileForm.get('reason')?.setValidators([Validators.minLength(10)]); // Required for updates
    }
    
    // Update form control validators
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.updateValueAndValidity();
    });
  }

  populateForm(user: User): void {
    console.log('Populating form with user data:', user);
    
    // Parse additional info from customer.otherInfo if available
    let additionalInfo: any = {};
    if ((user as any).customer?.otherInfo) {
      try {
        additionalInfo = JSON.parse((user as any).customer.otherInfo);
        console.log('Parsed otherInfo:', additionalInfo);
      } catch (error) {
        console.warn('Failed to parse customer otherInfo:', error);
      }
    }

    // Always populate all available data, regardless of status
    const customer = (user as any).customer;
    
    this.profileForm.patchValue({
      // Basic Information - prioritize customer data over user data
      firstName: customer?.firstName || user.firstName || '',
      lastName: customer?.lastName || user.lastName || '',
      email: customer?.email || user.email || '',
      mobile: customer?.mobile || user.mobile || '',
      
      // Address Information - from customer object and otherInfo
      address: customer?.address || additionalInfo.streetAddress || user.address || '',
      city: additionalInfo.city || user.city || '',
      state: additionalInfo.state || user.state || '',
      zipCode: additionalInfo.zipCode || user.zipCode || '',
      nationalId: customer?.nationalId || '',
      
      // Personal Information - from otherInfo and user object
      dateOfBirth: this.formatDateForInput(customer?.dateOfBirth || user.dateOfBirth || ''),
      occupation: additionalInfo.occupation || user.occupation || '',
      annualIncome: additionalInfo.salary || additionalInfo.annualIncome || user.annualIncome || null,
      
      // Emergency Contact - from otherInfo
      emergencyContactName: additionalInfo.emergencyContactName || user.emergencyContactName || '',
      emergencyContactPhone: additionalInfo.emergencyContactPhone || user.emergencyContactPhone || '',
      
      // Reason - from otherInfo (for updates)
      reason: additionalInfo.reason || ''
    });

    console.log('Form populated with values:', this.profileForm.value);
  }

  toggleEdit(): void {
    if (this.currentUserStatus === UserStatus.ACTIVE) {
      this.isEditing = !this.isEditing;
      this.submitSuccess = false;
      
      if (!this.isEditing) {
        // Reset form when canceling edit
        this.user$.subscribe(user => {
          if (user) {
            this.populateForm(user);
          }
        });
      } else {
        // When starting to edit, update validators for profile update
        this.updateFormValidators(false);
      }
    }
  }

  onSubmit(): void {
    // Debug: Log form validation status
    console.log('Form valid:', this.profileForm.valid);
    console.log('Form errors:', this.getFormErrors());
    console.log('Current user status:', this.currentUserStatus);
    
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      
      const profileData = this.profileForm.value;
      
      // Submit the profile for approval
      this.userService.submitProfileForApproval(profileData);
      
      // Subscribe to success/error states
      this.userService.error$.subscribe(error => {
        if (error && this.isSubmitting) {
          this.isSubmitting = false;
          console.error('Profile submission failed:', error);
        }
      });
      
      // The profile will be automatically reloaded by the effect
      // So we just need to handle the UI state changes
      this.userService.user$.subscribe(user => {
        if (user && this.isSubmitting) {
          // Check if the status has changed (indicating successful submission)
          const newStatus = this.mapApiStatusToEnum(user.status);
          
          if (newStatus !== this.currentUserStatus || newStatus === UserStatus.PENDING_APPROVAL) {
            this.isSubmitting = false;
            this.submitSuccess = true;
            this.isEditing = false;
            
            // Update current status and re-determine editing state
            this.currentUserStatus = newStatus;
            this.determineEditingState(user);
            
            // Reset success message after 5 seconds
            setTimeout(() => {
              this.submitSuccess = false;
            }, 5000);
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['pattern']) return `Please enter a valid ${this.getFieldLabel(fieldName).toLowerCase()}`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be greater than 0`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      mobile: 'Mobile Number',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      nationalId: 'National ID',
      dateOfBirth: 'Date of Birth',
      occupation: 'Occupation',
      annualIncome: 'Annual Income',
      emergencyContactName: 'Emergency Contact Name',
      emergencyContactPhone: 'Emergency Contact Phone',
      reason: 'Reason for Update'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldRequired(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return field?.hasError('required') || false;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Status checking helper methods
  isPendingDetails(): boolean {
    return this.currentUserStatus === UserStatus.PENDING_DETAILS;
  }

  isPendingApproval(): boolean {
    return this.currentUserStatus === UserStatus.PENDING_APPROVAL;
  }

  isActive(): boolean {
    return this.currentUserStatus === UserStatus.ACTIVE;
  }

  isRejected(): boolean {
    return this.currentUserStatus === UserStatus.REJECTED;
  }

  canEdit(): boolean {
    return this.currentUserStatus === UserStatus.PENDING_DETAILS || 
           this.currentUserStatus === UserStatus.REJECTED ||
           (this.currentUserStatus === UserStatus.ACTIVE && this.isEditing);
  }

  shouldShowEditButton(): boolean {
    return this.currentUserStatus === UserStatus.ACTIVE && !this.isEditing;
  }

  shouldShowCancelButton(): boolean {
    return this.currentUserStatus === UserStatus.ACTIVE && this.isEditing;
  }

  getStatusMessage(): string {
    switch (this.currentUserStatus) {
      case UserStatus.PENDING_DETAILS:
        return 'Please complete your profile information to proceed.';
      case UserStatus.PENDING_APPROVAL:
        return 'Your profile is under review. You will be notified once approved.';
      case UserStatus.ACTIVE:
        return 'Your profile is active and approved.';
      case UserStatus.REJECTED:
        return 'Your profile was rejected. Please update the required information and resubmit.';
      default:
        return '';
    }
  }

  getSubmitButtonText(): string {
    if (this.currentUserStatus === UserStatus.PENDING_DETAILS || this.currentUserStatus === UserStatus.REJECTED) {
      return 'Submit for Approval';
    } else {
      return 'Submit Update Request';
    }
  }

  // Debug helper method
  getFormErrors(): any {
    const formErrors: any = {};
    Object.keys(this.profileForm.controls).forEach(key => {
      const controlErrors = this.profileForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }

  // Helper method to format date for HTML date input (YYYY-MM-DD format)
  private formatDateForInput(dateValue: string): string {
    if (!dateValue) return '';
    
    try {
      // Handle ISO string format like "1985-05-15T00:00:00"
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DD for HTML date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return '';
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }
}
