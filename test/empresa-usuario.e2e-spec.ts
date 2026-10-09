import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { ApplicationExceptionFilter } from '@/shared/infrastructure/filters/application-exception.filter';
import { DomainValidationExceptionFilter } from '@/shared/infrastructure/filters/domain-validation-exception.filter';

interface EmpresaResponse {
  id: number;
  nombre: string;
  slug: string;
  tieneCarrito: boolean;
  habilitarExcel: boolean;
  imagenesEnArticulos: boolean;
  incluirHorarios: boolean;
}

interface UsuarioResponse {
  id: number;
  nombre: string;
  role: string;
  id_empresa: number | null;
}

function readCookie(setCookies: string[] | undefined, name: string): string {
  const cookie = setCookies?.find((value) => value.startsWith(`${name}=`));
  if (!cookie) throw new Error(`No se recibió la cookie ${name}.`);
  return cookie.slice(name.length + 1).split(';', 1)[0];
}

describe('CRUD de empresa y usuario (e2e)', () => {
  let app: INestApplication<App>;
  let empresaId: number | undefined;
  let authorization: string;

  const apiGet = (path: string) =>
    request(app.getHttpServer()).get(path).set('Authorization', authorization);
  const apiPost = (path: string) =>
    request(app.getHttpServer()).post(path).set('Authorization', authorization);
  const apiPatch = (path: string) =>
    request(app.getHttpServer())
      .patch(path)
      .set('Authorization', authorization);
  const apiDelete = (path: string) =>
    request(app.getHttpServer())
      .delete(path)
      .set('Authorization', authorization);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(
      new ApplicationExceptionFilter(),
      new DomainValidationExceptionFilter(),
    );
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nombre: 'admin', contrasena: 'admin123' })
      .expect(200);
    authorization = `Bearer ${readCookie(
      loginResponse.headers['set-cookie'],
      'access_token',
    )}`;
  });

  afterAll(async () => {
    if (empresaId !== undefined) {
      await apiDelete(`/empresas/${empresaId}`);
    }
    await app.close();
  });

  it('crea, consulta, actualiza y elimina una empresa y su usuario', async () => {
    const suffix = randomUUID();

    await apiGet('/empresas/2147483647').expect(404);
    await apiPatch('/empresas/2147483647')
      .send({ nombre: 'No existe' })
      .expect(404);
    await apiDelete('/empresas/2147483647').expect(404);
    await apiGet('/usuarios/2147483647').expect(404);
    await apiPatch('/usuarios/2147483647')
      .send({ nombre: 'No existe' })
      .expect(404);
    await apiDelete('/usuarios/2147483647').expect(404);

    await apiPost('/empresas')
      .send({ nombre: '   ', tieneCarrito: false, habilitarExcel: true })
      .expect(400);

    await apiPost('/usuarios')
      .send({ nombre: '   ', contrasena: 'clave-e2e-123' })
      .expect(400);

    await apiPost('/empresas')
      .send({
        nombre: `e2e-sin-slug-${suffix}`,
        tieneCarrito: false,
        habilitarExcel: true,
      })
      .expect(400);

    const empresaResponse = await apiPost('/empresas')
      .send({
        nombre: `e2e-${suffix}`,
        slug: `e2e-${suffix}`,
        tieneCarrito: false,
        habilitarExcel: true,
        fecha_creacion: '2022-06-07',
      })
      .expect(201);

    empresaId = (empresaResponse.body as EmpresaResponse).id;
    expect(empresaResponse.body).toMatchObject({
      nombre: `e2e-${suffix}`,
      slug: `e2e-${suffix}`,
      tieneCarrito: false,
      habilitarExcel: true,
      fecha_creacion: '2022-06-07',
      imagenesEnArticulos: true,
    });

    const empresaGetResponse = await apiGet(`/empresas/${empresaId}`).expect(
      200,
    );
    expect((empresaGetResponse.body as EmpresaResponse).id).toBe(empresaId);

    const empresasListResponse = await apiGet('/empresas').expect(200);
    expect(
      (empresasListResponse.body as EmpresaResponse[]).some(
        (empresa) => empresa.id === empresaId,
      ),
    ).toBe(true);

    const empresaUpdateResponse = await apiPatch(`/empresas/${empresaId}`)
      .send({
        nombre: `e2e-actualizada-${suffix}`,
        slug: `e2e-actualizada-${suffix}`,
        incluirHorarios: true,
      })
      .expect(200);
    expect(empresaUpdateResponse.body as EmpresaResponse).toMatchObject({
      nombre: `e2e-actualizada-${suffix}`,
      slug: `e2e-actualizada-${suffix}`,
      incluirHorarios: true,
    });

    await apiPost('/usuarios')
      .send({
        nombre: `e2e-empresa-inexistente-${suffix}`,
        contrasena: 'clave-e2e-123',
        id_empresa: 2147483647,
      })
      .expect(400);

    const usuarioResponse = await apiPost('/usuarios')
      .send({
        nombre: `e2e-${suffix}`,
        contrasena: 'clave-e2e-123',
        role: 'Admin',
        id_empresa: empresaId,
      })
      .expect(201);

    const usuarioId = (usuarioResponse.body as UsuarioResponse).id;
    expect(usuarioResponse.body).not.toHaveProperty('contrasena');

    await apiPost('/usuarios')
      .send({ nombre: `e2e-${suffix}`, contrasena: 'clave-e2e-123' })
      .expect(409);

    const usuarioGetResponse = await apiGet(`/usuarios/${usuarioId}`).expect(
      200,
    );
    expect(usuarioGetResponse.body as UsuarioResponse).toMatchObject({
      nombre: `e2e-${suffix}`,
      id_empresa: empresaId,
    });
    expect(usuarioGetResponse.body).not.toHaveProperty('contrasena');

    const usuariosListResponse = await apiGet('/usuarios').expect(200);
    const usuarios = usuariosListResponse.body as UsuarioResponse[];
    expect(usuarios.some((usuario) => usuario.id === usuarioId)).toBe(true);
    expect(JSON.stringify(usuarios)).not.toContain('contrasena');

    const usuarioUpdateResponse = await apiPatch(`/usuarios/${usuarioId}`)
      .send({
        nombre: `e2e-usuario-actualizado-${suffix}`,
        contrasena: 'clave-nueva-123',
      })
      .expect(200);
    expect(usuarioUpdateResponse.body as UsuarioResponse).toMatchObject({
      nombre: `e2e-usuario-actualizado-${suffix}`,
    });
    expect(usuarioUpdateResponse.body).not.toHaveProperty('contrasena');

    await apiDelete(`/usuarios/${usuarioId}`).expect(204);
    await apiDelete(`/empresas/${empresaId}`).expect(204);
    empresaId = undefined;
  });
});
