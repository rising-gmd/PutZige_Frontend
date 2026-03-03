import {
  Component,
  forwardRef,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormsModule,
} from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordModule, MessageModule],
  templateUrl: './app-password.component.html',
  styleUrls: ['./app-password.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppPasswordComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppPasswordComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() showToggle = true;
  @Input() strength = false;
  @Input() error?: string | null;

  value = '';
  private onChange: (v: string) => void = () => void 0;
  private onTouchedCallback: () => void = () => void 0;

  writeValue(obj: string): void {
    this.value = obj ?? '';
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  update(value: string): void {
    this.value = value;
    this.onChange(value);
  }

  onTouched(): void {
    this.onTouchedCallback();
  }
}
