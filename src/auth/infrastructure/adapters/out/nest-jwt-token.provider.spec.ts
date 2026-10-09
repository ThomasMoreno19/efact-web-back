/// <reference types="jest" />

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NestJwtTokenProvider } from './nest-jwt-token.provider';

describe('NestJwtTokenProvider', () => {
  const values: Record<string, string> = {
    JWT_SECRET: 'a'.repeat(40),
    JWT_REFRESH_SECRET: 'b'.repeat(40),
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  };
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
  const provider = new NestJwtTokenProvider(new JwtService({}), config);

  it('uses the configured 15-minute and 7-day lifetimes', () => {
    expect(provider.accessTokenExpiresInSeconds).toBe(900);
    expect(provider.refreshTokenExpiresInSeconds).toBe(604_800);
  });

  it('issues distinct access and refresh JWTs and checks their token purpose', async () => {
    const accessToken = await provider.issueAccessToken(42);
    const refreshToken = await provider.issueRefreshToken(42);

    expect(accessToken.split('.')).toHaveLength(3);
    expect(refreshToken.split('.')).toHaveLength(3);
    expect(await provider.verifyAccessToken(accessToken)).toBe(42);
    expect(await provider.verifyRefreshToken(refreshToken)).toBe(42);
    expect(await provider.verifyAccessToken(refreshToken)).toBeNull();
    expect(await provider.verifyRefreshToken(accessToken)).toBeNull();
  });

  it('falls back to the legacy access secret and derives a distinct refresh secret', async () => {
    const legacyProvider = new NestJwtTokenProvider(new JwtService({}), {
      get: (key: string) =>
        key === 'AUTH_TOKEN_SECRET'
          ? 'legacy-secret'.padEnd(40, 'x')
          : undefined,
    } as unknown as ConfigService);
    const accessToken = await legacyProvider.issueAccessToken(9);
    const refreshToken = await legacyProvider.issueRefreshToken(9);

    expect(await legacyProvider.verifyAccessToken(accessToken)).toBe(9);
    expect(await legacyProvider.verifyRefreshToken(refreshToken)).toBe(9);
    expect(await legacyProvider.verifyAccessToken(refreshToken)).toBeNull();
  });
});
