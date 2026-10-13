import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { FindAdminByEmpresaUseCase } from '../../../application/use-cases/find-admin-by-empresa/find-admin-by-empresa.use-case';
import { UpsertAdminByEmpresaCommand } from '../../../application/use-cases/upsert-admin-by-empresa/upsert-admin-by-empresa.command';
import { UpsertAdminByEmpresaUseCase } from '../../../application/use-cases/upsert-admin-by-empresa/upsert-admin-by-empresa.use-case';
import { UpsertAdminEmpresaDto } from './dtos/upsert-admin-empresa.dto';
import { UpdateAdminCredentialsByEmpresaDto } from './dtos/update-admin-credentials-by-empresa.dto';
import { UpdateAdminCredentialsByEmpresaCommand } from '../../../application/use-cases/update-admin-credentials-by-empresa/update-admin-credentials-by-empresa.command';
import { UpdateAdminCredentialsByEmpresaUseCase } from '../../../application/use-cases/update-admin-credentials-by-empresa/update-admin-credentials-by-empresa.use-case';

@Controller('empresas/:idEmpresa/usuario-admin')
export class UsuarioAdminEmpresaController {
  constructor(
    private readonly findAdminByEmpresa: FindAdminByEmpresaUseCase,
    private readonly upsertAdminByEmpresa: UpsertAdminByEmpresaUseCase,
    private readonly updateAdminCredentials: UpdateAdminCredentialsByEmpresaUseCase,
  ) {}

  @Get()
  find(@Param('idEmpresa', ParseIntPipe) idEmpresa: number) {
    return this.findAdminByEmpresa.execute(idEmpresa);
  }

  @Put()
  upsert(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: UpsertAdminEmpresaDto,
  ) {
    return this.upsertAdminByEmpresa.execute(
      idEmpresa,
      new UpsertAdminByEmpresaCommand(dto.nombre, dto.contrasena),
    );
  }

  @Patch()
  updateCredentials(
    @Param('idEmpresa', ParseIntPipe) idEmpresa: number,
    @Body() dto: UpdateAdminCredentialsByEmpresaDto,
  ) {
    return this.updateAdminCredentials.execute(
      idEmpresa,
      new UpdateAdminCredentialsByEmpresaCommand(
        dto.nombre,
        dto.contrasenaActual,
        dto.contrasenaNueva,
      ),
    );
  }
}
