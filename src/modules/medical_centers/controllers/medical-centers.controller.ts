import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  MedicalCenterForOrdersQueryDto,
  MedicalCenterPageDto,
  MedicalCenterSearchQueryDto,
} from '../dto/medical-center-search.dto';
import { MedicalCentersForMyOrdersService } from '../services/medical-centers-for-my-orders.service';
import { MedicalCentersSearchService } from '../services/medical-centers-search.service';

/**
 * Búsqueda de centros médicos por los procedimientos que ofrecen.
 *
 * `search` es público como la de imagenología: `@TenantAgnostic()` y sin
 * `@Roles`. Es un directorio de prestadores y precios publicados, no datos de
 * nadie. `search/for-my-orders` es del paciente titular.
 */
@ApiTags('medical-centers')
@ApiBearerAuth()
@Controller('medical-centers')
export class MedicalCentersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param searchService - La búsqueda por cobertura.
   * @param forMyOrdersService - La búsqueda para las órdenes de un paciente.
   */
  constructor(
    private readonly searchService: MedicalCentersSearchService,
    private readonly forMyOrdersService: MedicalCentersForMyOrdersService,
  ) {}

  /** Centros que ofrecen los procedimientos pedidos, completos primero. */
  @Get('search')
  @TenantAgnostic()
  @ApiOperation({
    summary: 'Buscar centros médicos por procedimientos',
    description:
      'Cada sede dice si ofrece todo lo pedido (`complete`) y cuáles le faltan. ' +
      'Completos primero, después por distancia en línea recta desde `lat`/`lng`, ' +
      'después por precio total y por nombre. Solo aparecen los que publicaron precio.',
  })
  @ApiOkResponse({ type: MedicalCenterPageDto })
  search(
    @Query() query: MedicalCenterSearchQueryDto,
  ): Promise<MedicalCenterPageDto> {
    return this.searchService.search(query);
  }

  /** Lo mismo, con los procedimientos tomados de las órdenes del titular. */
  @Get('search/for-my-orders')
  @Roles('PATIENT')
  @ApiOperation({
    summary: 'Buscar centros médicos para mis órdenes',
    description:
      'Los procedimientos salen de las órdenes. Marca si el médico trabaja en la sede ' +
      'y si la sugirió, sin cambiar qué sedes aparecen ni su orden. Una orden ajena responde 404.',
  })
  @ApiOkResponse({ type: MedicalCenterPageDto })
  searchForMyOrders(
    @Query() query: MedicalCenterForOrdersQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalCenterPageDto> {
    return this.forMyOrdersService.searchForOrders(query, actor);
  }
}
