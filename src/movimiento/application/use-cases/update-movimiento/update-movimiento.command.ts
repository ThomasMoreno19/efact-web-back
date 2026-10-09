export interface UpdateMovimientoCommand {
  idEquipo?: number;
  estado?: string | null;
  fecha?: string | null;
  observacion?: string | null;
}
