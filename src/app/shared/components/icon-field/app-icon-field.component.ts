import {
  Component,
  forwardRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormsModule,
} from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-icon-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './app-icon-field.component.html',
  styleUrls: ['./app-icon-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppIconFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconFieldComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() iconClass = 'pi pi-search';
  @Input() iconPosition: 'left' | 'right' = 'left';

  // support both CVA and simple input binding
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() enter = new EventEmitter<string>();

  private onChange: (v: string) => void = () => void 0;
  private onTouched: () => void = () => void 0;

  writeValue(obj: string): void {
    this.value = obj ?? '';
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.value = v;
    this.onChange(v);
    this.valueChange.emit(v);
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.enter.emit(this.value);
    }
  }
}
