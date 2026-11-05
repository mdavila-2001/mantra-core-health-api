import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../common';
import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { PlatformTenantOptional } from '../../../../common/tenant/platform-tenant-optional.decorator';
import {
  GOVERNANCE_VIEW_ROLES,
  rolesWithoutPlatformScope,
} from '../../../../common/auth/governance-read.roles';
import { GovernanceQueueService } from '../../application/governance-queue.service';
import { JobsQueryDto, ReviewQueueQueryDto } from '../dto/governance-queue.dto';

/**
 * Agregadores de lectura del portal de gobierno bajo `admin/governance`: cola de revisión de fichas
 * y trabajos del catálogo, la clasificación y la retención. Sólo `GET`, sólo metadatos.
 *
 * Alcance de plataforma por MÉTODO (ver `GovernanceOperationsReadController`): `@PlatformScopeOptional()`
 * para los roles globales de plataforma y `@PlatformTenantOptional(...)` para los roles de gobierno
 * que se asignan sin tenant. Roles: `GOVERNANCE_VIEW_ROLES` (matriz §3.12).
 */
@ApiTags('data-catalog-governance')
@ApiBearerAuth()
@Controller('admin/governance')
export class GovernanceQueueController {
  constructor(private readonly service: GovernanceQueueService) {}

  @Get('review-queue')
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...rolesWithoutPlatformScope(GOVERNANCE_VIEW_ROLES))
  @ApiOperation({
    summary:
      'Cola de revisión: fichas de objeto y de columna en NEEDS_REVIEW, la más antigua primero',
    description:
      'Preparada para sumar términos, políticas y certificaciones; mientras no existan, `notMeasured` lo declara.',
  })
  @ApiResponse({ status: 200, description: 'Resumen y página de la cola' })
  reviewQueue(@Query() q: ReviewQueueQueryDto) {
    return this.service.reviewQueue(q);
  }

  @Get('jobs')
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...rolesWithoutPlatformScope(GOVERNANCE_VIEW_ROLES))
  @ApiOperation({
    summary:
      'Trabajos de gobierno: escaneos del catálogo, clasificaciones y ejecuciones de retención',
    description:
      'Sin rango, los últimos 30 días. Lo que no se persiste se declara en `notMeasured`.',
  })
  @ApiResponse({ status: 200, description: 'Página de trabajos' })
  jobs(@Query() q: JobsQueryDto) {
    return this.service.jobs(q);
  }
}
