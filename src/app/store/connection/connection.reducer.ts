import { createFeature, createReducer, on } from '@ngrx/store';
import { initialConnectionState } from './connection.state';
import { ConnectionActions } from './connection.actions';

export const connectionFeature = createFeature({
  name: 'connection',
  reducer: createReducer(
    initialConnectionState,
    on(ConnectionActions.connected, (state) => ({
      ...state,
      status: 'connected' as const,
    })),
    on(ConnectionActions.reconnecting, (state) => ({
      ...state,
      status: 'reconnecting' as const,
    })),
    on(ConnectionActions.disconnected, (state) => ({
      ...state,
      status: 'disconnected' as const,
    })),
  ),
});
