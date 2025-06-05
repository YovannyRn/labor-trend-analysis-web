import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { N8nRequest, N8nResponse } from '../interfaces/n8n-request.interface';
import { TokenService } from '../auth/token.service';
import { UseStateService } from '../auth/use-state.service';

@Injectable({
  providedIn: 'root',
})
export class N8nService {
  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private useStateService: UseStateService
  ) {}
  // Método principal que usa el backend
  sendUserRequest(request: N8nRequest): Observable<N8nResponse> {
    return this.http.post<N8nResponse>(
      `${environment.apiUrl}/n8n/process`,
      request
    );
  }

  // Métodos de conveniencia
  sendChatMessage(
    message: string,
    userId: number,
    userName: string
  ): Observable<N8nResponse> {
    return this.sendUserRequest({
      userId,
      userName,
      message,
      request_type: 'chat',
    });
  }

  requestGraphData(
    message: string,
    userId: number,
    userName: string
  ): Observable<N8nResponse> {
    return this.sendUserRequest({
      userId,
      userName,
      message,
      request_type: 'graph',
    });
  }

  requestSources(
    message: string,
    userId: number,
    userName: string
  ): Observable<N8nResponse> {
    return this.sendUserRequest({
      userId,
      userName,
      message,
      request_type: 'sources',
    });
  }
}
