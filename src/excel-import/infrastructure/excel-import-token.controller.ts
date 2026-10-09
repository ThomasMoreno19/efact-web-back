import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS,
  MAX_CATALOGO_IMAGEN_MANIFEST_BYTES,
  MAX_CATALOGO_REGISTRO_IMAGEN_BYTES,
} from '@/catalogo-admin/application/ports/catalog-image-import.port';
import { ImportarImagenesCatalogoUseCase } from '@/catalogo-admin/application/use-cases/importar-imagenes-catalogo.use-case';
import { ImportarLoteImagenesCatalogoUseCase } from '@/catalogo-admin/application/use-cases/importar-lote-imagenes-catalogo.use-case';
import { EnsureEmpresaExcelImportEnabledUseCase } from '@/empresa/application/use-cases/ensure-empresa-excel-import-enabled.use-case';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';
import { ExcelImportDto } from './dtos/excel-import.dto';
import { ExcelImportWithImagesDto } from './dtos/excel-import-with-images.dto';
import {
  ExcelImportService,
  MAX_EXCEL_IMPORT_BYTES,
} from './excel-import.service';
import {
  MAX_REPAIR_EXCEL_IMPORT_BYTES,
  RepairExcelImportService,
} from './reparacion-excel-import.service';
import {
  ExcelImportTokenGuard,
  type ExcelImportTokenRequest,
} from './excel-import-token.guard';

interface UploadedExcel {
  buffer: Buffer;
  size: number;
  originalname: string;
}

interface UploadedCatalogImage {
  buffer: Buffer;
  originalname: string;
  size: number;
}

type AuthenticatedExcelImportRequest = Request & ExcelImportTokenRequest;

@Public()
@UseGuards(ExcelImportTokenGuard)
@Controller('integraciones/excel')
export class ExcelImportTokenController {
  constructor(
    private readonly excelImport: ExcelImportService,
    private readonly repairExcelImport: RepairExcelImportService,
    private readonly catalogImages: ImportarImagenesCatalogoUseCase,
    private readonly uploadCatalogImagesUseCase: ImportarLoteImagenesCatalogoUseCase,
    private readonly ensureExcelEnabled: EnsureEmpresaExcelImportEnabledUseCase,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_EXCEL_IMPORT_BYTES,
        fieldSize: MAX_CATALOGO_IMAGEN_MANIFEST_BYTES,
        fields: 2,
        parts: 3,
      },
    }),
  )
  async importExcel(
    @Req() request: AuthenticatedExcelImportRequest,
    @Body() dto: ExcelImportWithImagesDto,
    @UploadedFile() file?: UploadedExcel,
  ) {
    const empresaId = request.excelImportEmpresaId!;
    const imageManifest = this.catalogImages.parse(dto.imageManifest ?? '[]');
    const imported = await this.excelImport.previewAndImport(
      empresaId,
      file,
      dto.mode,
    );
    const images = await this.catalogImages.executeParsed(
      empresaId,
      imageManifest,
    );

    return {
      ...imported,
      requiredImageHashes: images.requiredHashes,
      imagesReused: images.imagesReused,
      imagesUpdated: images.updated,
    };
  }

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_EXCEL_IMPORT_BYTES } }),
  )
  previewExcel(
    @Req() request: AuthenticatedExcelImportRequest,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.excelImport.preview(request.excelImportEmpresaId!, file);
  }

  @Post('reparacion')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_REPAIR_EXCEL_IMPORT_BYTES },
    }),
  )
  importRepairExcel(
    @Req() request: AuthenticatedExcelImportRequest,
    @Body() dto: ExcelImportDto,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.repairExcelImport.import(
      request.excelImportEmpresaId!,
      file,
      dto.mode,
    );
  }

  @Post('reparacion/preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_REPAIR_EXCEL_IMPORT_BYTES },
    }),
  )
  previewRepairExcel(
    @Req() request: AuthenticatedExcelImportRequest,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.repairExcelImport.preview(request.excelImportEmpresaId!, file);
  }

  @Post('imagenes/lote')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        files: MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS,
        fileSize: MAX_CATALOGO_REGISTRO_IMAGEN_BYTES,
        fieldSize: 2_000_000,
        parts: MAX_CATALOGO_IMAGENES_LOTE_ARCHIVOS + 2,
      },
    }),
  )
  async uploadCatalogImages(
    @Req() request: AuthenticatedExcelImportRequest,
    @Body('registros') records: unknown,
    @UploadedFiles() files?: UploadedCatalogImage[],
  ) {
    const empresaId = request.excelImportEmpresaId!;
    await this.ensureExcelEnabled.execute(empresaId);
    return this.uploadCatalogImagesUseCase.execute(empresaId, records, files);
  }
}
