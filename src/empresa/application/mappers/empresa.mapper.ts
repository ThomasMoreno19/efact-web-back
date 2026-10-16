import { Empresa } from '../../domain/empresa.entity';
import { CreateEmpresaCommand } from '../use-cases/create-empresa/create-empresa.command';
import { UpdateEmpresaCommand } from '../use-cases/update-empresa/update-empresa.command';

export class EmpresaMapper {
  static toDomain(command: CreateEmpresaCommand): Empresa {
    return Empresa.create({
      nombre: command.nombre,
      slug: command.slug,
      telefono: command.telefono,
      ubicacion: command.ubicacion,
      logo_url: command.logo_url,
      fecha_creacion: command.fecha_creacion,
      configuracion: {
        tieneCarrito: command.tieneCarrito,
        habilitarExcel: command.habilitarExcel,
        catalogoHabilitado: command.catalogoHabilitado,
        saldosHabilitados: command.saldosHabilitados,
        reparacionesHabilitadas: command.reparacionesHabilitadas,
        mostrarNavegacionPaginas: command.mostrarNavegacionPaginas,
        imagenesEnArticulos: command.imagenesEnArticulos,
        incluirHorarios: command.incluirHorarios,
        pedidosFueraHorario: command.pedidosFueraHorario,
        incluirCodigoBarra: command.incluirCodigoBarra,
        toleranciaMinDias: command.toleranciaMinDias,
        toleranciaMaxDias: command.toleranciaMaxDias,
      },
    });
  }

  static applyUpdate(empresa: Empresa, command: UpdateEmpresaCommand): void {
    empresa.update({
      nombre: command.nombre,
      slug: command.slug,
      telefono: command.telefono,
      ubicacion: command.ubicacion,
      logo_url: command.logo_url,
      fecha_creacion: command.fecha_creacion,
      configuracion: {
        tieneCarrito: command.tieneCarrito,
        habilitarExcel: command.habilitarExcel,
        catalogoHabilitado: command.catalogoHabilitado,
        saldosHabilitados: command.saldosHabilitados,
        reparacionesHabilitadas: command.reparacionesHabilitadas,
        mostrarNavegacionPaginas: command.mostrarNavegacionPaginas,
        imagenesEnArticulos: command.imagenesEnArticulos,
        incluirHorarios: command.incluirHorarios,
        pedidosFueraHorario: command.pedidosFueraHorario,
        incluirCodigoBarra: command.incluirCodigoBarra,
        toleranciaMinDias: command.toleranciaMinDias,
        toleranciaMaxDias: command.toleranciaMaxDias,
      },
    });
  }

  static toResponse(empresa: Empresa) {
    const configuracion = empresa.configuracion;

    return {
      id: empresa.id,
      nombre: empresa.nombre,
      slug: empresa.slug,
      telefono: empresa.telefono,
      ubicacion: empresa.ubicacion,
      tieneCarrito: configuracion.tieneCarrito,
      habilitarExcel: configuracion.habilitarExcel,
      catalogoHabilitado: configuracion.catalogoHabilitado,
      saldosHabilitados: configuracion.saldosHabilitados,
      reparacionesHabilitadas: configuracion.reparacionesHabilitadas,
      mostrarNavegacionPaginas: configuracion.mostrarNavegacionPaginas,
      logo_url: empresa.logo_url,
      fecha_creacion: empresa.fecha_creacion,
      imagenesEnArticulos: configuracion.imagenesEnArticulos,
      incluirHorarios: configuracion.incluirHorarios,
      pedidosFueraHorario: configuracion.pedidosFueraHorario,
      incluirCodigoBarra: configuracion.incluirCodigoBarra,
      toleranciaMinDias: configuracion.toleranciaMinDias,
      toleranciaMaxDias: configuracion.toleranciaMaxDias,
    };
  }

  static toPublicResponse(empresa: Empresa) {
    const configuracion = empresa.configuracion;

    return {
      id: empresa.id,
      nombre: empresa.nombre,
      slug: empresa.slug,
      telefono: empresa.telefono,
      ubicacion: empresa.ubicacion,
      logo_url: empresa.logo_url,
      tieneCarrito: configuracion.tieneCarrito,
      catalogoHabilitado: configuracion.catalogoHabilitado,
      saldosHabilitados: configuracion.saldosHabilitados,
      reparacionesHabilitadas: configuracion.reparacionesHabilitadas,
      mostrarNavegacionPaginas: configuracion.mostrarNavegacionPaginas,
      imagenesEnArticulos: configuracion.imagenesEnArticulos,
      pedidosFueraHorario: configuracion.pedidosFueraHorario,
      incluirCodigoBarra: configuracion.incluirCodigoBarra,
      toleranciaMinDias: configuracion.toleranciaMinDias,
      toleranciaMaxDias: configuracion.toleranciaMaxDias,
    };
  }
}
