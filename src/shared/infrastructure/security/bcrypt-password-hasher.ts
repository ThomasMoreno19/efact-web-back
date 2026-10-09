import { BadRequestException, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException(
        'La contraseña no puede superar 72 bytes en UTF-8.',
      );
    }
    return hash(password, 10);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return false;
    }
    return compare(password, passwordHash);
  }
}
