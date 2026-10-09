import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Rol } from '@prisma/client';
import { hash } from 'bcryptjs';
import {
  createCompanyExcelImportToken,
  deriveCompanyExcelImportEncryptionKey,
  encryptCompanyExcelImportToken,
} from '../src/shared/infrastructure/security/company-excel-import-token.crypto';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'efactweb_local',
  connectionLimit: 10,
  timezone: 'Z',
  initSql: "SET time_zone = '+00:00'",
});

const prisma = new PrismaClient({ adapter });

const empresas = [
  { nombre: 'Demaría', slug: 'demaria' },
  { nombre: 'Bla Bla', slug: 'bla' },
  { nombre: 'Servicios AgroIndustria', slug: 'sai' },
  { nombre: 'Swami', slug: 'swami' },
];

const valoresPorDefecto = {
  telefono: null,
  ubicacion: null,
  logoUrl: null,
  tieneCarrito: true,
  habilitarExcel: true,
  imagenesEnArticulos: true,
  incluirHorarios: false,
  pedidosFueraHorario: false,
  incluirCodigoBarra: false,
  toleranciaMinDias: null,
  toleranciaMaxDias: null,
};

async function main(): Promise<void> {
  const contrasena = await hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { nombre: 'admin' },
    update: {
      contrasena,
      role: Rol.SUPERADMIN,
    },
    create: {
      nombre: 'admin',
      contrasena,
      role: Rol.SUPERADMIN,
    },
  });

  for (const empresa of empresas) {
    await prisma.$transaction(async (transaction) => {
      const savedEmpresa = await transaction.empresa.upsert({
        where: { slug: empresa.slug },
        update: {
          nombre: empresa.nombre,
          ...valoresPorDefecto,
        },
        create: {
          ...empresa,
          ...valoresPorDefecto,
        },
      });

      if (!savedEmpresa.excelImportToken) {
        const token = createCompanyExcelImportToken(savedEmpresa.id);
        await transaction.empresa.update({
          where: { id: savedEmpresa.id },
          data: {
            excelImportToken: encryptCompanyExcelImportToken(
              token,
              getExcelImportEncryptionKey(),
            ),
          },
        });
      }
    });
  }

  console.log('Usuario Superadmin "admin" creado o actualizado.');
  console.log('Las cuatro empresas de prueba quedaron creadas o actualizadas.');
}

function getExcelImportEncryptionKey(): Buffer {
  const secret = process.env.EXCEL_IMPORT_TOKEN_ENCRYPTION_KEY;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error(
      'Configurá EXCEL_IMPORT_TOKEN_ENCRYPTION_KEY con al menos 32 bytes.',
    );
  }
  return deriveCompanyExcelImportEncryptionKey(secret);
}

main()
  .catch((error: unknown) => {
    console.error('Error al cargar el usuario Superadmin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
