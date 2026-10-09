import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ExcelImportService,
  MAX_EXCEL_IMPORT_BYTES,
} from './excel-import.service';
import { ExcelImportDto } from './dtos/excel-import.dto';
import {
  MAX_REPAIR_EXCEL_IMPORT_BYTES,
  RepairExcelImportService,
} from './reparacion-excel-import.service';

interface UploadedExcel {
  buffer: Buffer;
  size: number;
  originalname: string;
}

@Controller('empresas')
export class ExcelImportController {
  constructor(
    private readonly excelImport: ExcelImportService,
    private readonly repairExcelImport: RepairExcelImportService,
  ) {}

  @Post(':id/excel')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_EXCEL_IMPORT_BYTES } }),
  )
  importExcel(
    @Param('id', ParseIntPipe) empresaId: number,
    @Body() dto: ExcelImportDto,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.excelImport.import(empresaId, file, dto.mode);
  }

  @Post(':id/excel/preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_EXCEL_IMPORT_BYTES } }),
  )
  previewExcel(
    @Param('id', ParseIntPipe) empresaId: number,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.excelImport.preview(empresaId, file);
  }

  @Post(':id/excel/reparacion')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_REPAIR_EXCEL_IMPORT_BYTES },
    }),
  )
  importRepairExcel(
    @Param('id', ParseIntPipe) empresaId: number,
    @Body() dto: ExcelImportDto,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.repairExcelImport.import(empresaId, file, dto.mode);
  }

  @Post(':id/excel/reparacion/preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_REPAIR_EXCEL_IMPORT_BYTES },
    }),
  )
  previewRepairExcel(
    @Param('id', ParseIntPipe) empresaId: number,
    @UploadedFile() file?: UploadedExcel,
  ) {
    return this.repairExcelImport.preview(empresaId, file);
  }
}
