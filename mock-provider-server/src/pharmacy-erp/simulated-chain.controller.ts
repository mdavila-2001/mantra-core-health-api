import {
  Controller,
  Get,
  Headers,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PharmacyCatalogService } from './pharmacy-catalog.service';

const DEFAULT_PER_PAGE = 5;
const MAX_PER_PAGE = 50;

/**
 * Una cadena de farmacias con un sistema propio, **a propósito distinto** del
 * Estándar ALOVIDA, para probar que el camino del adaptador funciona antes de
 * tener la documentación de una cadena real:
 *
 * - la clave va como `Authorization: Bearer <clave>`, no en `X-Api-Key`;
 * - otros nombres: `sku`, `description`, `branches`, `on_hand.units`, `amount_cents`;
 * - todo viene en `data` y pagina con `page`/`per_page` y `meta.total_pages`
 *   (5 por página por defecto, para que haya que recorrer páginas);
 * - el precio va en centavos y anidado.
 *
 * La dirección que la farmacia carga en la plataforma es
 * `http://<simulador>/simulated-chain/api/v2`, y el código de farmacia es el
 * de la cadena.
 */
@ApiTags('simulated-chain')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o de otra cadena' })
@Controller('simulated-chain/api/v2/chains/:chainId')
export class SimulatedChainController {
  constructor(private readonly catalog: PharmacyCatalogService) {}

  @Get('ping')
  @ApiOperation({ summary: 'La cadena responde y el token es válido' })
  ping(
    @Param('chainId') chainId: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    this.catalog.authenticate(chainId, bearer(authorization));
    return {
      ok: true,
      chain_id: chainId,
      server_time: this.catalog.now().toISOString(),
    };
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Catálogo de la cadena, paginado' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  async catalogPage(
    @Param('chainId') chainId: string,
    @Headers('authorization') authorization: string | undefined,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    this.catalog.authenticate(chainId, bearer(authorization));
    const products = await this.catalog.products();
    return paginate(
      products.map((product) => ({
        sku: product.code,
        description: product.name,
        pack: { label: product.presentation, unit: product.unitCode },
      })),
      page,
      perPage,
    );
  }

  @Get('branches/:branchId/inventory')
  @ApiOperation({ summary: 'Existencias de una sucursal, paginadas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  async inventory(
    @Param('chainId') chainId: string,
    @Param('branchId') branchId: string,
    @Headers('authorization') authorization: string | undefined,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    this.catalog.authenticate(chainId, bearer(authorization));
    const snapshot = await this.catalog.stock(chainId, branchId);
    return paginate(
      snapshot.items.map((line) => ({
        sku: line.code,
        on_hand: { units: line.quantity },
        updated_at: snapshot.windowStart.toISOString(),
      })),
      page,
      perPage,
    );
  }

  @Get('catalog/prices')
  @ApiOperation({ summary: 'Precios de la cadena, en centavos, paginados' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  async prices(
    @Param('chainId') chainId: string,
    @Headers('authorization') authorization: string | undefined,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    this.catalog.authenticate(chainId, bearer(authorization));
    const lines = await this.catalog.prices(chainId);
    return paginate(
      lines.map((line) => ({
        sku: line.code,
        price: { amount_cents: line.unitPriceCents, currency: 'BOB' },
      })),
      page,
      perPage,
    );
  }
}

function bearer(header: string | undefined): string | undefined {
  const match = /^Bearer\s+(.+)$/i.exec(header?.trim() ?? '');
  if (header !== undefined && header.trim() !== '' && match === null) {
    throw new UnauthorizedException('Se espera Authorization: Bearer <token>');
  }
  return match?.[1];
}

export function paginate<T>(
  rows: readonly T[],
  rawPage: string | undefined,
  rawPerPage: string | undefined,
) {
  const perPage = clampInt(rawPerPage, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const page = clampInt(rawPage, 1, 1, totalPages);
  return {
    data: rows.slice((page - 1) * perPage, page * perPage),
    meta: {
      page,
      per_page: perPage,
      total_pages: totalPages,
      total: rows.length,
    },
  };
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = raw === undefined ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
