import { Routes } from '@angular/router';
import { RegisterComponent } from './features/register/register.component';
import { ROUTE_PATHS } from './core/constants/route.constants';

export const routes: Routes = [
  { path: ROUTE_PATHS.REGISTER, component: RegisterComponent },
  // keep existing routes here
  {
    path: ROUTE_PATHS.HOME,
    pathMatch: 'full',
    redirectTo: ROUTE_PATHS.REGISTER,
  },
];
