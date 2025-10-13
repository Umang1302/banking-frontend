import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NeftService } from '../../services/neft.service';
import { AdminBeneficiary, PendingBeneficiary } from '../../models/neft.models';

@Component({
  selector: 'app-beneficiary-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiary-management.component.html',
  styleUrls: ['./beneficiary-management.component.css']
})
export class BeneficiaryManagementComponent implements OnInit {
  private neftService = inject(NeftService);
  private router = inject(Router);

  // View management
  activeView = signal<'all' | 'pending'>('pending'); // Start with pending view

  // All beneficiaries
  beneficiaries = signal<AdminBeneficiary[]>([]);
  filteredBeneficiaries = signal<AdminBeneficiary[]>([]);
  
  // Pending beneficiaries
  pendingBeneficiaries = signal<PendingBeneficiary[]>([]);
  filteredPending = signal<PendingBeneficiary[]>([]);
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filters
  searchTerm = signal('');
  statusFilter = signal('ALL');
  verificationFilter = signal('ALL');
  
  // Modals
  showDetailsModal = signal(false);
  selectedBeneficiary = signal<AdminBeneficiary | null>(null);
  showPendingDetailsModal = signal(false);
  selectedPendingBeneficiary = signal<PendingBeneficiary | null>(null);
  showRejectModal = signal(false);
  showBlockModal = signal(false);
  rejectReason = signal('');
  blockReason = signal('');
  actionInProgress = signal(false);

  ngOnInit() {
    this.loadPendingBeneficiaries(); // Load pending first
    this.loadBeneficiaries();
  }

  loadBeneficiaries() {
    this.loading.set(true);
    this.error.set(null);
    
    // API 7: GET /api/admin/eft/beneficiaries
    this.neftService.getAllBeneficiaries().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // API returns "id" field, map it to beneficiaryId for compatibility
          const mappedBeneficiaries = (response.beneficiaries || []).map(b => ({
            ...b,
            beneficiaryId: b.id
          }));
          this.beneficiaries.set(mappedBeneficiaries);
          this.applyFilters();
        } else {
          this.error.set('Failed to load beneficiaries');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading beneficiaries:', err);
        this.error.set('Failed to load beneficiaries');
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.beneficiaries()];
    
    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(b =>
        b.beneficiaryName.toLowerCase().includes(search) ||
        b.accountNumber.includes(search) ||
        b.customerName.toLowerCase().includes(search) ||
        b.ifscCode.toLowerCase().includes(search) ||
        b.bankName.toLowerCase().includes(search)
      );
    }
    
    // Status filter (ACTIVE/INACTIVE)
    if (this.statusFilter() !== 'ALL') {
      filtered = filtered.filter(b => b.status === this.statusFilter());
    }
    
    // Verification filter
    const verificationFilter = this.verificationFilter();
    if (verificationFilter === 'VERIFIED') {
      filtered = filtered.filter(b => b.isVerified === true);
    } else if (verificationFilter === 'PENDING') {
      filtered = filtered.filter(b => b.isVerified === false || !b.isVerified);
    }
    
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

  onVerificationFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.verificationFilter.set(value);
    this.applyFilters();
  }

  viewDetails(beneficiary: AdminBeneficiary) {
    this.selectedBeneficiary.set(beneficiary);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedBeneficiary.set(null);
  }

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'badge-success' : 'badge-secondary';
  }

  getVerificationBadgeClass(isVerified: boolean): string {
    return isVerified ? 'badge-success' : 'badge-warning';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(dateString: string): string {
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

  // Summary stats
  getTotalCount(): number {
    return this.beneficiaries().length;
  }

  getVerifiedCount(): number {
    return this.beneficiaries().filter(b => b.isVerified).length;
  }

  getPendingCount(): number {
    return this.beneficiaries().filter(b => !b.isVerified).length;
  }

  getActiveCount(): number {
    return this.beneficiaries().filter(b => b.status === 'ACTIVE').length;
  }

  backToDashboard() {
    this.router.navigate(['/dashboard/admin-neft/dashboard']);
  }

  // ============= View Management =============

  switchView(view: 'all' | 'pending') {
    this.activeView.set(view);
    this.searchTerm.set('');
    if (view === 'pending') {
      this.applyPendingFilters();
    } else {
      this.applyFilters();
    }
  }

  // ============= Pending Beneficiaries =============

  loadPendingBeneficiaries() {
    this.loading.set(true);
    this.error.set(null);
    
    // Approval API 1: GET /api/admin/eft/beneficiaries/pending
    this.neftService.getPendingBeneficiaries().subscribe({
      next: (response) => {
        console.log('Pending Beneficiaries API Response:', response);
        if (response.status === 'success') {
          this.pendingBeneficiaries.set(response.beneficiaries || []);
          this.applyPendingFilters();
        } else {
          this.error.set('Failed to load pending beneficiaries');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading pending beneficiaries:', err);
        this.error.set('Failed to load pending beneficiaries');
        this.loading.set(false);
      }
    });
  }

  applyPendingFilters() {
    let filtered = [...this.pendingBeneficiaries()];
    
    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(b =>
        b.beneficiaryName.toLowerCase().includes(search) ||
        b.accountNumber.includes(search) ||
        b.ifscCode.toLowerCase().includes(search) ||
        b.bankName.toLowerCase().includes(search)
      );
    }
    
    this.filteredPending.set(filtered);
  }

  onPendingSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyPendingFilters();
  }

  viewPendingDetails(beneficiary: PendingBeneficiary) {
    this.selectedPendingBeneficiary.set(beneficiary);
    this.showPendingDetailsModal.set(true);
  }

  closePendingDetailsModal() {
    this.showPendingDetailsModal.set(false);
    this.selectedPendingBeneficiary.set(null);
  }

  getPendingApprovalCount(): number {
    return this.pendingBeneficiaries().length;
  }

  // ============= Approval Actions =============

  approveBeneficiary(beneficiary: PendingBeneficiary) {
    if (this.actionInProgress()) return;
    
    if (!confirm(`Approve beneficiary "${beneficiary.beneficiaryName}"?\n\nAccount: ${beneficiary.accountNumber}\nBank: ${beneficiary.bankName}`)) {
      return;
    }

    this.actionInProgress.set(true);
    
    // Approval API 2: POST /api/admin/eft/beneficiaries/{id}/approve
    this.neftService.approveBeneficiary(beneficiary.id).subscribe({
      next: (response) => {
        console.log('Approve Response:', response);
        if (response.status === 'success') {
          alert('✓ Beneficiary approved successfully!');
          this.loadPendingBeneficiaries(); // Refresh pending list
          this.loadBeneficiaries(); // Refresh all list
        } else {
          alert('Failed to approve beneficiary');
        }
        this.actionInProgress.set(false);
      },
      error: (err) => {
        console.error('Error approving beneficiary:', err);
        alert(err.error?.message || 'Failed to approve beneficiary');
        this.actionInProgress.set(false);
      }
    });
  }

  openRejectModal(beneficiary: PendingBeneficiary) {
    this.selectedPendingBeneficiary.set(beneficiary);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.rejectReason.set('');
    this.selectedPendingBeneficiary.set(null);
  }

  confirmReject() {
    const beneficiary = this.selectedPendingBeneficiary();
    if (!beneficiary || this.actionInProgress()) return;

    this.actionInProgress.set(true);
    
    const request = this.rejectReason() ? { reason: this.rejectReason() } : undefined;
    
    // Approval API 3: POST /api/admin/eft/beneficiaries/{id}/reject
    this.neftService.rejectBeneficiary(beneficiary.id, request).subscribe({
      next: (response) => {
        console.log('Reject Response:', response);
        if (response.status === 'success') {
          alert('✗ Beneficiary rejected successfully');
          this.closeRejectModal();
          this.loadPendingBeneficiaries(); // Refresh pending list
          this.loadBeneficiaries(); // Refresh all list
        } else {
          alert('Failed to reject beneficiary');
        }
        this.actionInProgress.set(false);
      },
      error: (err) => {
        console.error('Error rejecting beneficiary:', err);
        alert(err.error?.message || 'Failed to reject beneficiary');
        this.actionInProgress.set(false);
      }
    });
  }

  openBlockModal(beneficiary: AdminBeneficiary) {
    this.selectedBeneficiary.set(beneficiary);
    this.blockReason.set('');
    this.showBlockModal.set(true);
  }

  closeBlockModal() {
    this.showBlockModal.set(false);
    this.blockReason.set('');
    this.selectedBeneficiary.set(null);
  }

  confirmBlock() {
    const beneficiary = this.selectedBeneficiary();
    if (!beneficiary || this.actionInProgress()) return;

    this.actionInProgress.set(true);
    
    const request = this.blockReason() ? { reason: this.blockReason() } : undefined;
    
    // Approval API 4: POST /api/admin/eft/beneficiaries/{id}/block
    // API uses "id" field
    this.neftService.blockBeneficiary(beneficiary.id, request).subscribe({
      next: (response) => {
        console.log('Block Response:', response);
        if (response.status === 'success') {
          alert('🚫 Beneficiary blocked successfully');
          this.closeBlockModal();
          this.loadBeneficiaries(); // Refresh all list
        } else {
          alert('Failed to block beneficiary');
        }
        this.actionInProgress.set(false);
      },
      error: (err) => {
        console.error('Error blocking beneficiary:', err);
        alert(err.error?.message || 'Failed to block beneficiary');
        this.actionInProgress.set(false);
      }
    });
  }

  getBlockedCount(): number {
    return this.beneficiaries().filter(b => b.status === 'BLOCKED').length;
  }
}

