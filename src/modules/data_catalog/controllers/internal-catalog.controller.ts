import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { NotAudited } from '../../../common/audit-trail/audit-trail.decorators';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import { RunNextResultDto } from '../dto/catalog-response.dto';
import { CatalogScanService } from '../services/catalog-scan.service';

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
