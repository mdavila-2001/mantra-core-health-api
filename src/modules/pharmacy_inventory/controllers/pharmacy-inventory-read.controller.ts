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
import { ParseOptionalLimitPipe, ParseUuidListPipe } from '../../../common';
import { PharmacyInventoryReadService, type GeoPoint } from '../services';
import { AvailabilityResponseDto, SiteStockResponseDto } from '../dto';

/**
 * Lecturas de inventario para el directorio sobre `/pharmacy-inventory`
 * (carril E2). **Sin `@Roles` a propósito**, igual que el directorio de
 * farmacias: la visibilidad la deciden la publicación y el tenant en el
 * servicio. Capa fina: valida parámetros y delega.
 */
@ApiTags('pharmacy-inventory-directory')
@ApiBearerAuth()
@Controller('pharmacy-inventory')
export class PharmacyInventoryReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Lecturas de stock y disponibilidad.
   */
  constructor(private readonly readService: PharmacyInventoryReadService) {}

  /** E2: stock disponible de una sede, agregado por producto. */
  @Get('sites/:siteId/stock')
  @ApiOperation({ summary: 'Consultar el stock disponible de una sede' })
  @ApiQuery({
    name: 'product',
    required: false,
    format: 'uuid',
    description: 'Producto puntual, si se acota',
  })
  @ApiOkResponse({ type: SiteStockResponseDto })
  getSiteStock(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('product', new ParseUUIDPipe({ optional: true }))
    productId?: string,
  ): Promise<SiteStockResponseDto> {
    return this.readService.getSiteStock(siteId, productId);
  }

  /** E2: qué sedes pueden surtir un pedido — completas primero, luego cerca y barato. */
  @Get('availability')
  @ApiOperation({
    summary: 'Consultar qué sedes pueden surtir un conjunto de productos',
  })
  @ApiQuery({
    name: 'products',
    required: true,
    description: 'Productos solicitados: UUIDs separados por coma',
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
    description: 'Tope de sedes servidas (por defecto 20)',
  })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  availability(
    @Query('products', new ParseUuidListPipe()) productIds?: string[],
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<AvailabilityResponseDto> {
    if (!productIds) {
      throw new BadRequestException(
        'products es obligatorio: la disponibilidad se consulta para un pedido concreto',
      );
    }
    return this.readService.availability(
      productIds,
      parseOrigin(lat, lng),
      limit ?? 20,
    );
  }
}

/**
 * Valida el punto de origen: `lat` y `lng` van juntos o no van, y tienen que
 * ser coordenadas WGS84 reales — un texto cualquiera no puede entrar a un
 * cálculo de distancia y salir como un orden que parece correcto.
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
