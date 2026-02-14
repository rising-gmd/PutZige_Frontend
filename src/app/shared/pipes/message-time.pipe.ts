import { Pipe, PipeTransform } from '@angular/core';
import { formatMessageTime } from '../../core/utils/date.util';

@Pipe({
  name: 'messageTime',
  standalone: true,
})
export class MessageTimePipe implements PipeTransform {
  transform(value: Date | string | undefined | null): string {
    return formatMessageTime(value);
  }
}
