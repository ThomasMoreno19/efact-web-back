import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { CatalogoRegistroImagenService } from '../../catalogo-registro-imagen.service';

@Controller('empresas')
export class CatalogoRegistroImagenController {
  constructor(private readonly recordImage: CatalogoRegistroImagenService) {}

  @Public()
  @Get('media/:empresaId/:lista/:recordId/:filename')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async read(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('lista') lista: string,
    @Param('recordId') recordId: string,
    @Param('filename') filename: string,
  ) {
    const image = await this.recordImage.read(
      empresaId,
      lista,
      recordId,
      filename,
    );
    return new StreamableFile(image.buffer, { type: image.contentType });
  }

  @Public()
  @Get('media/:empresaId/hash/:sha256')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async readHashed(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('sha256') sha256: string,
  ) {
    const image = await this.recordImage.readHashed(empresaId, sha256);
    return new StreamableFile(image.buffer, { type: image.contentType });
  }
}
