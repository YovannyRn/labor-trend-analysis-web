import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UseStateService {
  private readonly USER_KEY = 'tienda_user';

  constructor() { }

  save(username: string) {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify({ username }));
  }

  getUsername(): string | null {
    const session = sessionStorage.getItem(this.USER_KEY);
    if (!session) {
      return null;
    }
    return JSON.parse(session).username;
  }

  removeSession() {
    sessionStorage.removeItem(this.USER_KEY);
  }
}
