import { createActionGroup, props } from '@ngrx/store';

/**
 * Actions dispatched by SignalR effects when user presence changes.
 * Source: 'Presence'
 */
export const PresenceActions = createActionGroup({
  source: 'Presence',
  events: {
    /** Remote user's client connected or became active. */
    'User Came Online': props<{ userId: string }>(),

    /** Remote user's client disconnected or went idle. */
    'User Went Offline': props<{ userId: string }>(),

    /** Remote user started typing in a conversation. */
    'User Started Typing': props<{
      conversationId: string;
      userId: string;
    }>(),

    /** Remote user stopped typing (debounced on the server side). */
    'User Stopped Typing': props<{
      conversationId: string;
      userId: string;
    }>(),
  },
});
