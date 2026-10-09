import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Put,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateEmpresaUseCase } from '../../../application/use-cases/create-empresa/create-empresa.use-case';
import { DeleteEmpresaUseCase } from '../../../application/use-cases/delete-empresa/delete-empresa.use-case';
import { FindAllEmpresasUseCase } from '../../../application/use-cases/find-all-empresas/find-all-empresas.use-case';
import { FindEmpresaByIdUseCase } from '../../../application/use-cases/find-empresa-by-id/find-empresa-by-id.use-case';
import { UpdateEmpresaUseCase } from '../../../application/use-cases/update-empresa/update-empresa.use-case';
import { CreateEmpresaDto } from './dtos/create-empresa.dto';
import { UpdateEmpresaDto } from './dtos/update-empresa.dto';
import { ReplaceHorariosEmpresaDto } from './dtos/replace-horarios-empresa.dto';
import { EmpresaLogoService } from '../../empresa-logo.service';
import { FindHorariosEmpresaUseCase } from '../../../application/use-cases/find-horarios-empresa/find-horarios-empresa.use-case';
import { ReplaceHorariosEmpresaUseCase } from '../../../application/use-cases/replace-horarios-empresa/replace-horarios-empresa.use-case';
import { FindPublicEmpresaBySlugUseCase } from '../../../application/use-cases/find-public-empresa-by-slug/find-public-empresa-by-slug.use-case';
import { GetEmpresaExcelImportTokenUseCase } from '../../../application/use-cases/get-empresa-excel-import-token/get-empresa-excel-import-token.use-case';
import { Public } from '@/shared/infrastructure/adapters/in/decorators/public.decorator';

@Controller('empresas')
export class EmpresaController {
  constructor(
    private readonly findAllEmpresas: FindAllEmpresasUseCase,
    private readonly findEmpresaById: FindEmpresaByIdUseCase,
    private readonly createEmpresa: CreateEmpresaUseCase,
    private readonly updateEmpresa: UpdateEmpresaUseCase,
    private readonly deleteEmpresa: DeleteEmpresaUseCase,
    private readonly empresaLogo: EmpresaLogoService,
    private readonly findHorariosEmpresa: FindHorariosEmpresaUseCase,
    private readonly replaceHorariosEmpresa: ReplaceHorariosEmpresaUseCase,
    private readonly findPublicEmpresaBySlug: FindPublicEmpresaBySlugUseCase,
    private readonly getCompanyExcelImportToken: GetEmpresaExcelImportTokenUseCase,
  ) {}

  @Get()
  findAll() {
    return this.findAllEmpresas.execute();
  }

  @Public()
  @Get('slug/:slug')
  async findPublicBySlug(@Param('slug') slug: string) {
    const empresa = await this.findPublicEmpresaBySlug.execute(slug);
    if (!empresa) throw new NotFoundException();
    return empresa;
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.findEmpresaById.execute(id);
  }

  @Get(':id/excel-token')
  @Header('Cache-Control', 'no-store, private')
  getExcelImportToken(@Param('id', ParseIntPipe) id: number) {
    return this.getCompanyExcelImportToken.execute(id);
  }

  @Post()
  create(@Body() dto: CreateEmpresaDto) {
    return this.createEmpresa.execute(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmpresaDto) {
    return this.updateEmpresa.execute(id, dto);
  }

  @Get(':id/horarios')
  findHorarios(@Param('id', ParseIntPipe) id: number) {
    return this.findHorariosEmpresa.execute(id);
  }

  @Put(':id/horarios')
  replaceHorarios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceHorariosEmpresaDto,
  ) {
    return this.replaceHorariosEmpresa.execute(id, dto.horarios);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.deleteEmpresa.execute(id);
    await this.empresaLogo.removeCompanyDirectory(id);
  }
}
