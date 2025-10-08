import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, StatementRequest } from '../transaction.service';
import { UserService } from '../../../store/userStore/user.service';
import { Account } from '../../../store/userStore/user.action';

@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statement.html',
  styleUrls: ['./statement.css']
})
export class StatementComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private userService = inject(UserService);
  
  formData: StatementRequest = {
    accountNumber: '',
    startDate: '',
    endDate: '',
    sendEmail: false,
    emailAddress: '',
    statementFormat: 'PDF'
  };

  generating = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  userAccounts: Account[] = [];

  ngOnInit(): void {
    this.userService.user$.subscribe(user => {
      if (user) {
        // Get all user accounts
        if (user.accounts && user.accounts.length > 0) {
          this.userAccounts = user.accounts;
          // Select first active account by default
          const activeAccount = user.accounts.find(acc => acc.status === 'ACTIVE') || user.accounts[0];
          this.formData.accountNumber = activeAccount.accountNumber;
        }
        this.formData.emailAddress = user.email || '';
      }
    });
  }

  getAccountTypeDisplay(accountType: string): string {
    const displays: { [key: string]: string } = {
      'SAVINGS': 'Savings Account',
      'CURRENT': 'Current Account',
      'CREDIT': 'Credit Card',
      'LOAN': 'Loan Account'
    };
    return displays[accountType] || accountType;
  }

  handleGenerateStatement(): void {
    if (!this.formData.startDate || !this.formData.endDate) {
      this.errorMessage = 'Please select start and end dates';
      return;
    }

    if (new Date(this.formData.startDate) > new Date(this.formData.endDate)) {
      this.errorMessage = 'Start date must be before end date';
      return;
    }

    this.generating = true;
    this.successMessage = null;
    this.errorMessage = null;

    this.transactionService.generatePdfStatement(this.formData).subscribe({
      next: (pdfBlob) => {
        this.generating = false;
        
        console.log('Received blob:', pdfBlob);
        console.log('Blob type:', pdfBlob.type);
        console.log('Blob size:', pdfBlob.size);
        
        // Validate the blob before attempting download
        if (!pdfBlob || pdfBlob.size === 0) {
          this.errorMessage = 'Received empty PDF from server';
          return;
        }

        // Check if blob is actually a PDF (not an error response)
        if (pdfBlob.type && !pdfBlob.type.includes('pdf') && !pdfBlob.type.includes('octet-stream')) {
          console.warn('Unexpected blob type:', pdfBlob.type);
          // Try to read blob as text to see if it's an error message
          pdfBlob.text().then(text => {
            console.error('Blob content:', text);
            this.errorMessage = 'Invalid PDF format received from server';
          });
          return;
        }
        
        // Download the PDF
        const filename = `statement_${this.formData.accountNumber}_${this.formData.startDate}_to_${this.formData.endDate}.pdf`;
        this.downloadPdf(pdfBlob, filename);
        
        if (this.formData.sendEmail) {
          this.successMessage = 'Statement generated and emailed successfully!';
        } else {
          this.successMessage = 'Statement downloaded successfully!';
        }

        // Clear success message after 5 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
      error: (err) => {
        this.generating = false;
        console.error('Error generating statement:', err);
        
        // Handle blob error responses
        if (err.error instanceof Blob) {
          err.error.text().then((text: string) => {
            try {
              const errorObj = JSON.parse(text);
              this.errorMessage = errorObj.message || 'Failed to generate statement';
            } catch {
              this.errorMessage = text || 'Failed to generate statement';
            }
          });
        } else {
          this.errorMessage = err.error?.message || err.message || 'Failed to generate statement';
        }
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          this.errorMessage = null;
        }, 5000);
      }
    });
  }

  setQuickDateRange(range: string): void {
    const today = new Date();
    let startDate: string;
    let endDate = today.toISOString().split('T')[0];

    switch(range) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'last3Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().split('T')[0];
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        return;
    }

    this.formData.startDate = startDate;
    this.formData.endDate = endDate;
  }

  downloadPdf(blob: Blob, filename: string): void {
    try {
      // Validate blob
      if (!blob || blob.size === 0) {
        console.error('Invalid or empty blob');
        this.errorMessage = 'Invalid PDF data received';
        return;
      }

      console.log('PDF blob size:', blob.size, 'bytes');

      // Create blob with explicit type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      // Use different approach for better browser compatibility
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        // IE/Edge specific
        (window.navigator as any).msSaveOrOpenBlob(pdfBlob, filename);
      } else {
        // Modern browsers
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        
        // Small delay before click to ensure DOM is ready
        setTimeout(() => {
          a.click();
          
          // Cleanup after download starts
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 250);
        }, 0);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.errorMessage = 'Failed to download PDF file';
    }
  }
}

