/** Global online presence and per-conversation typing state. */
export interface PresenceState {
  /** IDs of users currently online across all conversations. */
  onlineUserIds: string[];
  /**
   * Maps conversationId → list of userIds currently typing in that conversation.
   */
  typingMap: Record<string, string[]>;
}

export const initialPresenceState: PresenceState = {
  onlineUserIds: [],
  typingMap: {},
};
