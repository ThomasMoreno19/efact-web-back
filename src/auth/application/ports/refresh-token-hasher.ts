export const REFRESH_TOKEN_HASHER = Symbol('REFRESH_TOKEN_HASHER');

export interface RefreshTokenHasher {
  hash(token: string): string;
  matches(token: string, tokenHash: string): boolean;
}
