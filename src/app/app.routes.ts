import { Routes } from '@angular/router'
import { PontoComponent } from './core/components/ponto/ponto.component'
import { AdminComponent } from './core/components/admin/admin.component'
import { PendingsComponent } from './core/components/ponto/pendings/pendings.component'

export const routes: Routes = [
  {
    path: '',
    component: PontoComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
  {
    path: 'pendencias',
    component: PendingsComponent,
  },
]
