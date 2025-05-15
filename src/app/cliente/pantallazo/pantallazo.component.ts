import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pantallazo',
  standalone: true, // Asegúrate de que sea standalone
  imports: [CommonModule], // Importa CommonModule para usar *ngIf
  templateUrl: './pantallazo.component.html',
  styleUrls: ['./pantallazo.component.scss']
})
export class PantallazoComponent {
  isLoading = true;

  ngOnInit(): void {
    // Simula un tiempo de carga de 3 segundos
    setTimeout(() => {
      this.isLoading = false;
    }, 3000);
  }
}