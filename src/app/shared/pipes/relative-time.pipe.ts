import { Pipe, PipeTransform, inject } from '@angular/core';
import { TimezoneService } from '../../core/services/timezone.service';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: false,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly tz = inject(TimezoneService);

  transform(value: Date | string | undefined | null): string {
    return this.tz.formatRelative(value);
  }
}
