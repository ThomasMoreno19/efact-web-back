export type TipoBusquedaReparacion = 'cuil' | 'serie';

export interface ConsultarReparacionesPublicasCommand {
  tipo: TipoBusquedaReparacion;
  valor: string;
  contrasena?: string;
}
