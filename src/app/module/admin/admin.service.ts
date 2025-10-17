import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiService = inject(ApiService);

  async getDashboardData(): Promise<any> {
    return firstValueFrom(this.apiService.get('admin/dashboard', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }));
  }

  async getPendingReviewUsers(): Promise<any> {
    return firstValueFrom(this.apiService.get('admin/pending-review', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }));
  }

  async getPendingDetailsUsers(): Promise<any> {
    return firstValueFrom(this.apiService.get('admin/pending-details', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }));
  }

  async getAllUsers(): Promise<any> {
    return firstValueFrom(this.apiService.get('users/all', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }));
  }

  async getUserDetails(userId: number): Promise<any> {
    return firstValueFrom(this.apiService.get(`admin/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }));
  }

  async approveUser(userId: number): Promise<any> {
    return firstValueFrom(this.apiService.post(`admin/approve-user/${userId}`, {}, {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }));
  }

  async rejectUser(userId: number, reason: string): Promise<any> {
    return firstValueFrom(this.apiService.post(`admin/reject-user/${userId}`, { reason }, {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }));
  }
}
