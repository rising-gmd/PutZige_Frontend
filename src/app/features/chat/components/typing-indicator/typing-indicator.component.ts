import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="typing">{{ name }} is typing…</div>',
  styles: [
    '.typing { font-style: italic; color: var(--p-primary-400); padding: 8px 12px; }',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypingIndicatorComponent {
  @Input() name = 'Someone';
}
