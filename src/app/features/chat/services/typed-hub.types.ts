import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { SignalREventMap } from './signalr-events.constants';

/**
 * Type-safe façade over HubConnection.
 *
 * Exposes `on` / `off` with a generic constrained to `SignalREventMap`,
 * so every handler receives its exact payload type — no `unknown` casts.
 * The underlying cast to `(...args: unknown[]) => void` is isolated here
 * and never leaks to callers.
 */
export class TypedHubConnection {
  constructor(private readonly hub: HubConnection) {}

  on<E extends keyof SignalREventMap>(
    event: E,
    handler: (payload: SignalREventMap[E]) => void,
  ): void {
    this.hub.on(event, handler as (...args: unknown[]) => void);
  }

  off<E extends keyof SignalREventMap>(
    event: E,
    handler: (payload: SignalREventMap[E]) => void,
  ): void {
    this.hub.off(event, handler as (...args: unknown[]) => void);
  }

  invoke<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
    return this.hub.invoke<T>(methodName, ...args);
  }

  start(): Promise<void> {
    return this.hub.start();
  }

  stop(): Promise<void> {
    return this.hub.stop();
  }

  get state(): HubConnectionState {
    return this.hub.state;
  }

  get connectionId(): string | null {
    return this.hub.connectionId;
  }

  onreconnecting(cb: (err?: Error) => void): void {
    this.hub.onreconnecting(cb);
  }

  onreconnected(cb: (connectionId?: string) => void): void {
    this.hub.onreconnected(cb);
  }

  onclose(cb: (err?: Error) => void): void {
    this.hub.onclose(cb);
  }
}
