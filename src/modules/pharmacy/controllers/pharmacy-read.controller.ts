import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ParseOptionalLimitPipe } from '../../../common';
import { type GeoPoint } from '../../pharmacy_inventory/services';
import { PharmacyReadService } from '../services';
import {
  PharmacyDetailDto,
  PharmacyDirectoryResponseDto,
  PharmacyProductSearchResponseDto,
  PharmacySiteListResponseDto,
  PharmacySitePricesResponseDto,
} from '../dto';

/**
 * Lecturas del directorio de farmacias sobre `/pharmacy` (carril E2).
 *
 * **Sin `@Roles` a propósito**, igual que el directorio de unidades
 * diagnósticas: son lecturas publicadas del tenant activo, y el filtro real es
 * la publicación (activa + verificada) más el aislamiento por tenant que aplica
 * el servicio. Capa fina: valida parámetros y delega.
 */
@ApiTags('pharmacy-directory')
@ApiBearerAuth()
@Controller('pharmacy')
export class PharmacyReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Lecturas del directorio de farmacias.
   */
  constructor(private readonly readService: PharmacyReadService) {}

  /** E2: el directorio de farmacias publicadas. */
  @Get('pharmacies')
  @ApiOperation({ summary: 'Listar farmacias publicadas del tenant activo' })
  @ApiOkResponse({ type: PharmacyDirectoryResponseDto })
  listPharmacies(): Promise<PharmacyDirectoryResponseDto> {
    return this.readService.listPharmacies();
  }

  /** E2: el perfil de una farmacia, con sus sedes y direcciones. */
  @Get('pharmacies/:id')
  @ApiOperation({ summary: 'Consultar el perfil de una farmacia' })
  @ApiOkResponse({ type: PharmacyDetailDto })
  getPharmacy(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PharmacyDetailDto> {
    return this.readService.getPharmacy(id);
  }

  /** E2: búsqueda de productos por texto o por medicamento del vademécum. */
  @Get('products')
  @ApiOperation({
    summary: 'Buscar productos publicados por texto o por medicamento',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Texto a buscar en marca, genérico o código de producto',
  })
  @ApiQuery({
    name: 'conceptId',
    required: false,
    format: 'uuid',
    description: 'Medicamento del vademécum (medication_concept_id)',
  })
  @ApiQuery({
    name: 'pharmacyId',
    required: false,
    format: 'uuid',
    description: 'Sólo el catálogo de esta farmacia',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  @ApiOkResponse({ type: PharmacyProductSearchResponseDto })
  searchProducts(
    @Query('search') search?: string,
    @Query('conceptId', new ParseUUIDPipe({ optional: true }))
    conceptId?: string,
    @Query('pharmacyId', new ParseUUIDPipe({ optional: true }))
    pharmacyId?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PharmacyProductSearchResponseDto> {
    return this.readService.searchProducts(
      { search, conceptId, pharmacyId },
      limit ?? 50,
    );
  }

  /**
   * H4 (carril Marcelo, 2026-09-25): las sedes publicadas, sueltas — sin
   * filtrar por farmacia. Declarado **antes** de `sites/:siteId/prices` para
   * que el router no confunda el segmento estático con el `:siteId`.
   */
  @Get('sites')
  @ApiOperation({ summary: 'Listar las sedes publicadas del tenant activo' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Texto a buscar en el nombre de la farmacia o de la sede',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    description: 'Latitud WGS84 desde donde medir distancia (va con lng)',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    description: 'Longitud WGS84 desde donde medir distancia (va con lat)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  @ApiOkResponse({ type: PharmacySiteListResponseDto })
  listSites(
    @Query('search') search?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PharmacySiteListResponseDto> {
    return this.readService.listSites(
      { search, origin: parseOrigin(lat, lng) },
      limit ?? 50,
    );
  }

  /** E2: precios públicos vigentes de una sede. */
  @Get('sites/:siteId/prices')
  @ApiOperation({
    summary: 'Consultar los precios públicos vigentes de una sede',
  })
  @ApiQuery({
    name: 'product',
    required: false,
    format: 'uuid',
    description: 'Producto puntual, si se acota',
  })
  @ApiOkResponse({ type: PharmacySitePricesResponseDto })
  getSitePrices(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('product', new ParseUUIDPipe({ optional: true }))
    productId?: string,
  ): Promise<PharmacySitePricesResponseDto> {
    return this.readService.getSitePrices(siteId, productId);
  }
}

/**
 * Valida el punto de origen: `lat` y `lng` van juntos o no van, igual que en
 * `PharmacyInventoryReadController.availability` (misma regla, mismo mensaje).
 */
function parseOrigin(
  lat: string | undefined,
  lng: string | undefined,
): GeoPoint | undefined {
  if (lat === undefined && lng === undefined) return undefined;
  if (lat === undefined || lng === undefined) {
    throw new BadRequestException(
      'lat y lng van juntos: mande ambos para ordenar por distancia, o ninguno',
    );
  }
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (
    !Number.isFinite(parsedLat) ||
    !Number.isFinite(parsedLng) ||
    Math.abs(parsedLat) > 90 ||
    Math.abs(parsedLng) > 180
  ) {
    throw new BadRequestException(
      'lat/lng deben ser coordenadas WGS84 válidas (lat en [-90, 90], lng en [-180, 180])',
    );
  }
  return { lat: parsedLat, lng: parsedLng };
}
