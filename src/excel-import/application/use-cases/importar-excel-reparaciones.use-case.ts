import type {
  ClienteImportRow,
  ClienteImportSet,
} from '@/cliente/application/ports/cliente-bulk-import.repository';
import { ImportarClientesMasivoUseCase } from '@/cliente/application/use-cases/importar-clientes-masivo.use-case';
import { EnsureEmpresaExcelImportEnabledUseCase } from '@/empresa/application/use-cases/ensure-empresa-excel-import-enabled.use-case';
import type {
  EquipoImportRow,
  EquipoImportSourceRow,
} from '@/equipo/application/ports/equipo-bulk-import.repository';
import { ImportarEquiposMasivoUseCase } from '@/equipo/application/use-cases/importar-equipos-masivo.use-case';
import type {
  MovimientoImportRow,
  MovimientoImportSourceRow,
} from '@/movimiento/application/ports/movimiento-bulk-import.repository';
import { ImportarMovimientosMasivoUseCase } from '@/movimiento/application/use-cases/importar-movimientos-masivo.use-case';
import type { ImportUnitOfWork } from '@/shared/application/ports/import-unit-of-work';

export type ExcelRepairImportMode = 'actualizar' | 'sincronizar';

export interface ExcelRepairImportRow {
  rowNumber: number;
  value: {
    idMovimiento: number;
    idEquipo: number;
    nombreEquipo: string | null;
    marca: string | null;
    modelo: string | null;
    nroSerie: string | null;
    cuil: string;
    nombreCliente: string | null;
    password: string | null;
    estado: string | null;
    fecha: string | null;
    observacion: string | null;
  };
}

export interface ExcelRepairClientImportRow {
  rowNumber: number;
  value: { cuil: string; nombre: string | null; password: string | null };
}

export interface ExcelRepairImportPlan {
  rows: ExcelRepairImportRow[];
  clientes: ExcelRepairClientImportRow[];
}

export class ImportarExcelReparacionesUseCase {
  constructor(
    private readonly ensureExcelEnabled: EnsureEmpresaExcelImportEnabledUseCase,
    private readonly customerImport: ImportarClientesMasivoUseCase,
    private readonly equipmentImport: ImportarEquiposMasivoUseCase,
    private readonly movementImport: ImportarMovimientosMasivoUseCase,
    private readonly unitOfWork: ImportUnitOfWork,
  ) {}

  ensureImportEnabled(empresaId: number) {
    return this.ensureExcelEnabled.execute(empresaId);
  }

  async preview(empresaId: number, movementRows: number) {
    await this.ensureExcelEnabled.execute(empresaId);
    return {
      movimientosBd: await this.movementImport.countByEmpresa(empresaId),
      movimientosExcel: movementRows,
    };
  }

  async execute(
    empresaId: number,
    plan: ExcelRepairImportPlan,
    mode: ExcelRepairImportMode,
  ) {
    await this.ensureExcelEnabled.execute(empresaId);
    const customerSet: ClienteImportSet = {
      rows: plan.clientes.map(({ rowNumber, value }) => ({
        rowNumber,
        value: {
          cuil: value.cuil,
          nombre: value.nombre,
          password: value.password,
          domicilio: null,
          localidad: null,
          telefonos: null,
          saldo: null,
        } satisfies ClienteImportRow,
      })),
      deletedKeys: [],
    };
    const equipmentRows: EquipoImportSourceRow<EquipoImportRow>[] =
      plan.rows.map(({ rowNumber, value }) => ({
        rowNumber,
        value: {
          idEquipo: value.idEquipo,
          nombreEquipo: value.nombreEquipo,
          marca: value.marca,
          modelo: value.modelo,
          nroSerie: value.nroSerie,
          cuil: value.cuil,
        },
      }));
    const movementRows: MovimientoImportSourceRow<MovimientoImportRow>[] =
      plan.rows.map(({ rowNumber, value }) => ({
        rowNumber,
        value: {
          idMovimiento: value.idMovimiento,
          idEquipo: value.idEquipo,
          estado: value.estado,
          fecha: value.fecha,
          observacion: value.observacion,
        },
      }));

    const result = await this.unitOfWork.execute(async (transaction) => {
      const processedCustomers = await this.customerImport.upsert(
        empresaId,
        customerSet,
        transaction,
        'Hoja1',
      );
      await this.equipmentImport.upsert(empresaId, equipmentRows, transaction);
      const movements = await this.movementImport.execute(
        empresaId,
        movementRows,
        movementRows.map(({ value }) => value.idMovimiento),
        mode,
        transaction,
      );
      let deletedEquipment =
        mode === 'sincronizar'
          ? await this.equipmentImport.synchronize(
              empresaId,
              equipmentRows.map(({ value }) => value.idEquipo),
              transaction,
            )
          : 0;
      let deletedCustomers = 0;
      for await (const cuils of this.customerImport.deletionBatches(
        empresaId,
        customerSet,
        mode,
        transaction,
        'Hoja1',
      )) {
        deletedEquipment += await this.equipmentImport.deleteForCustomers(
          empresaId,
          cuils,
          transaction,
        );
        deletedCustomers += await this.customerImport.delete(
          empresaId,
          cuils,
          transaction,
        );
      }
      return {
        processedCustomers,
        deletedCustomers,
        deletedEquipment,
        deletedMovements: movements.deleted,
      };
    });

    return {
      mode,
      processed: {
        clientes: result.processedCustomers,
        equipos: equipmentRows.length,
        movimientos: movementRows.length,
      },
      deleted:
        mode === 'sincronizar'
          ? {
              clientes: result.deletedCustomers,
              equipos: result.deletedEquipment,
              movimientos: result.deletedMovements,
            }
          : undefined,
    };
  }
}
