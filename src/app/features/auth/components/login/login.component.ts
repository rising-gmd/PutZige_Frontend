import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ROUTE_PATHS } from '../../../../core/constants/route.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  router = inject(Router);
  translate = inject(TranslateService);

  username = '';
  password = '';

  submit(): void {
    // Dummy submit: in a real app you'd call AuthService. Keep strings out of code.
    this.router.navigate([ROUTE_PATHS.HOME]);
  }
}
