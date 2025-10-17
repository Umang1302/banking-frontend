import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UPIPaymentService } from '../services/upi-payment.service';
import { UPIAccount, UPIRegisterRequest } from '../models/upi-payment.models';

@Component({
  selector: 'app-upi-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upi-management.component.html',
  styleUrls: ['./upi-management.component.css']
})
export class UPIManagementComponent implements OnInit {
  private upiService = inject(UPIPaymentService);

  // Data
  accounts = signal<any[]>([]);
  upiAccounts = signal<UPIAccount[]>([]);
  
  // Form
  showAddForm = signal(false);
  newUPIId = signal('');
  selectedAccountNumber = signal('');
  isPrimary = signal(false);

  // UI state
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit() {
    this.loadAccounts();
    this.loadUPIAccounts();
  }

  get primaryUPIAccount(): UPIAccount | null {
    return this.upiAccounts().find(upi => upi.primary) || null;
  }

  get hasPrimaryUPI(): boolean {
    return this.primaryUPIAccount !== null;
  }

  isPrimaryUPI(upi: UPIAccount): boolean {
    return upi.primary === true;
  }

  loadAccounts() {
    this.loading.set(true);
    this.upiService.getCustomerAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        if (accounts.length > 0) {
          this.selectedAccountNumber.set(accounts[0].accountNumber);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading accounts:', err);
        this.error.set('Failed to load accounts');
        this.loading.set(false);
      }
    });
  }

  loadUPIAccounts() {
    this.loading.set(true);
    this.upiService.getUPIAccounts().subscribe({
      next: (upiAccounts) => {
        this.upiAccounts.set(upiAccounts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading UPI accounts:', err);
        this.error.set('Failed to load UPI accounts');
        this.loading.set(false);
      }
    });
  }

  toggleAddForm() {
    this.showAddForm.set(!this.showAddForm());
    this.resetForm();
  }

  registerUPI() {
    // Validation
    if (!this.newUPIId()) {
      this.error.set('Please enter UPI ID');
      return;
    }

    if (!this.upiService.isValidUPIFormat(this.newUPIId())) {
      this.error.set('Invalid UPI ID format. Format should be: username@provider');
      return;
    }

    if (!this.selectedAccountNumber()) {
      this.error.set('Please select an account');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const request: UPIRegisterRequest = {
      upiId: this.newUPIId(),
      accountNumber: this.selectedAccountNumber(),
      isPrimary: this.isPrimary()
    };

    this.upiService.registerUPI(request).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.loadUPIAccounts();
        this.showAddForm.set(false);
        this.resetForm();
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('Error registering UPI:', err);
        this.error.set(err.error?.message || 'Failed to register UPI ID');
        this.submitting.set(false);
      }
    });
  }

  setPrimary(upiId: string) {
    this.upiService.setUPIAsPrimary(upiId).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.loadUPIAccounts();
      },
      error: (err) => {
        console.error('Error setting primary:', err);
        this.error.set(err.error?.message || 'Failed to set UPI as primary');
      }
    });
  }

  deactivateUPI(upiId: string) {
    if (!confirm('Are you sure you want to deactivate this UPI ID?')) {
      return;
    }

    this.upiService.deactivateUPI(upiId).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.loadUPIAccounts();
      },
      error: (err) => {
        console.error('Error deactivating UPI:', err);
        this.error.set(err.error?.message || 'Failed to deactivate UPI ID');
      }
    });
  }

  resetForm() {
    this.newUPIId.set('');
    this.isPrimary.set(false);
    this.error.set(null);
    this.success.set(null);
  }

  getProviderIcon(provider: string): string {
    const icons: { [key: string]: string } = {
      'PAYTM': '💰',
      'PHONEPE': '📱',
      'GOOGLEPAY': '🔵',
      'BHIM': '🇮🇳',
      'OTHER': '💳'
    };
    return icons[provider] || '💳';
  }

  getProviderColor(provider: string): string {
    const colors: { [key: string]: string } = {
      'PAYTM': '#00BAF2',
      'PHONEPE': '#5F259F',
      'GOOGLEPAY': '#34A853',
      'BHIM': '#FF6600',
      'OTHER': '#6c757d'
    };
    return colors[provider] || '#6c757d';
  }

  getAccountDetails(accountNumber: string) {
    return this.accounts().find(acc => acc.accountNumber === accountNumber);
  }

  getAccountType(accountNumber: string): string {
    const account = this.getAccountDetails(accountNumber);
    return account ? account.accountType : 'N/A';
  }

  formatDateTime(dateTime: string | null | undefined): string {
    if (!dateTime) return 'Never';
    return new Date(dateTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}

