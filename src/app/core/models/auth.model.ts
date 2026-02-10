// DTOs matching backend API contracts
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  email: string;
  username: string;
  displayName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Runtime auth state
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly username?: string;
  readonly profilePictureUrl?: string;
}

export interface AuthState {
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export interface TokenPayload {
  readonly sub: string; // user id
  readonly email: string;
  readonly exp: number; // expiration timestamp
  readonly iat: number; // issued at timestamp
  readonly iss?: string; // issuer
}
