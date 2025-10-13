import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { Account, Beneficiary, NEFTCharges, TransferRequest } from '../../models/neft.models';

@Component({
  selector: 'app-neft-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './neft-transfer.component.html',
  styleUrls: ['./neft-transfer.component.css']
})
export class NeftTransferComponent implements OnInit {
  private neftService = inject(NeftService);
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
  referenceNote = signal('');
  remarks = signal('');
  
  // Charges
  charges = signal<NEFTCharges | null>(null);
  calculatingCharges = signal(false);
  
  // UI state
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  termsAccepted = signal(false);
  transferResponse = signal<any>(null);

  purposeOptions = [
    'Salary Payment',
    'Vendor Payment',
    'Invoice Payment',
    'Family Support',
    'Education Fee',
    'Medical Expenses',
    'Loan Repayment',
    'Property Payment',
    'Investment',
    'Other'
  ];

  quickAmounts = [5000, 10000, 25000, 50000];

  ngOnInit() {
    // Check if beneficiary was passed from navigation state
    const navigation = this.router.getCurrentNavigation();
    const beneficiaryId = navigation?.extras?.state?.['beneficiaryId'];

    this.loadAccounts();
    this.loadBeneficiaries(beneficiaryId);
  }

  loadAccounts() {
    this.loading.set(true);
    this.neftService.getCustomerAccounts().subscribe({
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
    // API 2: GET /api/eft/beneficiaries
    this.neftService.getBeneficiaries().subscribe({
      next: (response) => {
        const beneficiaries = response?.beneficiaries || [];
        
        // API returns "id" field which is the beneficiaryId
        const mappedBeneficiaries = beneficiaries.map((b: any) => {
          return {
            ...b,
            beneficiaryId: b.id // Map id to beneficiaryId for compatibility
          };
        });
        
        // Filter out BLOCKED beneficiaries - they cannot be used for transfers
        const activeBeneficiaries = mappedBeneficiaries.filter(b => b.status !== 'BLOCKED');
        
        this.beneficiaries.set(activeBeneficiaries);
        this.filteredBeneficiaries.set(activeBeneficiaries);
        
        // Pre-select beneficiary if ID was passed
        if (preSelectId) {
          const beneficiary = activeBeneficiaries.find(b => String(b.id) === String(preSelectId));
          if (beneficiary) {
            this.selectBeneficiary(beneficiary);
          }
        }
      },
      error: (err) => {
        console.error('Error loading beneficiaries:', err);
      }
    });
  }

  // Step 1: Select Account
  selectAccount(account: Account) {
    this.selectedAccount.set(account);
  }

  canAccountBeSelected(account: Account): boolean {
    return account.status === 'ACTIVE' && account.availableBalance > 0;
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
      b.nickname?.toLowerCase().includes(term) ||
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
    
    // API uses "id" field as the beneficiary identifier
    const selectedId = selected.id;
    const beneficiaryId = beneficiary.id;
    
    // Only compare if both IDs are defined
    if (!selectedId || !beneficiaryId) return false;
    
    // Compare as strings to handle both string and number IDs
    return String(selectedId) === String(beneficiaryId);
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
    if (amount > 0) {
      this.calculateCharges(amount);
    }
  }

  calculateCharges(amount: number) {
    this.calculatingCharges.set(true);
    this.neftService.calculateCharges(amount).subscribe({
      next: (charges) => {
        this.charges.set(charges);
        this.calculatingCharges.set(false);
      },
      error: (err) => {
        console.error('Error calculating charges:', err);
        this.calculatingCharges.set(false);
      }
    });
  }

  get isAmountValid(): boolean {
    const amount = this.transferAmount();
    const account = this.selectedAccount();
    if (!account) return false;
    
    const total = this.charges()?.total || amount;
    return amount >= 1 && amount <= 200000 && total <= account.availableBalance;
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
    // Can only go back to previous steps
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();
    
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

    this.submitting.set(true);
    this.error.set(null);

    // Combine referenceNote and remarks if both are provided
    let remarksText = this.remarks();
    if (this.referenceNote()) {
      remarksText = remarksText 
        ? `Ref: ${this.referenceNote()} | ${remarksText}`
        : this.referenceNote();
    }

    const beneficiary = this.selectedBeneficiary()!;
    // API uses "id" field as the beneficiaryId
    const beneficiaryId = beneficiary.id;
    
    if (!beneficiaryId) {
      this.error.set('Invalid beneficiary selection. Please try again.');
      this.submitting.set(false);
      return;
    }

    const transferRequest: TransferRequest = {
      fromAccountNumber: this.selectedAccount()!.accountNumber,
      beneficiaryId: Number(beneficiaryId),
      amount: this.transferAmount(),
      purpose: this.finalPurpose,
      remarks: remarksText || undefined
    };

    // API 8: POST /api/eft/transfer/initiate
    this.neftService.initiateTransfer(transferRequest).subscribe({
      next: (response) => {
        this.submitting.set(false);
        // Response: { status: "success", message: "...", data: {...} }
        if (response.status === 'success') {
          this.transferResponse.set(response.data);
          this.currentStep.set(5); // Success step
        } else {
          this.error.set(response.message || 'Transfer failed');
        }
      },
      error: (err) => {
        console.error('Transfer error:', err);
        const errorMessage = err.error?.message || 'Failed to initiate transfer. Please try again.';
        this.error.set(errorMessage);
        this.submitting.set(false);
      }
    });
  }

  // Success Step Actions
  viewTransferStatus() {
    const referenceNumber = this.transferResponse()?.eftReference;
    this.router.navigate(['/dashboard/neft/history'], {
      queryParams: { highlight: referenceNumber }
    });
  }

  makeAnotherTransfer() {
    // Reset form
    this.currentStep.set(1);
    this.selectedAccount.set(null);
    this.selectedBeneficiary.set(null);
    this.transferAmount.set(0);
    this.purpose.set('');
    this.customPurpose.set('');
    this.referenceNote.set('');
    this.remarks.set('');
    this.charges.set(null);
    this.termsAccepted.set(false);
    this.transferResponse.set(null);
    this.error.set(null);
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
}

