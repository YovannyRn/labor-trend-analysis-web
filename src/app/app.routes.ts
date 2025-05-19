import { Routes } from '@angular/router';
import { LayoutClienteComponent } from './cliente/layout-cliente/layout-cliente.component';
import { PrincipalComponent } from './cliente/principal/principal.component';
import { LoginComponent } from './cliente/login/login.component';
import { RegistroComponent } from './cliente/registro/registro.component';
import { LayoutBackComponent } from './background/layout-back/layout-back.component';
import { MenuBackComponent } from './background/menu-back/menu-back.component';

export const routes: Routes = [
    {
        path: "", component: LayoutClienteComponent, children: [
            { path: "", component: PrincipalComponent},
            { path: "login", component: LoginComponent},
            { path: "registro", component: RegistroComponent},
        ]
    },
    //backoffice
    {
        path: "app", component: LayoutBackComponent, children: [
            
            {path: "", redirectTo: "control-panel", pathMatch: "full"},
            {path: "control-panel", component: MenuBackComponent},
        ]
    }
];
