/// <reference types="jest" />

import { EmpresaMapper } from './empresa.mapper';

describe('EmpresaMapper', () => {
  it('maps flat API data into domain configuration and back', () => {
    const empresa = EmpresaMapper.toDomain({
      nombre: 'Empresa de prueba',
      slug: 'empresa-de-prueba',
      tieneCarrito: true,
      habilitarExcel: true,
      toleranciaMinDias: 2,
      toleranciaMaxDias: 8,
    });

    EmpresaMapper.applyUpdate(empresa, {
      incluirHorarios: true,
      slug: 'mi-empresa',
    });

    const response = EmpresaMapper.toResponse(empresa);

    expect(response).toMatchObject({
      slug: 'mi-empresa',
      tieneCarrito: true,
      habilitarExcel: true,
      incluirHorarios: true,
      pedidosFueraHorario: false,
      toleranciaMinDias: 2,
      toleranciaMaxDias: 8,
    });
    expect(response).not.toHaveProperty('configuracion');
  });
});
