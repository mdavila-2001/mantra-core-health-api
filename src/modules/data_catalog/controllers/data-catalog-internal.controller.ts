import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { RunNextResultDto } from '../dto';
import { CatalogScanService } from '../services';

/**
 * Plano de ejecución del catálogo. Sólo lo llama el worker `data_catalog`
 * con su identidad de servicio; ningún rol humano de la consola llega aquí.
 */
@ApiTags('data-catalog-internal')
@ApiBearerAuth()
@Controller('internal/catalog')
export class DataCatalogInternalController {
  constructor(private readonly scans: CatalogScanService) {}

  @Post('scans/run-next')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reclamar y ejecutar la siguiente corrida de escaneo (worker)',
    description:
      'Reclama con lease y SKIP LOCKED; recupera corridas cuyo worker murió. claimed=0 si no hay trabajo.',
  })
  runNext(@CurrentUser() actor: AuthenticatedUser): Promise<RunNextResultDto> {
    return this.scans.runNext(actor.id);
  }
}
