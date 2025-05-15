import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout-cliente',
  imports: [HeaderComponent, RouterModule],
  templateUrl: './layout-cliente.component.html',
  styleUrl: './layout-cliente.component.scss'
})
export class LayoutClienteComponent {

}
