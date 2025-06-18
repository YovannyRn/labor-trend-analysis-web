import { Component } from '@angular/core';
import { HeaderBackComponent } from '../header-back/header-back.component';
import { BackofficeComponent } from '../backoffice/backoffice.component';

@Component({
  selector: 'app-layout-back',
  imports: [HeaderBackComponent, BackofficeComponent],
  templateUrl: './layout-back.component.html',
  styleUrl: './layout-back.component.scss',
})
export class LayoutBackComponent {
  mobileSidebarToggleRequested = false;

  onSidebarToggleRequested(): void {
    this.mobileSidebarToggleRequested = !this.mobileSidebarToggleRequested;
  }
}
