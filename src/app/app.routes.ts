import { Routes } from '@angular/router';
import { UsuariosComponent } from './core/components/usuarios/usuarios.component';
import { PontoComponent } from './core/components/ponto/ponto.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PontoComponent,
},
];
