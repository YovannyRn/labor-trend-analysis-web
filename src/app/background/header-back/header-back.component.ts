import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-back',
  imports: [],
  templateUrl: './header-back.component.html',
  styleUrl: './header-back.component.scss'
})
export class HeaderBackComponent {
  constructor(
    private router: Router
  ) {}

  Principal() {
    this.router.navigate(['']);
  }
}