import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { ConfigureExternalSystemUseCase } from '../../application/inventory-sync/configure-external-system.use-case';
import {
  ConfigureExternalSystemDto,
  ExternalSystemProbeDto,
  ExternalSystemResponseDto,
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
    private readonly systems: ConfigureExternalSystemUseCase,
  ) {}

  /**
   * FAR-C9 · C9-3: la farmacia carga su sistema (formato, dirección, código y
   * clave). Se prueba antes de guardar; si no responde, no queda nada.
   */
  @Audited({
    action: 'PHARMACY_EXTERNAL_SYSTEM_CONFIGURED',
    entity: 'pharmacy_integration_connection',
    entityId: 'param:connectionId',
  })
  @Put(':pharmacyId/integration-connections/:connectionId/external-system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configurar el sistema propio de la farmacia' })
  @ApiOkResponse({ type: ExternalSystemResponseDto })
  configureExternalSystem(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Body() dto: ConfigureExternalSystemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExternalSystemResponseDto> {
    return this.systems.save({ pharmacyId, connectionId }, dto, actor);
  }

  /** Prueba el sistema que usa hoy la conexión. */
  @Post(
    ':pharmacyId/integration-connections/:connectionId/external-system/test',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Probar el sistema de la farmacia' })
  @ApiOkResponse({ type: ExternalSystemProbeDto })
  probeExternalSystem(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExternalSystemProbeDto> {
    return this.systems.probe({ pharmacyId, connectionId }, actor);
  }

  /** Quita el sistema propio: la conexión vuelve al del servidor o a manual. */
  @Audited({
    action: 'PHARMACY_EXTERNAL_SYSTEM_REMOVED',
    entity: 'pharmacy_integration_connection',
    entityId: 'param:connectionId',
  })
  @Delete(':pharmacyId/integration-connections/:connectionId/external-system')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quitar el sistema propio de la farmacia' })
  async removeExternalSystem(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.systems.remove({ pharmacyId, connectionId }, actor);
  }

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
