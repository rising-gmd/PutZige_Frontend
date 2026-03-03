import { createActionGroup, emptyProps } from '@ngrx/store';

/**
 * Actions representing SignalR hub connection lifecycle transitions.
 * Dispatched by ConnectionEffects — never directly by UI components.
 */
export const ConnectionActions = createActionGroup({
  source: 'Connection',
  events: {
    /** Hub is fully connected and ready. */
    Connected: emptyProps(),
    /** Hub is attempting an automatic reconnect. */
    Reconnecting: emptyProps(),
    /** Hub connection was permanently closed (not reconnecting). */
    Disconnected: emptyProps(),
  },
});
