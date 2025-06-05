import { Routes } from '@angular/router';
import { LayoutClienteComponent } from './cliente/layout-cliente/layout-cliente.component';
import { PrincipalComponent } from './cliente/principal/principal.component';
import { LoginComponent } from './cliente/login/login.component';
import { RegistroComponent } from './cliente/registro/registro.component';
import { LayoutBackComponent } from './background/layout-back/layout-back.component';
import { authGuard } from './services/guards/auth.guard';
import { publicGuard } from './services/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutClienteComponent,
    canActivate: [publicGuard],
    children: [
      { path: '', component: PrincipalComponent },
      { path: 'login', component: LoginComponent },
      { path: 'registro', component: RegistroComponent },
    ],
  },
  //backoffice
  { path: 'app', component: LayoutBackComponent, canActivate: [authGuard] },
];
