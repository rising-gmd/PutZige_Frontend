export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface TokenResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}
