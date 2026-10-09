import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

const TOKEN_PREFIX = 'efact_excel_v1';

export function createCompanyExcelImportToken(empresaId: number): string {
  return `${TOKEN_PREFIX}_${empresaId}_${randomBytes(32).toString('base64url')}`;
}

export function deriveCompanyExcelImportEncryptionKey(secret: string): Buffer {
  return createHmac('sha256', secret)
    .update('efact-excel-import-token-encryption-v1')
    .digest();
}

export function encryptCompanyExcelImportToken(
  token: string,
  key: Buffer,
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptCompanyExcelImportToken(
  value: string,
  key: Buffer,
): string {
  const [version, ivValue, authTagValue, encryptedValue, ...rest] =
    value.split('.');
  if (
    version !== 'v1' ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue ||
    rest.length > 0
  ) {
    throw new Error('Invalid encrypted Excel import token.');
  }

  const iv = Buffer.from(ivValue, 'base64url');
  const authTag = Buffer.from(authTagValue, 'base64url');
  const encrypted = Buffer.from(encryptedValue, 'base64url');
  if (iv.length !== 12 || authTag.length !== 16 || encrypted.length === 0) {
    throw new Error('Invalid encrypted Excel import token.');
  }

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}
