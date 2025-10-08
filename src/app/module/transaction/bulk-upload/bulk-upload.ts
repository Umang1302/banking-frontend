import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService, BulkUploadResult } from '../transaction.service';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.html',
  styleUrls: ['./bulk-upload.css']
})
export class BulkUploadComponent {
  private transactionService = inject(TransactionService);
  
  selectedFile: File | null = null;
  uploading = false;
  uploadResult: BulkUploadResult | null = null;
  errorMessage: string | null = null;

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && file.name.endsWith('.csv')) {
      this.selectedFile = file;
      this.uploadResult = null;
      this.errorMessage = null;
    } else {
      this.errorMessage = 'Please select a CSV file';
      this.selectedFile = null;
    }
  }

  handleUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first';
      return;
    }

    this.uploading = true;
    this.errorMessage = null;
    this.uploadResult = null;

    this.transactionService.bulkUploadTransactions(this.selectedFile).subscribe({
      next: (response) => {
        this.uploading = false;
        this.uploadResult = response.result;
        this.selectedFile = null;
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (err) => {
        this.uploading = false;
        this.errorMessage = err.error?.message || 'Failed to upload file';
      }
    });
  }

  downloadCsvTemplate(): void {
    const csvContent = `AccountNumber,TransactionType,Amount,Description,Category
1234567890,CREDIT,1000.00,Salary deposit,SALARY
0987654321,DEBIT,50.00,Service fee,PAYMENT
1122334455,CREDIT,2500.00,Refund,REFUND`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_transactions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatAmount(amount: number): string {
    return parseFloat(amount.toString()).toFixed(2);
  }
}

