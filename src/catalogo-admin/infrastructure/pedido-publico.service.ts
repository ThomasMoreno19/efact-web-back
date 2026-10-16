import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/prisma/prisma.service';
import { CrearPedidoDto } from './adapters/in/dtos/crear-pedido.dto';

const MAX_ARTICULO_ID = 9_223_372_036_854_775_807n;

@Injectable()
export class PedidoPublicoService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(empresaId: number, dto: CrearPedidoDto) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, catalogoHabilitado: true },
      select: { id: true },
    });
    if (!empresa) throw new NotFoundException();

    const articuloIds = dto.detallePedido.map(({ idArticulo }) => {
      const id = BigInt(idArticulo);
      if (id <= 0n || id > MAX_ARTICULO_ID) {
        throw new BadRequestException(
          'Los identificadores de artículos no son válidos.',
        );
      }
      return id;
    });
    const articulosEncontrados = await this.prisma.articulo.findMany({
      where: {
        id_empresa: empresaId,
        id: { in: [...new Set(articuloIds.map(String))].map(BigInt) },
      },
      select: { id: true },
    });
    const articulosEncontradosIds = new Set(
      articulosEncontrados.map(({ id }) => String(id)),
    );
    if (articuloIds.some((id) => !articulosEncontradosIds.has(String(id)))) {
      throw new BadRequestException(
        'Uno o más artículos ya no están disponibles.',
      );
    }

    const nombre = dto.nombre.trim();
    if (!nombre) {
      throw new BadRequestException('El nombre del pedido es obligatorio.');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        INSERT INTO \`pedido_correlativo\` (\`id_empresa\`, \`ultimo_numero\`)
        VALUES (${empresaId}, 1)
        ON DUPLICATE KEY UPDATE
          \`ultimo_numero\` = IF(\`ultimo_numero\` >= 10000, 1, \`ultimo_numero\` + 1)
      `;
      const correlativo = await transaction.pedidoCorrelativo.findUniqueOrThrow(
        {
          where: { idEmpresa: empresaId },
        },
      );
      return transaction.pedido.create({
        data: {
          idEmpresa: empresaId,
          numeroPedido: correlativo.ultimoNumero,
          nombre,
          observacion: dto.observacion?.trim() || null,
          detallePedido: {
            create: dto.detallePedido.map((detalle, index) => ({
              idArticulo: articuloIds[index],
              cantidad: detalle.cantidad,
              observacion: detalle.observacion?.trim() || null,
            })),
          },
        },
        select: {
          id: true,
          numeroPedido: true,
          createdAt: true,
        },
      });
    });
  }
}
