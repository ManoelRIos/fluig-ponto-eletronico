import { Routes } from '@angular/router';
import { PontoComponent } from './core/components/ponto/ponto.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PontoComponent,
  },
];
