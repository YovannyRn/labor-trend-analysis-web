import { Injectable, TemplateRef, ViewContainerRef } from '@angular/core';
import Swal, { SweetAlertResult } from "sweetalert2";

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  constructor() { }

    showMessage(
    title: string, 
    message: string, 
    icon: 'success' | 'warning' | 'error' | 'info' | 'question' = 'info'
  ): void {
    Swal.fire({
      title: title,
      text: message,
      icon: icon,
      confirmButtonText: "Cerrar notificación"
    });
  }

    showError(message: string): void {
    Swal.fire({
      title: "Error",
      text: message,
      icon: "error",
      confirmButtonText: "Cerrar"
    });
  }

    loader(title: string = "Cargando...", message: string = ''): void {
    Swal.fire({
      title: title,
      text: message,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

    async showConfirmation(
    title: string, 
    message: string, 
    confirmButtonText: string = "Aceptar", 
    cancelButtonText: string = "Cancelar"
  ): Promise<boolean> {
    const result: SweetAlertResult<any> = await Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      showCancelButton: true
    });

    return result.isConfirmed;
  }

   close(): void {
    Swal.close();
  }
  
}
