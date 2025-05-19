import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class N8nService {
  private backendUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendUserRequest(data: any): Observable<any> {
    return this.http.post(this.backendUrl, data, { responseType: 'text' });
  }
}
