import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

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
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      
      // Address Information
      address: [''],
      city: [''],
      state: [''],
      zipCode: ['', [Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      
      // Personal Information
      dateOfBirth: [''],
      occupation: [''],
      annualIncome: [null, [Validators.min(0)]],
      
      // Emergency Contact
      emergencyContactName: [''],
      emergencyContactPhone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      
      // Reason for update (required when submitting for approval)
      reason: ['', [Validators.required, Validators.minLength(10)]]
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
    if (isProfileCompletion) {
      // For profile completion, make more fields required
      this.profileForm.get('address')?.setValidators([Validators.required]);
      this.profileForm.get('city')?.setValidators([Validators.required]);
      this.profileForm.get('state')?.setValidators([Validators.required]);
      this.profileForm.get('dateOfBirth')?.setValidators([Validators.required]);
      this.profileForm.get('occupation')?.setValidators([Validators.required]);
    } else {
      // For profile updates, keep original validators
      this.profileForm.get('address')?.setValidators([]);
      this.profileForm.get('city')?.setValidators([]);
      this.profileForm.get('state')?.setValidators([]);
      this.profileForm.get('dateOfBirth')?.setValidators([]);
      this.profileForm.get('occupation')?.setValidators([]);
    }
    
    // Update form control validators
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.updateValueAndValidity();
    });
  }

  populateForm(user: User): void {
    // Parse additional info from customer.otherInfo if available
    let additionalInfo: any = {};
    if ((user as any).customer?.otherInfo) {
      try {
        additionalInfo = JSON.parse((user as any).customer.otherInfo);
      } catch (error) {
        console.warn('Failed to parse customer otherInfo:', error);
      }
    }

    // Only populate form if NOT in PENDING_DETAILS state
    if (this.currentUserStatus !== UserStatus.PENDING_DETAILS) {
      this.profileForm.patchValue({
        firstName: (user as any).customer?.firstName || user.firstName || '',
        lastName: (user as any).customer?.lastName || user.lastName || '',
        email: (user as any).customer?.email || user.email || '',
        mobile: (user as any).customer?.mobile || user.mobile || '',
        address: additionalInfo.streetAddress || user.address || '',
        city: additionalInfo.city || user.city || '',
        state: additionalInfo.state || user.state || '',
        zipCode: additionalInfo.zipCode || user.zipCode || '',
        dateOfBirth: user.dateOfBirth || '',
        occupation: additionalInfo.occupation || user.occupation || '',
        annualIncome: additionalInfo.annualIncome || user.annualIncome || null,
        emergencyContactName: additionalInfo.emergencyContactName || user.emergencyContactName || '',
        emergencyContactPhone: additionalInfo.emergencyContactPhone || user.emergencyContactPhone || ''
      });
    } else {
      // For PENDING_DETAILS, only populate basic fields that user might have from registration
      this.profileForm.patchValue({
        firstName: (user as any).customer?.firstName || user.firstName || '',
        lastName: (user as any).customer?.lastName || user.lastName || '',
        email: (user as any).customer?.email || user.email || '',
        mobile: (user as any).customer?.mobile || user.mobile || '',
        // Leave other fields empty for user to fill
        address: '',
        city: '',
        state: '',
        zipCode: '',
        dateOfBirth: '',
        occupation: '',
        annualIncome: null,
        emergencyContactName: '',
        emergencyContactPhone: ''
      });
    }
  }

  toggleEdit(): void {
    // Only allow toggle if user status is ACTIVE
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
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      
      const profileData = this.profileForm.value;
      
      // Use UserService to submit profile for approval
      this.userService.submitProfileForApproval(profileData);
      
      // Subscribe to the submission result
      this.userService.user$.subscribe(user => {
        if (user && this.isSubmitting) {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.isEditing = false;
          
          // Update current status
          this.currentUserStatus = user.status || UserStatus.PENDING_APPROVAL;
          
          // Reset success message after 5 seconds
          setTimeout(() => {
            this.submitSuccess = false;
          }, 5000);
        }
      });
      
      // Handle errors
      this.userService.error$.subscribe(error => {
        if (error && this.isSubmitting) {
          this.isSubmitting = false;
          console.error('Profile submission failed:', error);
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

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
