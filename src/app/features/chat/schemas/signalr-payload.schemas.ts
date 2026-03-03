/**
 * Zod runtime schemas for SignalR wire payloads.
 *
 * These are the source of truth for what the hub is allowed to send.
 * TypeScript interfaces in signalr-events.constants.ts are derived from
 * these schemas — if the two diverge, the schema wins at runtime.
 *
 * Only the three high-risk hot paths are validated here:
 *  - ReceiveMessage (every inbound message)
 *  - MessageSent    (ACK carrying tempId for reconciliation)
 *  - ConversationCreated (structural changes to the conversation list)
 *
 * Lighter utility payloads (MessageDelivered, MessageRead, UserStatus,
 * Typing) are validated inline but kept simpler — they carry only IDs
 * and timestamps so the surface area is small.
 */
import { z } from 'zod';

// ── Reusable primitives ─────────────────────────────────────────────────────

/** Accepts an ISO string or a native Date — mapper handles the conversion. */
const dateOrString = z.union([z.string(), z.date()]);

/** Non-empty string — rejects blank whitespace-only values. */
const nonEmptyString = z.string().min(1);

// ── Hot-path schemas ────────────────────────────────────────────────────────

export const ReceiveMessagePayloadSchema = z
  .object({
    id: z.string().optional(),
    messageId: z.string().optional(),
    senderId: nonEmptyString,
    receiverId: nonEmptyString,
    messageText: nonEmptyString,
    sentAt: dateOrString.optional(),
    deliveredAt: dateOrString.optional(),
    readAt: dateOrString.optional(),
    conversationId: z.string().optional(),
    unreadCount: z.number().int().nonnegative().optional(),
  })
  .refine((d) => Boolean(d.id ?? d.messageId), {
    message: 'ReceiveMessage: either id or messageId must be present',
  });

export const MessageSentPayloadSchema = z.object({
  conversationId: nonEmptyString,
  messageId: nonEmptyString,
  senderId: nonEmptyString,
  receiverId: nonEmptyString,
  messageText: nonEmptyString,
  sentAt: dateOrString,
  tempId: z.string().optional(),
});

export const ConversationCreatedPayloadSchema = z.object({
  conversationId: nonEmptyString,
  userId: z.string().optional(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  isOnline: z.boolean().optional(),
  lastActivity: z.string().optional(),
});

// ── Utility schemas ─────────────────────────────────────────────────────────

export const MessageDeliveredPayloadSchema = z.object({
  messageId: nonEmptyString,
  deliveredAt: dateOrString,
});

export const MessageReadPayloadSchema = z.object({
  messageId: nonEmptyString,
  readAt: dateOrString,
});

export const UserStatusPayloadSchema = z.object({
  userId: nonEmptyString,
  lastSeen: dateOrString.optional(),
});

export const TypingPayloadSchema = z.object({
  userId: nonEmptyString,
  conversationId: nonEmptyString,
});

export const HubErrorPayloadSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

// ── Inferred TypeScript types ───────────────────────────────────────────────
// Use these as the canonical DTO type — they stay in sync with the schema.

export type ParsedReceiveMessagePayload = z.infer<
  typeof ReceiveMessagePayloadSchema
>;
export type ParsedMessageSentPayload = z.infer<typeof MessageSentPayloadSchema>;
export type ParsedConversationCreatedPayload = z.infer<
  typeof ConversationCreatedPayloadSchema
>;
