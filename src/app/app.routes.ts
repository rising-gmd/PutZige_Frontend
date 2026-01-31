import { Routes } from '@angular/router';
import { RegisterComponent } from './features/register/register.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { ROUTE_PATHS } from './core/constants/route.constants';

export const routes: Routes = [
  { path: ROUTE_PATHS.REGISTER, component: RegisterComponent },
  {
    path: ROUTE_PATHS.AUTH,
    children: [{ path: ROUTE_PATHS.LOGIN, component: LoginComponent }],
  },
  // keep existing routes here
  {
    path: ROUTE_PATHS.HOME,
    pathMatch: 'full',
    redirectTo: ROUTE_PATHS.REGISTER,
  },
];
