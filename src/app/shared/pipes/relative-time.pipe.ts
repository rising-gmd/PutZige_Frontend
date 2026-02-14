import { Pipe, PipeTransform } from '@angular/core';
import { formatRelativeTime } from '../../core/utils/date.util';

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date | string | undefined | null): string {
    return formatRelativeTime(value);
  }
}
