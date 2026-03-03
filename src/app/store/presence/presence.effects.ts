import { Injectable } from '@angular/core';

/**
 * PresenceEffects — intentionally empty.
 *
 * All WebSocket → store bridges for presence events are co-located in
 * ChatEffects (listenUserOnline$, listenUserOffline$, listenTypingStart$,
 * listenTypingStop$) so that the chat page's one-time SignalR setup owns
 * the full event lifecycle in a single place.
 *
 * This class is registered via provideEffects([ChatEffects, MessagesEffects,
 * PresenceEffects]) to keep the effects manifest consistent — add effect
 * members here if presence events gain dedicated logic (e.g. presence
 * heartbeat, last-seen updates) independent of the chat slice.
 */
@Injectable()
export class PresenceEffects {}
