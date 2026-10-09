import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID } from 'node:crypto';
import type { AuthTokenProvider } from '../../../application/ports/auth-token-provider';

type TokenUse = 'access' | 'refresh';

interface TokenPayload {
  sub: number;
  tokenUse: TokenUse;
  jti: string;
}

const DURATION_UNITS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
};

@Injectable()
export class NestJwtTokenProvider implements AuthTokenProvider {
  readonly accessTokenExpiresInSeconds: number;
  readonly refreshTokenExpiresInSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTokenExpiresInSeconds = this.readDuration(
      'JWT_EXPIRES_IN',
      '15m',
    );
    this.refreshTokenExpiresInSeconds = this.readDuration(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
  }

  issueAccessToken(userId: number): Promise<string> {
    return this.issue(
      userId,
      'access',
      this.accessSecret(),
      this.accessTokenExpiresInSeconds,
    );
  }

  issueRefreshToken(userId: number): Promise<string> {
    return this.issue(
      userId,
      'refresh',
      this.refreshSecret(),
      this.refreshTokenExpiresInSeconds,
    );
  }

  verifyAccessToken(token: string): Promise<number | null> {
    return this.verify(token, 'access', this.accessSecret());
  }

  verifyRefreshToken(token: string): Promise<number | null> {
    return this.verify(token, 'refresh', this.refreshSecret());
  }

  private issue(
    userId: number,
    tokenUse: TokenUse,
    secret: string,
    expiresIn: number,
  ): Promise<string> {
    const payload: TokenPayload = { sub: userId, tokenUse, jti: randomUUID() };
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  private async verify(
    token: string,
    tokenUse: TokenUse,
    secret: string,
  ): Promise<number | null> {
    try {
      const payload = await this.jwt.verifyAsync<Partial<TokenPayload>>(token, {
        secret,
      });
      if (
        payload.tokenUse !== tokenUse ||
        !Number.isSafeInteger(payload.sub) ||
        (payload.sub ?? 0) < 1
      ) {
        return null;
      }
      return payload.sub as number;
    } catch {
      return null;
    }
  }

  private accessSecret(): string {
    const secret =
      this.config.get<string>('JWT_SECRET') ||
      this.config.get<string>('AUTH_TOKEN_SECRET');
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new InternalServerErrorException(
        'La clave de firma de JWT debe tener al menos 32 bytes.',
      );
    }
    return secret;
  }

  private refreshSecret(): string {
    const secret =
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      createHmac('sha256', this.accessSecret())
        .update('efact-refresh-token')
        .digest('hex');
    if (Buffer.byteLength(secret, 'utf8') < 32) {
      throw new InternalServerErrorException(
        'La clave de firma de refresh JWT debe tener al menos 32 bytes.',
      );
    }
    return secret;
  }

  private readDuration(key: string, defaultValue: string): number {
    const value = this.config.get<string>(key) ?? defaultValue;
    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
    if (!match) {
      throw new InternalServerErrorException(
        `${key} debe tener formato <número>s, m, h o d.`,
      );
    }
    const seconds = Number(match[1]) * DURATION_UNITS[match[2]];
    if (!Number.isSafeInteger(seconds) || seconds < 1) {
      throw new InternalServerErrorException(
        `${key} no es una duración válida.`,
      );
    }
    return seconds;
  }
}
