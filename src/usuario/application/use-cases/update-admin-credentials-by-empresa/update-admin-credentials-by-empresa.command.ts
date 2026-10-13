export class UpdateAdminCredentialsByEmpresaCommand {
  constructor(
    public readonly nombre: string,
    public readonly contrasenaActual?: string,
    public readonly contrasenaNueva?: string,
  ) {}
}
