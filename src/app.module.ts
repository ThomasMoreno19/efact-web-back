import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClienteModule } from '@/cliente/infrastructure/cliente.module';
import { EmpresaModule } from '@/empresa/infrastructure/empresa.module';
import { EquipoModule } from '@/equipo/infrastructure/equipo.module';
import { MovimientoModule } from '@/movimiento/infrastructure/movimiento.module';
import { PrismaModule } from '@/shared/infrastructure/prisma/prisma.module';
import { ReadCacheModule } from '@/shared/infrastructure/cache/read-cache.module';
import { UsuarioModule } from '@/usuario/infrastructure/usuario.module';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { ExcelImportModule } from '@/excel-import/infrastructure/excel-import.module';
import { CatalogoAdminModule } from '@/catalogo-admin/infrastructure/catalogo-admin.module';
import { InternoModule } from '@/interno/infrastructure/interno.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ReadCacheModule,
    PrismaModule,
    EmpresaModule,
    EquipoModule,
    MovimientoModule,
    ClienteModule,
    UsuarioModule,
    AuthModule,
    ExcelImportModule,
    CatalogoAdminModule,
    InternoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
