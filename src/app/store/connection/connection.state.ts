/** Discriminated union for hub connection lifecycle states. */
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
}

export const initialConnectionState: ConnectionState = {
  status: 'disconnected',
};
