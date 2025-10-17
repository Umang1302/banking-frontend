import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { Beneficiary, IFSCValidationResponse } from '../../models/neft.models';

@Component({
  selector: 'app-beneficiary-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './beneficiary-form.component.html',
  styleUrls: ['./beneficiary-form.component.css']
})
export class BeneficiaryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private neftService = inject(NeftService);

  beneficiaryForm!: FormGroup;
  isEditMode = signal(false);
  beneficiaryId = signal<string | null>(null);
  currentStep = signal(1);
  
  loading = signal(false);
  submitting = signal(false);
  validatingIFSC = signal(false);
  
  ifscValidation = signal<IFSCValidationResponse | null>(null);
  showReviewModal = signal(false);
  showSuccessModal = signal(false);
  
  error = signal<string | null>(null);

  relationshipOptions = [
    'Family',
    'Friend',
    'Vendor/Supplier',
    'Service Provider',
    'Landlord',
    'Employee',
    'Other'
  ];

  ngOnInit() {
    this.initializeForm();
    
    // Check if in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.beneficiaryId.set(params['id']);
        this.loadBeneficiary(params['id']);
      }
    });
  }

  initializeForm() {
    this.beneficiaryForm = this.fb.group({
      // Step 1: Beneficiary Details
      beneficiaryName: ['', [Validators.required, Validators.minLength(3)]],
      accountNumber: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      confirmAccountNumber: ['', [Validators.required]],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      mobileNumber: ['', [Validators.pattern(/^[+]?[0-9]{10,15}$/)]],
      email: ['', [Validators.email]],
      
      // Step 2: Additional Information
      nickname: ['', [Validators.maxLength(50)]],
      relationship: [''],
      notes: ['', [Validators.maxLength(200)]]
    });

    // Watch for IFSC code changes
    this.beneficiaryForm.get('ifscCode')?.valueChanges.subscribe((value) => {
      if (value && value.length === 11) {
        this.validateIFSCCode(value);
      } else {
        this.ifscValidation.set(null);
      }
    });

    // Watch for account number changes
    this.beneficiaryForm.get('confirmAccountNumber')?.valueChanges.subscribe(() => {
      this.checkAccountNumberMatch();
    });
  }

  loadBeneficiary(id: string) {
    this.loading.set(true);
    // API 4: GET /api/eft/beneficiaries/{id} - Response: BeneficiaryResponse
    this.neftService.getBeneficiaryById(id).subscribe({
      next: (response) => {
        // Access the beneficiary data from response.data
        const beneficiary = response.data;
        this.beneficiaryForm.patchValue({
          beneficiaryName: beneficiary.beneficiaryName,
          accountNumber: beneficiary.accountNumber,
          confirmAccountNumber: beneficiary.accountNumber,
          ifscCode: beneficiary.ifscCode,
          mobileNumber: '', // Not in API response
          email: '', // Not in API response
          nickname: beneficiary.nickname || '',
          relationship: '', // Not in API response
          notes: '' // Not in API response
        });
        
        // Set IFSC validation - only fields from API response
        if (beneficiary.bankName) {
          this.ifscValidation.set({
            status: 'success',
            message: 'IFSC code is valid',
            ifscCode: beneficiary.ifscCode,
            bankCode: beneficiary.ifscCode.substring(0, 4),
            branchCode: beneficiary.ifscCode.substring(5),
            bankName: beneficiary.bankName,
            isValid: true
          });
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading beneficiary:', err);
        this.error.set('Failed to load beneficiary details');
        this.loading.set(false);
      }
    });
  }

  validateIFSCCode(ifscCode: string) {
    this.validatingIFSC.set(true);
    this.neftService.validateIFSC(ifscCode.toUpperCase()).subscribe({
      next: (response) => {
        this.ifscValidation.set(response);
        this.validatingIFSC.set(false);
      },
      error: (err) => {
        console.error('IFSC validation error:', err);
        // API 7 error response structure
        this.ifscValidation.set({
          status: 'error',
          message: err.error?.message || 'Invalid IFSC code',
          ifscCode: ifscCode,
          bankCode: '',
          branchCode: '',
          bankName: '',
          isValid: false
        });
        this.validatingIFSC.set(false);
      }
    });
  }

  checkAccountNumberMatch(): boolean {
    const accountNumber = this.beneficiaryForm.get('accountNumber')?.value;
    const confirmAccountNumber = this.beneficiaryForm.get('confirmAccountNumber')?.value;
    return accountNumber === confirmAccountNumber;
  }

  get step1Valid(): boolean {
    const nameValid = this.beneficiaryForm.get('beneficiaryName')?.valid || false;
    const accountValid = this.beneficiaryForm.get('accountNumber')?.valid || false;
    const accountMatch = this.checkAccountNumberMatch();
    const ifscValid = this.ifscValidation()?.isValid || false;
    
    // Mobile and email are optional but must be valid if filled
    const mobileControl = this.beneficiaryForm.get('mobileNumber');
    const emailControl = this.beneficiaryForm.get('email');
    const mobileValid = !mobileControl?.value?.trim() || mobileControl?.valid;
    const emailValid = !emailControl?.value?.trim() || emailControl?.valid;
    
    return nameValid && accountValid && accountMatch && ifscValid && mobileValid && emailValid;
  }

  get step2Valid(): boolean {
    // Step 2 fields (nickname, relationship, notes) are all optional
    // They're valid as long as they don't exceed max length
    const nicknameControl = this.beneficiaryForm.get('nickname');
    const relationshipControl = this.beneficiaryForm.get('relationship');
    const notesControl = this.beneficiaryForm.get('notes');
    
    // Check if each field is valid (validators will pass for empty values)
    const nicknameValid = nicknameControl?.valid !== false;
    const relationshipValid = relationshipControl?.valid !== false;
    const notesValid = notesControl?.valid !== false;
    
    return nicknameValid && relationshipValid && notesValid;
  }

  nextStep() {
    if (this.currentStep() === 1 && this.step1Valid) {
      this.currentStep.set(2);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  openReviewModal() {
    if (this.step1Valid && this.step2Valid) {
      this.showReviewModal.set(true);
    }
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
  }

  submitForm() {
    if (!this.step1Valid || !this.step2Valid) return;

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.beneficiaryForm.value;
    // API 1 (POST) / API 5 (PUT) - Request body fields including email and mobile
    const beneficiaryData: Partial<Beneficiary> = {
      beneficiaryName: formValue.beneficiaryName,
      accountNumber: formValue.accountNumber,
      ifscCode: formValue.ifscCode.toUpperCase(),
      bankName: this.ifscValidation()?.bankName || '',
      branchName: '', // Not captured in form
      accountType: 'SAVINGS', // Default value
      nickname: formValue.nickname || undefined,
      email: formValue.email || undefined, // Optional email field
      mobile: formValue.mobileNumber || undefined, // Optional mobile field (form field is mobileNumber, API expects mobile)
      status: 'ACTIVE'
    };

    const request = this.isEditMode()
      ? this.neftService.updateBeneficiary(this.beneficiaryId()!, beneficiaryData)
      : this.neftService.addBeneficiary(beneficiaryData);

    request.subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.closeReviewModal();
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error saving beneficiary:', err);
        this.error.set(err.error?.message || 'Failed to save beneficiary. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  navigateToBeneficiaries() {
    this.router.navigate(['/dashboard/neft/beneficiaries']);
  }

  navigateToTransfer() {
    this.router.navigate(['/dashboard/neft/transfer']);
  }

  cancelForm() {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.navigateToBeneficiaries();
    }
  }
}

