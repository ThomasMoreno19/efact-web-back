export class UpsertAdminByEmpresaCommand {
  constructor(
    public readonly nombre: string,
    public readonly contrasena?: string,
  ) {}
}
