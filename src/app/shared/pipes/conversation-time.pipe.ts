import { Pipe, PipeTransform, inject } from '@angular/core';
import { TimezoneService } from '../../core/services/timezone.service';

@Pipe({
  name: 'conversationTime',
  standalone: true,
  pure: false,
})
export class ConversationTimePipe implements PipeTransform {
  private readonly tz = inject(TimezoneService);

  transform(value: Date | string | undefined | null): string {
    return this.tz.formatConversation(value);
  }
}
