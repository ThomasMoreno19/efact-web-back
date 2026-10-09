export const AUTH_TOKEN_PROVIDER = Symbol('AUTH_TOKEN_PROVIDER');

export interface AuthTokenProvider {
  readonly accessTokenExpiresInSeconds: number;
  readonly refreshTokenExpiresInSeconds: number;
  issueAccessToken(userId: number): Promise<string>;
  issueRefreshToken(userId: number): Promise<string>;
  verifyAccessToken(token: string): Promise<number | null>;
  verifyRefreshToken(token: string): Promise<number | null>;
}
