import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  private readonly document = inject(DOCUMENT);
  private readonly rootClass = 'my-app-dark';

  isDark(): boolean {
    return this.document.documentElement.classList.contains(this.rootClass);
  }

  toggle(): void {
    this.document.documentElement.classList.toggle(this.rootClass);
  }

  set(value: boolean): void {
    if (value) {
      this.document.documentElement.classList.add(this.rootClass);
    } else {
      this.document.documentElement.classList.remove(this.rootClass);
    }
  }
}
