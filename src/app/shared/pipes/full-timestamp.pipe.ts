import { Pipe, PipeTransform } from '@angular/core';
import { formatFullTimestamp } from '../../core/utils/date.util';

@Pipe({
  name: 'fullTimestamp',
  standalone: true,
})
export class FullTimestampPipe implements PipeTransform {
  transform(value: Date | string | undefined | null): string {
    return formatFullTimestamp(value);
  }
}
