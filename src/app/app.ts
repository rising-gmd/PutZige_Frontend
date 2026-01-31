import { ButtonModule } from 'primeng/button';
import { Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DarkModeService } from './theme/dark-mode.service';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, RouterOutlet, TranslateModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  protected readonly title = signal('test');
  private readonly darkMode = inject(DarkModeService);
  private readonly router = inject(Router);

  showHeader = signal(true);

  constructor() {
    this.showHeader.set(!this.router.url.includes('/register'));
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((ev) => {
        this.showHeader.set(!ev.url.includes('/register'));
      });
  }

  toggleDarkMode(): void {
    this.darkMode.toggle();
  }
}
