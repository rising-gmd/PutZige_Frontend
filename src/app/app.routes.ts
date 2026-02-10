import { Routes } from '@angular/router';
import { RegisterComponent } from './features/register/register.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { ROUTE_PATHS } from './core/constants/route.constants';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: ROUTE_PATHS.REGISTER,
    component: RegisterComponent,
    canActivate: [GuestGuard],
  },
  { path: ROUTE_PATHS.VERIFY_EMAIL, component: VerifyEmailComponent },
  {
    path: ROUTE_PATHS.AUTH,
    canActivate: [GuestGuard],
    children: [{ path: ROUTE_PATHS.LOGIN, component: LoginComponent }],
  },
  {
    path: ROUTE_PATHS.HOME,
    pathMatch: 'full',
    redirectTo: ROUTE_PATHS.AUTH_LOGIN,
  },
  {
    path: ROUTE_PATHS.CHAT,
    loadComponent: () =>
      import('./features/chat/components/chat-container/chat-container.component').then(
        (m) => m.ChatContainerComponent,
      ),
    canActivate: [AuthGuard],
  },
];
