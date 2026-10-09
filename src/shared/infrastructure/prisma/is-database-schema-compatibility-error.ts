import { Prisma } from '@prisma/client';

const SCHEMA_MISMATCH_CODES = new Set(['P2021', 'P2022']);
const SCHEMA_MISMATCH_MESSAGE =
  /unknown column|no such column|column.{1,120}(does not exist|doesn't exist|not found)|unknown table|no such table|table.{1,120}(does not exist|doesn't exist|not found)|data truncated for column|incorrect.{1,120}value.{1,120}for column|(?:invalid|unknown).{1,80}enum|enum.{1,80}(invalid|truncated|unknown)/i;

export function isDatabaseSchemaCompatibilityError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (SCHEMA_MISMATCH_CODES.has(error.code)) return true;
  }

  if (!(error instanceof Error)) return false;
  const metadata =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? JSON.stringify(error.meta ?? {})
      : '';
  return SCHEMA_MISMATCH_MESSAGE.test(`${error.message} ${metadata}`);
}
