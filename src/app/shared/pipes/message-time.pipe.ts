import { Pipe, PipeTransform, inject } from '@angular/core';
import { TimezoneService } from '../../core/services/timezone.service';

@Pipe({
  name: 'messageTime',
  standalone: true,
  pure: false,
})
export class MessageTimePipe implements PipeTransform {
  private readonly tz = inject(TimezoneService);

  transform(value: Date | string | undefined | null): string {
    return this.tz.formatMessage(value);
  }
}
