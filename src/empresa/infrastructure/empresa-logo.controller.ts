import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../shared/infrastructure/adapters/in/decorators/public.decorator';
import {
  EmpresaLogoService,
  MAX_COMPANY_LOGO_BYTES,
} from './empresa-logo.service';

interface UploadedLogo {
  buffer: Buffer;
  size: number;
}

@Controller('empresas')
export class EmpresaLogoController {
  constructor(private readonly empresaLogo: EmpresaLogoService) {}

  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_COMPANY_LOGO_BYTES } }),
  )
  uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: UploadedLogo,
  ) {
    return this.empresaLogo.upload(id, file);
  }

  @Public()
  @Get('logos/:empresaId/:filename')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getLogo(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('filename') filename: string,
  ) {
    const logo = await this.empresaLogo.read(empresaId, filename);
    return new StreamableFile(logo.buffer, { type: logo.contentType });
  }
}
