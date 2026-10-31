import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../../common';
import { NotAudited } from '../../../../common/audit-trail/audit-trail.decorators';
import { TenantAgnostic } from '../../../../common/tenant/tenant-agnostic.decorator';
import {
  InventoryImportResultDto,
  RunNextResultDto,
} from '../dto/catalog-response.dto';
import { CatalogScanService } from '../../application/catalog-scan.service';
import { InventoryImportService } from '../../application/inventory-import.service';

/**
 * Plano de ejecución de la sonda del catálogo. Sólo lo llama el worker `data_catalog` con su
 * identidad de servicio (`SYSTEM`); ningún rol humano de la consola llega acá. Sin cuerpo: el `{}`
 * que manda el worker no se valida contra un DTO.
 */
@ApiTags('data-catalog-internal')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('internal/catalog/scans')
export class InternalCatalogScansController {
  constructor(private readonly scans: CatalogScanService) {}

  @NotAudited(
    'Plomería del worker: el escaneo deja su rastro en data_catalog.catalog_scan_runs y catalog_change_events; el sello por tick sólo repetiría la hora.',
  )
  @Post('run-next')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sonda: reclama y ejecuta el siguiente escaneo (worker)',
    description:
      'Cierra los escaneos abandonados, retoma el que está en cola o, si venció el intervalo de la sonda, pide uno nuevo. `claimed: 0` si no había nada que hacer. `fenced: true` si el escaneo perdió su lease.',
  })
  @ApiResponse({ status: 200, type: RunNextResultDto })
  runNext(@CurrentUser() actor: AuthenticatedUser): Promise<RunNextResultDto> {
    return this.scans.runNext(actor.id);
  }
}

/**
 * Plano de ejecución de la importación del inventario. Igual que la sonda: sólo lo llama el worker
 * `data_catalog` con su identidad de servicio (`SYSTEM`), justo después de un escaneo, y también
 * puede pedirse a mano con esa misma identidad. Sin cuerpo.
 */
@ApiTags('data-catalog-internal')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('internal/catalog/inventory')
export class InternalCatalogInventoryController {
  constructor(private readonly imports: InventoryImportService) {}

  @NotAudited(
    'Plomería del worker: la importación es idempotente y deja su rastro en las filas de data_catalog (row_version, updated_at); el sello por corrida sólo repetiría la hora.',
  )
  @Post('import')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Importa el inventario de la API a las tablas de operaciones y procesos (worker)',
    description:
      'Lee `inventario/` y escribe `catalog_operations`, `catalog_operation_impacts`, `catalog_processes`, `catalog_process_steps` y `catalog_process_step_operations` en una transacción. Idempotente: lo que no cambió no se toca. Corre después de un escaneo, porque cada impacto apunta a un objeto de `catalog_objects`. Una operación que deja de aparecer queda `NOT_OBSERVED`. 503 si la instancia no tiene el inventario.',
  })
  @ApiResponse({ status: 200, type: InventoryImportResultDto })
  @ApiResponse({
    status: 503,
    description: 'El inventario no está disponible en esta instancia',
  })
  importInventory(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InventoryImportResultDto> {
    return this.imports.importInventory(actor.id);
  }
}
