export class CreateEmpresaCommand {
  constructor(
    readonly nombre: string,
    readonly tieneCarrito: boolean,
    readonly slug: string,
    readonly telefono?: string | null,
    readonly ubicacion?: string | null,
    readonly logo_url?: string | null,
    readonly fecha_creacion?: string | null,
    readonly imagenesEnArticulos?: boolean,
    readonly incluirHorarios?: boolean,
    readonly pedidosFueraHorario?: boolean,
    readonly incluirCodigoBarra?: boolean,
    readonly toleranciaMinDias?: number | null,
    readonly toleranciaMaxDias?: number | null,
    readonly catalogoHabilitado?: boolean,
    readonly saldosHabilitados?: boolean,
    readonly reparacionesHabilitadas?: boolean,
    readonly habilitarExcel?: boolean,
  ) {}
}
