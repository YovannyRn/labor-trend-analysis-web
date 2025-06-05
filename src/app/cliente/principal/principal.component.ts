import { Component, OnInit, AfterViewInit } from '@angular/core';
import { PantallazoComponent } from "../pantallazo/pantallazo.component";

@Component({
  selector: 'app-principal',
  imports: [PantallazoComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss'
})
export class PrincipalComponent implements OnInit, AfterViewInit {
  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const videoElement = document.getElementById('video1') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = true; 
      videoElement.play().catch((error) => {
        console.error('Error al reproducir el video:', error);
      });
    }
  }
}
