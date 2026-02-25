import { Routes } from '@angular/router';
import { Login } from './pages/login/login';

export const routes: Routes = [
{ 
    path: 'login', 
    component: Login
  },
  {
    path: 'admin',
    children: [
        {
            path: 'dashboard',
            loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
        }
    ]
  }
];
