import { Routes } from '@angular/router';
import { RegisterComponent } from './features/register/register.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  // keep existing routes here
  { path: '', pathMatch: 'full', redirectTo: 'register' },
];
