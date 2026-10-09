/// <reference types="jest" />

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { ApplicationExceptionFilter } from '@/shared/infrastructure/filters/application-exception.filter';
import { DomainValidationExceptionFilter } from '@/shared/infrastructure/filters/domain-validation-exception.filter';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';

function readCookie(
  setCookies: string[] | string | undefined,
  name: string,
): string {
  const cookies = Array.isArray(setCookies)
    ? setCookies
    : setCookies
      ? [setCookies]
      : [];
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));
  if (!cookie) throw new Error(`No se recibió la cookie ${name}.`);
  return cookie.slice(name.length + 1).split(';', 1)[0];
}

describe('Cliente (e2e)', () => {
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

  it('creates, retrieves, updates and deletes a company-scoped client', async () => {
    const suffix = Date.now();
    const empresaResponse = await apiPost('/empresas')
      .send({
        nombre: `e2e-clientes-${suffix}`,
        slug: `e2e-clientes-${suffix}`,
        tieneCarrito: false,
        habilitarExcel: true,
      })
      .expect(201);
    const currentEmpresaId = (empresaResponse.body as { id: number }).id;
    empresaId = currentEmpresaId;

    const collectionUrl = `/${currentEmpresaId}/clientes`;
    await apiPost(collectionUrl)
      .send({ cuil: '20-12345678-3', nombre: `Cliente inválido ${suffix}` })
      .expect(400);
    await apiPost(collectionUrl)
      .send({
        cuil: '20-12345678-6',
        updatedAt: '2025-02-03T10:30:00.000Z',
      })
      .expect(400);

    const createResponse = await apiPost(collectionUrl)
      .send({
        cuil: '20-12345678-6',
        nombre: `Cliente ${suffix}`,
        saldo: -450,
        contrasena: 'clave-cliente-e2e',
      })
      .expect(201);
    const cliente = createResponse.body as {
      idEmpresa: number;
      cuil: string;
      nombre: string | null;
      saldo: number | null;
      updatedAt: string | null;
    };

    expect(cliente).toMatchObject({
      idEmpresa: empresaId,
      cuil: '20123456786',
      nombre: `Cliente ${suffix}`,
      saldo: -450,
    });
    expect(cliente.updatedAt).toEqual(expect.any(String));
    expect(createResponse.body).not.toHaveProperty('contrasena');
    expect(createResponse.body).not.toHaveProperty('passwordHash');

    const persistedCliente = await app.get(PrismaService).cliente.findUnique({
      where: {
        cuil_idEmpresa: {
          cuil: cliente.cuil,
          idEmpresa: currentEmpresaId,
        },
      },
    });
    expect(persistedCliente?.contrasena).toMatch(/^\$2[aby]\$/);
    await apiPost(collectionUrl).send({ cuil: '20123456786' }).expect(409);

    await apiGet(collectionUrl)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([cliente]);
      });
    await apiGet(`${collectionUrl}/saldos`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual([
          {
            nombre: cliente.nombre,
            saldo: cliente.saldo,
            updatedAt: cliente.updatedAt,
          },
        ]);
        expect(response.body[0]).not.toHaveProperty('cuil');
      });
    await apiGet(`${collectionUrl}/20-12345678-6`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual(cliente);
      });

    await apiPatch(`${collectionUrl}/20-12345678-6`)
      .send({ cuil: '27-12345678-0' })
      .expect(400);

    const updateResponse = await apiPatch(`${collectionUrl}/20-12345678-6`)
      .send({
        nombre: `Cliente actualizado ${suffix}`,
        saldo: null,
        contrasena: 'nueva-clave-cliente-e2e',
      })
      .expect(200);
    expect(updateResponse.body).toMatchObject({
      idEmpresa: empresaId,
      cuil: '20123456786',
      nombre: `Cliente actualizado ${suffix}`,
      saldo: null,
    });
    expect(updateResponse.body.updatedAt).toEqual(expect.any(String));
    expect(updateResponse.body).not.toHaveProperty('contrasena');
    expect(updateResponse.body).not.toHaveProperty('passwordHash');

    await apiGet(`${collectionUrl}/20-12345678-6`).expect(200);
    await apiDelete(`${collectionUrl}/20-12345678-6`).expect(204);
    await apiGet(`${collectionUrl}/20-12345678-6`).expect(404);
  });
});
