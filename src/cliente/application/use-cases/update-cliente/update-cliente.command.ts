export class UpdateClienteCommand {
  constructor(
    readonly nombre?: string | null,
    readonly saldo?: number | null,
    readonly contrasena?: string | null,
    readonly domicilio?: string | null,
    readonly localidad?: string | null,
    readonly telefonos?: string | null,
  ) {}
}
