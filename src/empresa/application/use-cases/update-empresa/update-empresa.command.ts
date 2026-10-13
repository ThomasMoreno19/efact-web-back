export class UpdateEmpresaCommand {
  constructor(
    readonly nombre?: string,
    readonly slug?: string,
    readonly telefono?: string | null,
    readonly ubicacion?: string | null,
    readonly tieneCarrito?: boolean,
    readonly habilitarExcel?: boolean,
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
    readonly mostrarNavegacionPaginas?: boolean,
  ) {}
}
