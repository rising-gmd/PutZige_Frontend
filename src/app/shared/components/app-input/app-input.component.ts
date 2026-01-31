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
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, MessageModule],
  templateUrl: './app-input.component.html',
  styleUrls: ['./app-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' = 'text';
  @Input() disabled = false;
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

  update(value: string) {
    this.value = value;
    this.onChange(value);
  }

  onTouched(): void {
    this.onTouchedCallback();
  }
}
