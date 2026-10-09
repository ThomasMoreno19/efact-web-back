export interface CreateMovimientoCommand {
  id: number;
  idEquipo: number;
  estado?: string | null;
  fecha?: string | null;
  observacion?: string | null;
}
