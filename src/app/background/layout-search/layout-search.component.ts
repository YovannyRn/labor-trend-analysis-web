import { Component } from '@angular/core';
import { N8nService } from '../../services/n8n/n8n.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './layout-search.component.html',
  styleUrl: './layout-search.component.scss',
})
export class LayoutSearchComponent {
  searchText = '';
  loading = false;
  result: any = null;

  constructor(private n8nService: N8nService) {}

  sendSearch() {
    if (!this.searchText) return;
    this.loading = true;
    // Puedes personalizar el objeto enviado según lo que espera tu workflow n8n
    const data = {
      userId: 123,
      userName: 'test',
      message: this.searchText,
    };
    this.n8nService.sendUserRequest(data).subscribe({
      next: (res) => {
        console.log('Respuesta n8n:', res);
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.result = 'Error al conectar con n8n';
        this.loading = false;
        console.error(err);
      },
    });
  }
}
