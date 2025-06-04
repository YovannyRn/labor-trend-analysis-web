import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {LoginInterface, UserInterface} from '../interfaces/user-interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

   constructor(
    private http: HttpClient
  ) { }

  login(credentials: LoginInterface): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/login`, credentials)
  }

  register(userData: UserInterface): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/register`, userData)
  }
}
