import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CredentialsService } from '../../services/auth/credentials.service';
import { UseStateService } from '../../services/auth/use-state.service';
import { UserInterface } from '../../services/interfaces/user-interface';
import { PopupService } from '../../services/utils/popup.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
})
export class RegistroComponent {
  registerForm: FormGroup;

  constructor(
    private formbuilder: FormBuilder,
    private credentialsService: CredentialsService,
    private router: Router,
    private popupService: PopupService
  ) {
    this.registerForm = this.formbuilder.group(
      {
        username: this.formbuilder.control('', Validators.required),
        password: this.formbuilder.control('', Validators.required),
        confirmPassword: this.formbuilder.control('', Validators.required), 
        firstName: this.formbuilder.control('', Validators.required),
        lastName: this.formbuilder.control('', Validators.required),
        address: this.formbuilder.control('', [
          Validators.required,
          Validators.email,
        ]),
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  submit() {
    console.log('Intentando registrar...');
    if (this.registerForm.invalid) {
      console.log(
        'Formulario inválido',
        this.registerForm.errors,
        this.registerForm.value
      );
      return;
    }

    this.credentialsService
      .register(this.registerForm.value as UserInterface)
      .subscribe({
        next: (data) => {
          this.popupService.showMessage(
            'Registro exitoso',
            'Tu cuenta ha sido creada correctamente',
            'success'
          );
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          let message = 'Ocurrió un error. Inténtalo de nuevo.';
          if (err.error?.message) {
            message = err.error.message;
          }
          this.popupService.showMessage('Error', message, 'error');
        },
      });
  }
}
