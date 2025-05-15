import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PantallazoComponent } from '../pantallazo/pantallazo.component';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, PantallazoComponent], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isLoading = false; 

  constructor(private router: Router) {}

  Registro() {
    this.router.navigate(['/registro']);
  }

  Layout() {
    this.isLoading = true; 
    setTimeout(() => {
      this.isLoading = false; 
      this.router.navigate(['/back']); 
    }, 3000);
  }
}
