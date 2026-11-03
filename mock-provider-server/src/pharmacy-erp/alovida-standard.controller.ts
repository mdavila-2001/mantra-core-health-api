import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PharmacyCatalogService } from './pharmacy-catalog.service';

/**
 * Una farmacia que cumple el «Estándar ALOVIDA»
 * (contrato publicado por la API en `docs/integrations/pharmacy-standard.openapi.yaml`).
 *
 * La dirección que la farmacia carga en la plataforma es
 * `http://<simulador>/alovida-standard`; la clave va en `X-Api-Key` y es la de
 * esa farmacia.
 */
@ApiTags('alovida-standard')
@ApiHeader({
  name: 'X-Api-Key',
  required: true,
  description: 'Clave de la farmacia',
})
@ApiUnauthorizedResponse({ description: 'Clave ausente o de otra farmacia' })
@Controller('alovida-standard/v1/pharmacies/:pharmacyCode')
export class AlovidaStandardController {
  constructor(private readonly catalog: PharmacyCatalogService) {}

  @Get('health')
  @ApiOperation({ summary: 'La farmacia responde y la clave es válida' })
  health(
    @Param('pharmacyCode') pharmacyCode: string,
    @Headers('x-api-key') apiKey: string | undefined,
  ) {
    this.catalog.authenticate(pharmacyCode, apiKey);
    return {
      status: 'OK',
      pharmacyCode,
      asOf: this.catalog.now().toISOString(),
    };
  }

  @Get('products')
  @ApiOperation({ summary: 'Catálogo de la farmacia, con sus propios códigos' })
  async products(
    @Param('pharmacyCode') pharmacyCode: string,
    @Headers('x-api-key') apiKey: string | undefined,
  ) {
    this.catalog.authenticate(pharmacyCode, apiKey);
    return { items: await this.catalog.products() };
  }

  @Get('sites/:siteCode/stock')
  @ApiOperation({
    summary: 'Stock de una sucursal',
    description:
      'Cambia por ventanas de cinco minutos: dentro de una ventana, dos consultas dan lo mismo.',
  })
  @ApiQuery({
    name: 'codes',
    required: false,
    description: 'Códigos separados por coma; sin él, todo el catálogo',
  })
  async stock(
    @Param('pharmacyCode') pharmacyCode: string,
    @Param('siteCode') siteCode: string,
    @Headers('x-api-key') apiKey: string | undefined,
    @Query('codes') codes?: string,
  ) {
    this.catalog.authenticate(pharmacyCode, apiKey);
    const snapshot = await this.catalog.stock(
      pharmacyCode,
      siteCode,
      splitCodes(codes),
    );
    return {
      pharmacyCode: snapshot.pharmacyCode,
      siteCode: snapshot.siteCode,
      asOf: snapshot.asOf.toISOString(),
      validUntil: snapshot.windowEnd.toISOString(),
      items: snapshot.items,
    };
  }

  @Get('prices')
  @ApiOperation({ summary: 'Precio unitario de cada producto, en bolivianos' })
  async prices(
    @Param('pharmacyCode') pharmacyCode: string,
    @Headers('x-api-key') apiKey: string | undefined,
  ) {
    this.catalog.authenticate(pharmacyCode, apiKey);
    const lines = await this.catalog.prices(pharmacyCode);
    return {
      currency: 'BOB',
      items: lines.map((line) => ({
        code: line.code,
        unitPrice: line.unitPriceCents / 100,
      })),
    };
  }
}

export function splitCodes(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const codes = raw
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code !== '');
  return codes.length > 0 ? codes : undefined;
}
