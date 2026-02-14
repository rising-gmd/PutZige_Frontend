import { Pipe, PipeTransform } from '@angular/core';
import { formatConversationTime } from '../../core/utils/date.util';

@Pipe({
  name: 'conversationTime',
  standalone: true,
})
export class ConversationTimePipe implements PipeTransform {
  transform(value: Date | string | undefined | null): string {
    return formatConversationTime(value);
  }
}
