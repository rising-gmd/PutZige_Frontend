import { Component, OnInit, inject } from '@angular/core';
import { DarkModeService } from '../../theme/dark-mode.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  private readonly darkMode = inject(DarkModeService);

  currentTheme: 'dark' | 'light' =
    (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';

  ngOnInit(): void {
    // initialize theme from localStorage
    const saved = this.currentTheme === 'dark';
    this.darkMode.set(saved);
  }

  toggleTheme(): void {
    // toggle via service and persist
    this.darkMode.toggle();
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('app-theme', this.currentTheme);
  }
}
