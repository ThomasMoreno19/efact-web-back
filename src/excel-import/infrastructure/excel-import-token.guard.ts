import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CompanyExcelImportTokenService } from '@/shared/infrastructure/security/company-excel-import-token.service';

export interface ExcelImportTokenRequest extends Request {
  excelImportEmpresaId?: number;
}

@Injectable()
export class ExcelImportTokenGuard implements CanActivate {
  constructor(private readonly tokens: CompanyExcelImportTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<ExcelImportTokenRequest>();
    const match = /^Bearer\s+(.+)$/i.exec(request.headers.authorization ?? '');
    const token = match?.[1]?.trim();
    if (!token) throw new UnauthorizedException();

    const empresaId = await this.tokens.authenticate(token);
    if (empresaId === null) throw new UnauthorizedException();

    request.excelImportEmpresaId = empresaId;
    return true;
  }
}
