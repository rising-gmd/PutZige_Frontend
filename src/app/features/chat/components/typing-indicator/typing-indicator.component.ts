import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="typing-indicator"
      role="status"
      aria-live="polite"
      [attr.aria-label]="name + ' is typing'"
    >
      <span class="typing-name" aria-hidden="true">{{ name }}</span>
      <div class="dots" aria-hidden="true">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  `,
  styleUrls: ['./typing-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypingIndicatorComponent {
  @Input() name = 'Someone';
}
