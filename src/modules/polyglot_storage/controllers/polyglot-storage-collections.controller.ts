import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PolyglotStorageCollectionsService } from '../services';
import {
  ListStorageBindingsQueryDto,
  ListStorageCostSnapshotsQueryDto,
  StorageCostSnapshotPageDto,
  TenantStorageBindingPageDto,
} from '../dto';

/**
 * `GET` de colección de `polyglot_storage` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('polyglot-storage-collections')
@ApiBearerAuth()
@Controller()
export class PolyglotStorageCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(
    private readonly collections: PolyglotStorageCollectionsService,
  ) {}

  /** V54-02: listar fotografías de costo de almacenamiento del tenant. */
  @Get('finops/storage-cost-snapshots')
  @Roles('SYSTEM', 'FINOPS_ANALYST', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar fotografías de costo de almacenamiento del tenant',
  })
  @ApiOkResponse({ type: StorageCostSnapshotPageDto })
  listStorageCostSnapshots(
    @Query() query: ListStorageCostSnapshotsQueryDto,
  ): Promise<StorageCostSnapshotPageDto> {
    return this.collections.listStorageCostSnapshots(query);
  }

  /** V54-11: listar vínculos de almacenamiento del tenant del tenant. */
  @Get('governance/tenants/:tenantId/storage-bindings')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar vínculos de almacenamiento del tenant del tenant',
  })
  @ApiOkResponse({ type: TenantStorageBindingPageDto })
  listStorageBindings(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: ListStorageBindingsQueryDto,
  ): Promise<TenantStorageBindingPageDto> {
    return this.collections.listStorageBindings(tenantId, query);
  }
}
