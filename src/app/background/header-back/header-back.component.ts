import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UseStateService } from '../../services/auth/use-state.service';
import { TokenService } from '../../services/auth/token.service';
import { PopupService } from '../../services/utils/popup.service';
import { UserInfoService } from '../../services/auth/user-info.service';
import { UserInfo } from '../../services/interfaces/user-info';
import { CommonModule } from '@angular/common';
import { ChatStorageService } from '../../services/chat/chat-storage.service';

@Component({
  selector: 'app-header-back',
  imports: [CommonModule],
  templateUrl: './header-back.component.html',
  styleUrl: './header-back.component.scss',
})
export class HeaderBackComponent implements OnInit {
  username: string = '';
  userInfo: UserInfo | null = null;
  showUserPopup: boolean = false;
  isLoadingUserInfo: boolean = false;
  constructor(
    private router: Router,
    private popupService: PopupService,
    private tokenService: TokenService,
    private userStateService: UseStateService,
    private userInfoService: UserInfoService,
    private chatStorageService: ChatStorageService
  ) {}
  ngOnInit(): void {
    this.username = this.userStateService.getUsername() || 'Usuario';
  }

  toggleUserPopup(): void {
    this.showUserPopup = !this.showUserPopup;

    if (this.showUserPopup && !this.userInfo && !this.isLoadingUserInfo) {
      this.loadUserInfo();
    }
  }
  closeUserPopup(): void {
    this.showUserPopup = false;
  }
  private loadUserInfo(): void {
    this.isLoadingUserInfo = true;

    const userId = this.tokenService.getUserId();


    if (!userId) {
      this.isLoadingUserInfo = false;
      this.userInfo = {
        id: 0,
        firstName: this.username,
        lastName: '',
        address: 'No disponible',
        createdAt: new Date().toISOString(),
      };
      return;
    }
    this.userInfoService.getUserInfo(userId).subscribe({
      next: (userInfo) => {
        this.userInfo = userInfo;
        this.isLoadingUserInfo = false;
      },
      error: (error) => {
        this.isLoadingUserInfo = false;
        this.userInfo = {
          id: userId,
          firstName: this.username,
          lastName: '',
          address: 'Error al cargar datos',
          createdAt: new Date().toISOString(),
        };
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  closeSession(): void {
    this.popupService.loader('Cerrando sesión', 'Vuelva pronto');
    this.chatStorageService.clearUserData();
    this.tokenService.removeToken();
    this.userStateService.removeSession();
    setTimeout(() => {
      this.popupService.close();
      this.router.navigate(['/login']);
    }, 1500);
  }
}
