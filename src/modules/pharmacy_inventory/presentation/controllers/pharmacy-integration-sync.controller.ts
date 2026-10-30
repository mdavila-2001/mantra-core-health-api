import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { IntegrationReadService } from '../../application/inventory-sync/integration-read.service';
import { SyncExternalPharmacyCatalogUseCase } from '../../application/inventory-sync/sync-external-pharmacy-catalog.use-case';
import {
  ExternalCatalogListDto,
  IntegrationConnectionListDto,
  IntegrationMappingListDto,
  IntegrationSyncBatchListDto,
  IntegrationSyncResponseDto,
} from '../dto';

/**
 * Integración con el sistema de una farmacia externa (FAR-07): «Sincronizar
 * ahora» y las lecturas de la pestaña Integración del catálogo. El alta de la
 * conexión y de los vínculos sigue en el catálogo (`PharmacyController`); acá
 * se lee y se sincroniza. El ámbito (farmacia del tenant → conexión) lo
 * resuelven el caso de uso y el servicio de lectura.
 */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacies')
@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
export class PharmacyIntegrationSyncController {
  constructor(
    private readonly sync: SyncExternalPharmacyCatalogUseCase,
    private readonly reads: IntegrationReadService,
  ) {}

  @Audited({
    action: 'PHARMACY_INTEGRATION_SYNCED',
    entity: 'pharmacy_integration_connection',
    entityId: 'param:connectionId',
  })
  @Post(':pharmacyId/integration-connections/:connectionId/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Traer el stock del sistema de la farmacia y aplicarlo por sede',
  })
  @ApiOkResponse({ type: IntegrationSyncResponseDto })
  syncNow(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IntegrationSyncResponseDto> {
    return this.sync.execute({ pharmacyId, connectionId }, actor);
  }

  @Get(':pharmacyId/integration-connections')
  @ApiOperation({ summary: 'Conexiones de integración de la farmacia' })
  @ApiOkResponse({ type: IntegrationConnectionListDto })
  listConnections(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IntegrationConnectionListDto> {
    return this.reads.connections(pharmacyId, actor);
  }

  @Get(':pharmacyId/integration-connections/:connectionId/product-mappings')
  @ApiOperation({ summary: 'Vínculos de productos de una conexión' })
  @ApiOkResponse({ type: IntegrationMappingListDto })
  listMappings(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IntegrationMappingListDto> {
    return this.reads.mappings({ pharmacyId, connectionId }, actor);
  }

  @Get(':pharmacyId/integration-connections/:connectionId/external-products')
  @ApiOperation({
    summary:
      'Catálogo del sistema de la farmacia, con el vínculo de cada código',
  })
  @ApiOkResponse({ type: ExternalCatalogListDto })
  listExternalProducts(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExternalCatalogListDto> {
    return this.reads.externalProducts({ pharmacyId, connectionId }, actor);
  }

  @Get(':pharmacyId/integration-connections/:connectionId/sync-batches')
  @ApiOperation({ summary: 'Últimas sincronizaciones de una conexión' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Entre 1 y 20; por defecto 5',
  })
  @ApiOkResponse({ type: IntegrationSyncBatchListDto })
  listSyncBatches(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Query('limit', new ParseOptionalLimitPipe(20)) limit: number | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IntegrationSyncBatchListDto> {
    return this.reads.syncBatches({ pharmacyId, connectionId }, limit, actor);
  }
}
