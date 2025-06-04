import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY: string = 'tienda_token';
  private readonly REFRESH_TOKEN_KEY: string = 'tienda_refresh_token';

  constructor(private cookieService: CookieService) {}

  saveToken(token: string, refreshToken: string) {
    this.cookieService.set(this.ACCESS_TOKEN_KEY, token, {
      path: '/',
      secure: environment.tokenSecure, //En produccion tiene que estar en true
      sameSite: 'Strict',
    });

    this.cookieService.set(this.REFRESH_TOKEN_KEY, refreshToken, {
      path: '/',
      secure: environment.tokenSecure, //En produccion tiene que estar en true
      sameSite: 'Strict',
    });
  }

  getAccessToken() {
    return this.cookieService.get(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken() {
    return this.cookieService.get(this.REFRESH_TOKEN_KEY);
  }

  removeToken() {
    this.cookieService.delete(
      this.ACCESS_TOKEN_KEY,
      '/',
      '',
      environment.tokenSecure,
      'Strict'
    ); //si el secure es true, tiene que estar en true, si es false tiene que estar en false
    this.cookieService.delete(
      this.REFRESH_TOKEN_KEY,
      '/',
      '',
      environment.tokenSecure,
      'Strict'
    ); // es prduccion tiene que ser true
  }
  getUsername(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.sub || decoded.username || decoded.user_name || null;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }

  getUserId(): number | null {
    const token = this.getAccessToken();

    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      const userId =
        decoded.userId || decoded.id || decoded.user_id || decoded.uid;

      if (userId) {
        return typeof userId === 'number' ? userId : parseInt(userId);
      }
      return null;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }
}
