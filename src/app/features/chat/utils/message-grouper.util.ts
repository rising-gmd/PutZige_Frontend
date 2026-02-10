import { Message, MessageGroup } from '../models/message.model';
import { UI_CONSTANTS } from '../../../core/constants/ui.constants';

/** Maximum time gap between messages in same group (2 minutes) */
const MESSAGE_GROUP_THRESHOLD_MS = UI_CONSTANTS.MESSAGE_GROUP_THRESHOLD_MS;

/**
 * Group consecutive messages from same sender within 2 minutes
 */
export function groupMessages(
  messages: Message[],
  currentUserId: string,
): MessageGroup[] {
  if (!messages || messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    const sender = message.senderId === currentUserId ? 'me' : 'them';

    if (
      !currentGroup ||
      currentGroup.sender !== sender ||
      shouldStartNewGroup(currentGroup.timestamp, message.sentAt)
    ) {
      currentGroup = { sender, messages: [message], timestamp: message.sentAt };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
    }
  }

  return groups;
}

function shouldStartNewGroup(lastTime: Date, newTime: Date): boolean {
  const diffMs = newTime.getTime() - lastTime.getTime();
  return diffMs > MESSAGE_GROUP_THRESHOLD_MS;
}

export function shouldShowDateDivider(
  prevMessage: Message | null,
  currentMessage: Message,
): boolean {
  if (!prevMessage) return true;
  return !isSameDay(prevMessage.sentAt, currentMessage.sentAt);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
