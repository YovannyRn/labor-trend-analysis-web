import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PantallazoComponent } from '../pantallazo/pantallazo.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TokenService } from '../../services/auth/token.service';
import { CredentialsService } from '../../services/auth/credentials.service';
import { LoginInterface } from '../../services/interfaces/user-interface';
import { UseStateService } from '../../services/auth/use-state.service';
import { PopupService } from '../../services/utils/popup.service';
import { ChatStorageService } from '../../services/chat/chat-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, PantallazoComponent, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  constructor(
    private tokenService: TokenService,
    private credentialsService: CredentialsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private popupService: PopupService,
    private useStateService: UseStateService,
    private chatStorageService: ChatStorageService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }
  submit() {
    if (this.loginForm.invalid) {
      return;
    }
    this.credentialsService
      .login(this.loginForm.value as LoginInterface)
      .subscribe({
        next: (data) => {
          this.popupService.loader('Cargando...', 'Espere un momento');
          setTimeout(() => {
            this.tokenService.saveToken(data.token, '234325423423');
            this.useStateService.save(data.username);

            // Recargar datos de chat para el usuario autenticado
            this.chatStorageService.reloadUserData();

            this.popupService.close();
            this.router.navigate(['/app']);
          }, 1500);
        },
        error: (err) => {
          let message;
          if (err.error == 'Invalid password') {
            message = 'Contraseña incorrecta, inténtelo de nuevo.';
          } else if (err.error == 'User not found') {
            message =
              'El usuario no existe. Compruebe los datos o registrate en la plataforma';
          } else {
            message = err.error;
          }

          this.popupService.showMessage(
            'Ups ha ocurrido un error',
            message,
            'error'
          );
        },
      });
  }
}
