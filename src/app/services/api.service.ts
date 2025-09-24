import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Generic GET method
  get(endpoint: string, options: any = {}): Observable<any> {
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

  // Generic POST method
  post(endpoint: string, data: any, headers: any = {}): Observable<any> {
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
