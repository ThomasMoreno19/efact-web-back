import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { ApplicationExceptionFilter } from '@/shared/infrastructure/filters/application-exception.filter';
import { DomainValidationExceptionFilter } from '@/shared/infrastructure/filters/domain-validation-exception.filter';

function readCookie(setCookies: string[] | undefined, name: string): string {
  const cookie = setCookies?.find((value) => value.startsWith(`${name}=`));
  if (!cookie) throw new Error(`No se recibió la cookie ${name}.`);
  return cookie.slice(name.length + 1).split(';', 1)[0];
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let authorization: string;
  let refreshCookie: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(
      new ApplicationExceptionFilter(),
      new DomainValidationExceptionFilter(),
    );
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nombre: 'admin', contrasena: 'admin123' })
      .expect(200);
    const loginCookies = loginResponse.headers['set-cookie'];
    authorization = `Bearer ${readCookie(loginCookies, 'access_token')}`;
    refreshCookie = readCookie(loginCookies, 'refresh_token');
  });

  it('requires authentication by default', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });

  it('allows authenticated requests', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', authorization)
      .expect(200)
      .expect('Hello World!');
  });

  it('keeps the session endpoint protected', () => {
    return request(app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', authorization)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          nombre: 'admin',
          role: 'Superadmin',
        });
      });
  });

  it('rotates refresh tokens and revokes them on logout', async () => {
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${refreshCookie}`)
      .expect(200);
    const refreshedCookies = refreshResponse.headers['set-cookie'];
    const accessToken = readCookie(refreshedCookies, 'access_token');
    const rotatedRefreshToken = readCookie(refreshedCookies, 'refresh_token');

    expect(JSON.stringify(refreshedCookies)).toContain('Max-Age=900');
    expect(JSON.stringify(refreshedCookies)).toContain('Max-Age=604800');

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', `access_token=${accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${rotatedRefreshToken}`)
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
