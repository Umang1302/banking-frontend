import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { SessionService } from './session.service';
import { Store } from '@ngrx/store';
import { userActions } from '../store/userStore/user.action';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private sessionService = inject(SessionService);
  private store = inject(Store);
  private readonly baseUrl = '/api';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Check if the session is valid before making API calls
   * Returns true if session is valid, false otherwise
   */
  private checkSessionValidity(): boolean {
    // Skip session check for auth endpoints
    const token = localStorage.getItem('token');
    
    if (!token) {
      // No token means user is not logged in, allow the request
      // (let the server handle authentication)
      return true;
    }

    // Check if token is expired
    if (this.sessionService.isTokenExpired()) {
      console.warn('Token expired, dispatching session expired action');
      this.store.dispatch(userActions.sessionExpired());
      return false;
    }

    return true;
  }

  get(endpoint: string, options: any = {}): Observable<any> {
    // Check session validity before making the request
    // Skip check for auth endpoints
    if (!endpoint.startsWith('auth/') && !this.checkSessionValidity()) {
      return throwError(() => new Error('Session expired'));
    }

    let httpHeaders = this.getHeaders();
    
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        if (options.headers[key] !== undefined) {
          httpHeaders = httpHeaders.set(key, options.headers[key]);
        }
      });
    }
    
    return this.http.get(`${this.baseUrl}/${endpoint}`, {
      headers: httpHeaders
    });
  }

  post(endpoint: string, data: any, headers: any = {}): Observable<any> {
    // Check session validity before making the request
    // Skip check for auth endpoints
    if (!endpoint.startsWith('auth/') && !this.checkSessionValidity()) {
      return throwError(() => new Error('Session expired'));
    }

    console.log(data,headers);
    let httpHeaders = this.getHeaders();
    
    // Add additional headers if provided
    Object.keys(headers).forEach(key => {
      if (headers[key] !== undefined) {
        httpHeaders = httpHeaders.set(key, headers[key]);
      }
    });
    
    return this.http.post(`${this.baseUrl}/${endpoint}`, data, {
      headers: httpHeaders
    });
  }
}
