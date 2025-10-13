import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { Beneficiary } from '../../models/neft.models';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiary-list.component.html',
  styleUrls: ['./beneficiary-list.component.css']
})
export class BeneficiaryListComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);

  beneficiaries = signal<Beneficiary[]>([]);
  filteredBeneficiaries = signal<Beneficiary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  searchTerm = signal('');
  statusFilter = signal('ALL');
  showDeleteModal = signal(false);
  showDetailsModal = signal(false);
  selectedBeneficiary = signal<Beneficiary | null>(null);
  revealedAccounts = signal<Set<string>>(new Set());

  ngOnInit() {
    this.loadBeneficiaries();
  }

  loadBeneficiaries() {
    this.loading.set(true);
    this.error.set(null);
    
    this.neftService.getBeneficiaries().subscribe({
      next: (response) => {
        // API 2: GET /api/eft/beneficiaries - Response
        const beneficiaries = response?.beneficiaries || [];
        
        // API returns "id" field which is the beneficiaryId
        const mappedBeneficiaries = beneficiaries.map(b => ({
          ...b,
          beneficiaryId: b.id // Map id to beneficiaryId for compatibility
        }));
        
        this.beneficiaries.set(mappedBeneficiaries);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load beneficiaries. Please try again.');
        this.loading.set(false);
        console.error('Error loading beneficiaries:', err);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.beneficiaries()];
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(b => 
        b.beneficiaryName.toLowerCase().includes(search) ||
        b.accountNumber.includes(search) ||
        b.nickname?.toLowerCase().includes(search) ||
        b.bankName.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    const status = this.statusFilter();
    if (status === 'VERIFIED') {
      // Show only verified and active beneficiaries
      filtered = filtered.filter(b => b.isVerified === true && b.status !== 'BLOCKED');
    } else if (status === 'PENDING') {
      // Show only pending verification and not blocked
      filtered = filtered.filter(b => 
        (b.isVerified === false || b.isVerified === undefined) && b.status !== 'BLOCKED'
      );
    } else if (status === 'BLOCKED') {
      // Show only blocked beneficiaries
      filtered = filtered.filter(b => b.status === 'BLOCKED');
    } else if (status === 'ACTIVE') {
      // Show only active (not blocked) beneficiaries
      filtered = filtered.filter(b => b.status !== 'BLOCKED');
    }
    // 'ALL' shows everything (no filter)
    
    this.filteredBeneficiaries.set(filtered);
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onStatusFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.applyFilters();
  }

  maskAccountNumber(accountNumber: string, beneficiaryId: string | number): string {
    const idStr = String(beneficiaryId);
    if (this.revealedAccounts().has(idStr)) {
      return accountNumber;
    }
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    return 'XXXX XXXX ' + lastFour;
  }

  toggleAccountVisibility(beneficiaryId: string | number) {
    const idStr = String(beneficiaryId);
    const revealed = new Set(this.revealedAccounts());
    if (revealed.has(idStr)) {
      revealed.delete(idStr);
    } else {
      revealed.add(idStr);
    }
    this.revealedAccounts.set(revealed);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }

  navigateToAddBeneficiary() {
    this.router.navigate(['/dashboard/neft/beneficiaries/add']);
  }

  navigateToEdit(beneficiary: Beneficiary) {
    this.router.navigate(['/dashboard/neft/beneficiaries/edit', beneficiary.id]);
  }

  navigateToTransfer(beneficiary: Beneficiary) {
    this.router.navigate(['/dashboard/neft/transfer'], {
      state: { beneficiaryId: beneficiary.id }
    });
  }

  openDeleteModal(beneficiary: Beneficiary) {
    this.selectedBeneficiary.set(beneficiary);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.selectedBeneficiary.set(null);
  }

  confirmDelete() {
    const beneficiary = this.selectedBeneficiary();
    if (!beneficiary || !beneficiary.id) return;
    
    // API 6: DELETE /api/eft/beneficiaries/{id}
    this.neftService.deleteBeneficiary(String(beneficiary.id)).subscribe({
      next: (response) => {
        // Response: { status: "success", message: "Beneficiary deleted successfully" }
        if (response.status === 'success') {
          this.loadBeneficiaries();
          this.closeDeleteModal();
          alert(response.message || 'Beneficiary deleted successfully!');
        }
      },
      error: (err) => {
        console.error('Error deleting beneficiary:', err);
        alert('Failed to delete beneficiary. Please try again.');
      }
    });
  }

  openDetailsModal(beneficiary: Beneficiary) {
    this.selectedBeneficiary.set(beneficiary);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedBeneficiary.set(null);
  }

  getStatusBadgeClass(beneficiary: Beneficiary): string {
    // Check for blocked status first
    if (beneficiary.status === 'BLOCKED') {
      return 'badge-danger';
    }
    // Then check verification status
    return beneficiary.isVerified ? 'badge-success' : 'badge-warning';
  }
  
  getVerificationLabel(beneficiary: Beneficiary): string {
    if (beneficiary.status === 'BLOCKED') {
      return '🚫 Blocked';
    }
    return beneficiary.isVerified ? '✓ Verified' : '⏱ Pending Verification';
  }

  getRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  // Helper methods for filter counts
  getActiveCount(): number {
    return this.beneficiaries().filter(b => b.status !== 'BLOCKED').length;
  }

  getVerifiedCount(): number {
    return this.beneficiaries().filter(b => b.isVerified === true && b.status !== 'BLOCKED').length;
  }

  getPendingCount(): number {
    return this.beneficiaries().filter(b => 
      (b.isVerified === false || b.isVerified === undefined) && b.status !== 'BLOCKED'
    ).length;
  }

  getBlockedCount(): number {
    return this.beneficiaries().filter(b => b.status === 'BLOCKED').length;
  }
}

