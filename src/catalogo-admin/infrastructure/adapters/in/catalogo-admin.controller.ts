import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DeleteCatalogoRegistroUseCase } from '../../../application/use-cases/delete-catalogo-registro.use-case';
import { FindCatalogoListaUseCase } from '../../../application/use-cases/find-catalogo-lista.use-case';
import { UpdateCatalogoRegistroUseCase } from '../../../application/use-cases/update-catalogo-registro.use-case';
import { CatalogoLista } from '../../../application/ports/catalogo-admin.repository';
import { UpdateCatalogoRegistroDto } from './dtos/update-catalogo-registro.dto';
import { UpdateCatalogoRegistroImagenDto } from './dtos/update-catalogo-registro-imagen.dto';
import { CatalogoRegistroImagenService } from '../../catalogo-registro-imagen.service';
import { MAX_CATALOGO_REGISTRO_IMAGEN_BYTES } from '../../../application/ports/catalog-image-import.port';

interface UploadedCatalogImage {
  buffer: Buffer;
  originalname: string;
  size: number;
}

@Controller('empresas/:empresaId/catalogo')
export class CatalogoAdminController {
  constructor(
    private readonly findCatalogoLista: FindCatalogoListaUseCase,
    private readonly updateCatalogoRegistro: UpdateCatalogoRegistroUseCase,
    private readonly deleteCatalogoRegistro: DeleteCatalogoRegistroUseCase,
    private readonly recordImage: CatalogoRegistroImagenService,
  ) {}

  @Get(':lista')
  findAll(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('lista', new ParseEnumPipe(CatalogoLista)) lista: CatalogoLista,
    @Query('offset') offsetValue?: string,
    @Query('search') searchValue?: string,
  ) {
    const offset = parseOffset(offsetValue);
    const searchWords = parseSearchWords(searchValue);
    return this.findCatalogoLista.execute(
      empresaId,
      lista,
      searchWords,
      offset,
      30,
    );
  }

  @Patch(':lista/:id')
  async update(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('lista', new ParseEnumPipe(CatalogoLista)) lista: CatalogoLista,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogoRegistroDto,
  ) {
    validateRecordId(lista, id);
    const record = await this.updateCatalogoRegistro.execute(
      empresaId,
      lista,
      id,
      dto,
    );
    if (record === null) {
      throw new NotFoundException('No se encontró el registro.');
    }
    return record;
  }

  @Patch(':lista/:id/imagen')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CATALOGO_REGISTRO_IMAGEN_BYTES },
    }),
  )
  async updateWithImage(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('lista', new ParseEnumPipe(CatalogoLista)) lista: CatalogoLista,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogoRegistroImagenDto,
    @UploadedFile() file?: UploadedCatalogImage,
  ) {
    validateRecordId(lista, id);
    if (!isImageCollection(lista)) {
      throw new BadRequestException('Esta lista no admite imágenes.');
    }
    const data = await parseUpdateData(dto.data);
    return this.recordImage.updateWithImage(empresaId, lista, id, data, file);
  }

  @Delete(':lista/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('lista', new ParseEnumPipe(CatalogoLista)) lista: CatalogoLista,
    @Param('id') id: string,
  ) {
    validateRecordId(lista, id);
    const deleted = await this.deleteCatalogoRegistro.execute(
      empresaId,
      lista,
      id,
    );
    if (!deleted) throw new NotFoundException('No se encontró el registro.');
    await this.recordImage.removeRecordFiles(empresaId, lista, id);
  }
}

async function parseUpdateData(value: string) {
  let payload: unknown;
  try {
    payload = JSON.parse(value);
  } catch {
    throw new BadRequestException('Los datos del registro no son válidos.');
  }
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new BadRequestException('Los datos del registro no son válidos.');
  }

  const dto = plainToInstance(UpdateCatalogoRegistroDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    throw new BadRequestException(
      errors.flatMap((error) => Object.values(error.constraints ?? {})),
    );
  }
  return dto;
}

function isImageCollection(
  lista: CatalogoLista,
): lista is 'articulos' | 'marcas' | 'proveedores' | 'rubros' {
  return (
    lista === 'articulos' ||
    lista === 'marcas' ||
    lista === 'proveedores' ||
    lista === 'rubros'
  );
}

function parseOffset(value?: string) {
  if (value === undefined) return 0;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(
      'El desplazamiento de la lista no es válido.',
    );
  }

  const offset = Number(value);
  if (!Number.isSafeInteger(offset)) {
    throw new BadRequestException(
      'El desplazamiento de la lista no es válido.',
    );
  }
  return offset;
}

function parseSearchWords(value?: string) {
  if (value === undefined || value.trim() === '') return [];
  if (value.length > 100) {
    throw new BadRequestException(
      'La búsqueda no puede superar 100 caracteres.',
    );
  }
  return value.trim().split(/\s+/);
}

function validateRecordId(lista: CatalogoLista, id: string) {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException(
      'El identificador del registro no es válido.',
    );
  }

  if (lista === 'articulos') {
    if (BigInt(id) > 9_223_372_036_854_775_807n) {
      throw new BadRequestException(
        'El identificador del registro no es válido.',
      );
    }
    return;
  }

  if (!Number.isSafeInteger(Number(id))) {
    throw new BadRequestException(
      'El identificador del registro no es válido.',
    );
  }
}
