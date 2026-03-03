import { createSelector } from '@ngrx/store';
import { connectionFeature } from './connection.reducer';

export const { selectStatus: selectConnectionStatus } = connectionFeature;

/** True while the hub is performing an automatic reconnect. */
export const selectIsReconnecting = createSelector(
  selectConnectionStatus,
  (status) => status === 'reconnecting',
);

/** True when the hub is fully operational. */
export const selectIsConnected = createSelector(
  selectConnectionStatus,
  (status) => status === 'connected',
);

/** True when the hub is permanently disconnected (not reconnecting). */
export const selectIsDisconnected = createSelector(
  selectConnectionStatus,
  (status) => status === 'disconnected',
);

/** True when the connection is degraded — show banner in UI. */
export const selectShowConnectionBanner = createSelector(
  selectConnectionStatus,
  (status) => status !== 'connected',
);
