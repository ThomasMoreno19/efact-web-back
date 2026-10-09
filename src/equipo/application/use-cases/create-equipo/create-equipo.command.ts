export interface CreateEquipoCommand {
  id: number;
  marca?: string | null;
  modelo?: string | null;
  nombreEquipo?: string | null;
  createdAt?: string | null;
  nroSerie?: string | null;
  cuilCliente?: string | null;
}
