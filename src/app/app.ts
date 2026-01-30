import { ButtonModule } from 'primeng/button';
import { Component, inject, signal } from '@angular/core';
import { DarkModeService } from './theme/dark-mode.service';

@Component({
  selector: 'app-root',
  imports: [ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('test');

  private readonly darkMode = inject(DarkModeService);

  toggleDarkMode(): void {
    this.darkMode.toggle();
  }
}
