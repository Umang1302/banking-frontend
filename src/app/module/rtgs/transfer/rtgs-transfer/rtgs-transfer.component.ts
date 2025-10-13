import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RtgsService } from '../../services/rtgs.service';
import { Account, Beneficiary, RTGSCharges, RTGSTransferRequest, RTGS_CONSTANTS } from '../../models/rtgs.models';

@Component({
  selector: 'app-rtgs-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rtgs-transfer.component.html',
  styleUrls: ['./rtgs-transfer.component.css']
})
export class RtgsTransferComponent implements OnInit {
  private rtgsService = inject(RtgsService);
  private router = inject(Router);

  // Wizard state
  currentStep = signal(1);
  totalSteps = 5;

  // Data
  accounts = signal<Account[]>([]);
  beneficiaries = signal<Beneficiary[]>([]);
  filteredBeneficiaries = signal<Beneficiary[]>([]);
  
  // Selected values
  selectedAccount = signal<Account | null>(null);
  selectedBeneficiary = signal<Beneficiary | null>(null);
  transferAmount = signal<number>(0);
  purpose = signal('');
  customPurpose = signal('');
  remarks = signal('');
  
  // Charges
  charges = signal<RTGSCharges | null>(null);
  
  // UI state
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  termsAccepted = signal(false);
  transferResponse = signal<any>(null);
  
  // RTGS specific
  rtgsAvailability = signal<{ available: boolean; message?: string }>({ available: true });
  
  // Constants
  readonly MIN_AMOUNT = RTGS_CONSTANTS.MIN_AMOUNT;
  readonly MAX_AMOUNT = RTGS_CONSTANTS.MAX_AMOUNT;

  purposeOptions = [
    'Business Payment',
    'Invoice Payment',
    'Vendor Payment',
    'Property Payment',
    'Investment',
    'Loan Repayment',
    'Large Transfer',
    'Other'
  ];

  quickAmounts = [200000, 500000, 1000000, 5000000]; // RTGS amounts (2L, 5L, 10L, 50L)

  ngOnInit() {
    this.checkRTGSAvailability();
    const navigation = this.router.getCurrentNavigation();
    const beneficiaryId = navigation?.extras?.state?.['beneficiaryId'];

    this.loadAccounts();
    this.loadBeneficiaries(beneficiaryId);
  }

  checkRTGSAvailability() {
    const availability = this.rtgsService.isRTGSAvailable();
    this.rtgsAvailability.set(availability);
    if (!availability.available) {
      this.error.set(availability.message || 'RTGS is not available');
    }
  }

  loadAccounts() {
    this.loading.set(true);
    this.rtgsService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
        this.error.set('Failed to load accounts');
        this.loading.set(false);
      }
    });
  }

  loadBeneficiaries(preSelectId?: string) {
    this.rtgsService.getActiveBeneficiaries().subscribe({
      next: (response) => {
        const beneficiaries = response?.beneficiaries || [];
        this.beneficiaries.set(beneficiaries);
        this.filteredBeneficiaries.set(beneficiaries);
        
        if (preSelectId) {
          const beneficiary = beneficiaries.find(b => String(b.id) === String(preSelectId));
          if (beneficiary) {
            this.selectBeneficiary(beneficiary);
          }
        }
      },
      error: (err) => {
        console.error('Error loading beneficiaries:', err);
        this.error.set('Failed to load beneficiaries');
      }
    });
  }

  // Step 1: Select Account
  selectAccount(account: Account) {
    this.selectedAccount.set(account);
  }

  canAccountBeSelected(account: Account): boolean {
    return account.status === 'ACTIVE' && account.availableBalance >= this.MIN_AMOUNT;
  }

  // Step 2: Select Beneficiary
  filterBeneficiaries(searchTerm: string) {
    this.searchTerm.set(searchTerm);
    const term = searchTerm.toLowerCase();
    if (!term) {
      this.filteredBeneficiaries.set(this.beneficiaries());
      return;
    }
    
    const filtered = this.beneficiaries().filter(b =>
      b.beneficiaryName.toLowerCase().includes(term) ||
      b.nickName?.toLowerCase().includes(term) ||
      b.accountNumber.includes(term) ||
      b.bankName?.toLowerCase().includes(term)
    );
    this.filteredBeneficiaries.set(filtered);
  }

  selectBeneficiary(beneficiary: Beneficiary) {
    this.selectedBeneficiary.set(beneficiary);
  }

  isBeneficiarySelected(beneficiary: Beneficiary): boolean {
    const selected = this.selectedBeneficiary();
    if (!selected) return false;
    return String(selected.id) === String(beneficiary.id);
  }

  trackByBeneficiaryId(index: number, beneficiary: Beneficiary): any {
    return beneficiary.id;
  }

  navigateToAddBeneficiary() {
    this.router.navigate(['/dashboard/neft/beneficiaries/add']);
  }

  // Step 3: Enter Amount
  setQuickAmount(amount: number) {
    this.transferAmount.set(amount);
    this.calculateCharges(amount);
  }

  onAmountChange(value: string) {
    const amount = parseFloat(value) || 0;
    this.transferAmount.set(amount);
    if (amount >= this.MIN_AMOUNT) {
      this.calculateCharges(amount);
    } else {
      this.charges.set(null);
    }
  }

  calculateCharges(amount: number) {
    const charges = this.rtgsService.calculateRTGSCharges(amount);
    this.charges.set(charges);
  }

  get isAmountValid(): boolean {
    const amount = this.transferAmount();
    const account = this.selectedAccount();
    if (!account) return false;
    
    if (amount < this.MIN_AMOUNT) return false;
    if (amount > this.MAX_AMOUNT) return false;
    
    const total = this.charges()?.total || amount;
    return total <= account.availableBalance;
  }

  get remainingBalance(): number {
    const account = this.selectedAccount();
    if (!account) return 0;
    const total = this.charges()?.total || this.transferAmount();
    return account.availableBalance - total;
  }

  // Step 4: Review
  get finalPurpose(): string {
    return this.purpose() === 'Other' ? this.customPurpose() : this.purpose();
  }

  // Navigation
  nextStep() {
    if (this.canProceedToNextStep()) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  goToStep(step: number) {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();
    
    // Check RTGS availability first
    if (!this.rtgsAvailability().available && step > 1) {
      return false;
    }
    
    switch (step) {
      case 1:
        return this.selectedAccount() !== null;
      case 2:
        return this.selectedBeneficiary() !== null;
      case 3:
        return this.isAmountValid && this.purpose() !== '' && 
               (this.purpose() !== 'Other' || this.customPurpose() !== '');
      case 4:
        return this.termsAccepted();
      default:
        return false;
    }
  }

  // Submit Transfer
  submitTransfer() {
    if (!this.canProceedToNextStep()) return;
    
    // Final availability check
    const availability = this.rtgsService.isRTGSAvailable();
    if (!availability.available) {
      this.error.set(availability.message || 'RTGS is not available at this time');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const beneficiary = this.selectedBeneficiary()!;
    const beneficiaryId = beneficiary.id;
    
    if (!beneficiaryId) {
      this.error.set('Invalid beneficiary selection. Please try again.');
      this.submitting.set(false);
      return;
    }

    const transferRequest: RTGSTransferRequest = {
      fromAccountNumber: this.selectedAccount()!.accountNumber,
      beneficiaryId: Number(beneficiaryId),
      amount: this.transferAmount(),
      purpose: this.finalPurpose,
      remarks: this.remarks() || undefined
    };

    this.rtgsService.initiateRTGSTransfer(transferRequest).subscribe({
      next: (response) => {
        this.submitting.set(false);
        if (response.status === 'success') {
          this.transferResponse.set(response.data);
          this.currentStep.set(5); // Success step
        } else {
          this.error.set(response.message || 'Transfer failed');
        }
      },
      error: (err) => {
        console.error('Transfer error:', err);
        const errorMessage = err.error?.message || 'Failed to initiate RTGS transfer. Please try again.';
        this.error.set(errorMessage);
        this.submitting.set(false);
      }
    });
  }

  // Success Step Actions
  viewTransferStatus() {
    const referenceNumber = this.transferResponse()?.eftReference;
    this.router.navigate(['/dashboard/rtgs/history'], {
      queryParams: { highlight: referenceNumber }
    });
  }

  makeAnotherTransfer() {
    this.currentStep.set(1);
    this.selectedAccount.set(null);
    this.selectedBeneficiary.set(null);
    this.transferAmount.set(0);
    this.purpose.set('');
    this.customPurpose.set('');
    this.remarks.set('');
    this.charges.set(null);
    this.termsAccepted.set(false);
    this.transferResponse.set(null);
    this.error.set(null);
    this.checkRTGSAvailability();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard/home']);
  }

  // Utility
  maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    return 'XXXX XXXX ' + lastFour;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getStepTitle(step: number): string {
    switch (step) {
      case 1: return 'Select Account';
      case 2: return 'Choose Beneficiary';
      case 3: return 'Enter Amount';
      case 4: return 'Review & Confirm';
      case 5: return 'Confirmation';
      default: return '';
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep() / this.totalSteps) * 100;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  downloadReceipt() {
    // Implement receipt download functionality
    alert('Receipt download feature coming soon!');
  }
}

