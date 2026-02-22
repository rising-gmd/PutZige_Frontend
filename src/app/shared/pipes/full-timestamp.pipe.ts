import { Pipe, PipeTransform, inject } from '@angular/core';
import { TimezoneService } from '../../core/services/timezone.service';

@Pipe({
  name: 'fullTimestamp',
  standalone: true,
  pure: false,
})
export class FullTimestampPipe implements PipeTransform {
  private readonly tz = inject(TimezoneService);

  transform(value: Date | string | undefined | null): string {
    return this.tz.formatFull(value);
  }
}
