import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'worknav-theme';
  isDark = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    // Por defecto dark mode (solo se respeta la preferencia guardada)
    const dark = saved ? saved === 'dark' : true;
    this.apply(dark);
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    if (dark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
