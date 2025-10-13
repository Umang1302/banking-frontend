import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  transactionId: number;
  transactionReference: string;
  transactionType: string;
  amount: number;
  currency: string;
  accountNumber: string;
  destinationAccountNumber?: string;
  description?: string;
  category?: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
  transactionDate: string;
  initiatedBy?: string;
  referenceNumber?: string;
}

export interface TransactionHistory {
  accountNumber: string;
  transactions: Transaction[];
  count: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateTransactionRequest {
  transactionType: string;
  amount: number;
  accountNumber: string;
  destinationAccountNumber?: string;
  description?: string;
  category?: string;
  referenceNumber?: string;
  currency: string;
}

export interface BulkUploadResult {
  successfulTransactions: number;
  failedTransactions: number;
  totalTransactions: number;
  batchId: string;
  errors?: Array<{ rowNumber: number; accountNumber: string; error: string }>;
  successfulResults?: Transaction[];
}

export interface StatementRequest {
  accountNumber: string;
  startDate: string;
  endDate: string;
  sendEmail?: boolean;
  emailAddress?: string;
  statementFormat?: string;
}

export interface RecipientValidationResponse {
  valid: boolean;
}

export interface TransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  description: string;
  notes?: string;
}

export interface TransferResponse {
  transactionReference: string;
  status: string;
  message: string;
  fromAccountNumber: string;
  senderBalanceBefore: number;
  senderBalanceAfter: number;
  toAccountNumber: string;
  recipientName: string;
  amount: number;
  currency: string;
  description: string;
  transactionDate: string;
  debitTransactionId: number;
  creditTransactionId: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/transactions';
  private readonly transferBaseUrl = '/api/transfers';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getTransactionHistory(accountNumber: string, startDate?: string, endDate?: string): Observable<TransactionHistory> {
    let url = `${this.baseUrl}/history/${accountNumber}`;
    const params: string[] = [];
    
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<TransactionHistory>(url, { headers: this.getHeaders() });
  }

  createTransaction(data: CreateTransactionRequest): Observable<{ transaction: Transaction }> {
    return this.http.post<{ transaction: Transaction }>(`${this.baseUrl}`, data, { 
      headers: this.getHeaders() 
    });
  }

  bulkUploadTransactions(file: File): Observable<{ result: BulkUploadResult }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<{ result: BulkUploadResult }>(`${this.baseUrl}/bulk-upload`, formData, { 
      headers 
    });
  }

  generatePdfStatement(data: StatementRequest): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/pdf'
    });

    return this.http.post(`${this.baseUrl}/statement/pdf`, data, {
      headers: headers,
      responseType: 'blob',
      observe: 'body'
    });
  }

  getTransactionByReference(reference: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/reference/${reference}`, {
      headers: this.getHeaders()
    });
  }

  // Money Transfer Methods
  validateRecipientAccount(accountNumber: string): Observable<RecipientValidationResponse> {
    return this.http.get<RecipientValidationResponse>(
      `${this.transferBaseUrl}/validate/${accountNumber}`,
      { headers: this.getHeaders() }
    );
  }

  sendMoneyTransfer(data: TransferRequest): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(
      `${this.transferBaseUrl}/send`,
      data,
      { headers: this.getHeaders() }
    );
  }

  getTransferHistory(): Observable<any> {
    return this.http.get<any>(
      `${this.transferBaseUrl}/history`,
      { headers: this.getHeaders() }
    );
  }
}

