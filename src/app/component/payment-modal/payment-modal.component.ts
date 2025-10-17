import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent {
  @Input() isOpen = false;
  @Input() isSuccess = false;
  @Input() title = '';
  @Input() message = '';
  @Input() transactionReference = '';
  @Input() amount = 0;
  @Input() currency = 'INR';
  @Input() receiverName = '';
  @Input() payerBalanceBefore = 0;
  @Input() payerBalanceAfter = 0;
  @Input() paidAt = '';
  @Input() paymentType: 'QR' | 'UPI' = 'QR';
  
  @Output() close = new EventEmitter<void>();
  @Output() downloadReceipt = new EventEmitter<void>();
  @Output() viewTransaction = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onDownloadReceipt() {
    this.downloadReceipt.emit();
  }

  onViewTransaction() {
    this.viewTransaction.emit();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }

  formatDateTime(dateTime: string): string {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}

