import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PantallazoComponent } from '../pantallazo/pantallazo.component';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, PantallazoComponent, RouterLink], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  isLoading = false;

  constructor(private router: Router) {}

  Layout() {
    this.isLoading = true; 
    setTimeout(() => {
      this.isLoading = false; 
      this.router.navigate(['/app/control-panel']); 
    }, 3000);
  }

}
