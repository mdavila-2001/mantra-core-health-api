import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ParseOptionalLimitPipe } from '../../../common';
import { PharmacyReadService } from '../services';
import {
  PharmacyDetailDto,
  PharmacyDirectoryResponseDto,
  PharmacyProductSearchResponseDto,
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
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  @ApiOkResponse({ type: PharmacyProductSearchResponseDto })
  searchProducts(
    @Query('search') search?: string,
    @Query('conceptId', new ParseUUIDPipe({ optional: true }))
    conceptId?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PharmacyProductSearchResponseDto> {
    return this.readService.searchProducts({ search, conceptId }, limit ?? 50);
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
