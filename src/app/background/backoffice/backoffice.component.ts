import { Component } from '@angular/core';
import { LayoutSearchComponent } from '../layout-search/layout-search.component';

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [
    LayoutSearchComponent
  ],
  templateUrl: './backoffice.component.html',
  styleUrls: ['./backoffice.component.scss'],
})
export class BackofficeComponent {}
