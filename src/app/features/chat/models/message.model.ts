/**
 * Message domain model used at runtime.
 */
export interface Message {
  readonly id: string;
  readonly senderId: string;
  readonly receiverId: string;
  readonly messageText: string;
  readonly sentAt: Date;
  readonly deliveredAt?: Date;
  readonly readAt?: Date;
  /** Optional conversation id associated with the message (provided by server) */
  readonly conversationId?: string;
  /** Server-provided unread count for the conversation at the time this message was sent */
  readonly unreadCount?: number;
  /** Marked for optimistic UI before server ack */
  readonly isOptimistic?: boolean;
  /** Temporary client-side id used for optimistic messages */
  readonly tempId?: string;
  /**
   * Explicit send status for optimistic messages.
   * Set to 'sending' on optimistic add, 'sent'/'delivered'/'read' on ack,
   * 'failed' on send failure. Undefined for messages loaded from history.
   */
  readonly status?: MessageStatus;
  /**
   * Attached media or files. UI renders stubs now; backend wire-up is a
   * separate milestone.  Array allows multi-image grids without a model change.
   */
  readonly attachments?: MessageAttachment[];
}

/**
 * Status enum used for UI state and telemetry
 */
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Group of messages for rendering (e.g. consecutive messages from same sender)
 */
export interface MessageGroup {
  sender: 'me' | 'them';
  messages: Message[];
  timestamp: Date;
}

/**
 * Supported attachment variants — discriminated on `type`.
 * Adding a new case here automatically surfaces a compile error in the
 * exhaustive @switch in message-bubble.component.html.
 */
export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
}

/**
 * Discriminated union for a single message attachment.
 * Multi-image grids are modelled as `attachments: MessageAttachment[]` on
 * Message — avoids a breaking shape change when the backend supports it.
 */
export interface MessageAttachment {
  readonly id: string;
  readonly type: AttachmentType;
  /** Full-resolution URL — used by p-image src and video src */
  readonly url: string;
  /** Low-res placeholder shown while p-image lazy-loads */
  readonly thumbnailUrl?: string;
  /** Original filename shown in file-chip and alt text */
  readonly fileName?: string;
  /** Raw byte size — formatted to KB/MB in the template */
  readonly fileSize?: number;
  /** MIME type — e.g. 'application/pdf', 'video/mp4' */
  readonly mimeType?: string;
  /**
   * Intrinsic width/height in px.
   * Providing these prevents CLS (layout shift) while p-image loads.
   */
  readonly width?: number;
  readonly height?: number;
  /** Duration in whole seconds — displayed on video/audio cards */
  readonly durationSecs?: number;
}
