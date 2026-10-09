import { Injectable } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { RefreshTokenHasher } from '../../../application/ports/refresh-token-hasher';

@Injectable()
export class Sha256RefreshTokenHasher implements RefreshTokenHasher {
  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  matches(token: string, tokenHash: string): boolean {
    if (!/^[a-f0-9]{64}$/i.test(tokenHash)) return false;

    const expected = Buffer.from(tokenHash, 'hex');
    const actual = Buffer.from(this.hash(token), 'hex');
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}
