import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, TenantAgnostic } from '../../../../common';
import { GOVERNANCE_VIEW_ROLES } from '../../../../common/auth/governance-read.roles';
import {
  ListMutabilityQueryDto,
  MutabilityDetailDto,
  MutabilityPageDto,
  MutabilitySummaryDto,
} from '../dto/mutability.dto';
import { MutabilityCatalogService } from '../services/mutability-catalog.service';

/**
 * Gobierno de mutabilidad: qué tablas son append-only, cuáles se pueden borrar, cuáles se purgan por
 * retención y cuáles aceptan un legal hold, cada dato con su nivel de evidencia y su fuente.
 *
 * Sólo lectura. Los roles son los de lectura de gobierno (`GOVERNANCE_VIEW_ROLES`, los mismos de
 * `GovernanceReadController`); cualquier otro recibe 403. Registrar o cambiar una política de escritura
 * sigue siendo `GovernanceCatalogController`.
 */
@ApiTags('system-ops-governance')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('admin/governance/mutability')
export class MutabilityController {
  constructor(private readonly service: MutabilityCatalogService) {}

  @Get()
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @ApiOperation({
    summary:
      'Listar la mutabilidad por tabla (modo de escritura, disposición, legal hold y nivel de evidencia)',
  })
  @ApiOkResponse({ type: MutabilityPageDto })
  list(@Query() query: ListMutabilityQueryDto): Promise<MutabilityPageDto> {
    return this.service.list(query);
  }

  // Va antes de `:schema/:table`: son rutas de distinta profundidad, pero así no hay ambigüedad.
  @Get('summary')
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @ApiOperation({
    summary:
      'Resumen de mutabilidad: tablas por modo y por nivel de evidencia (numerador/denominador) y hallazgos',
  })
  @ApiOkResponse({ type: MutabilitySummaryDto })
  summary(): Promise<MutabilitySummaryDto> {
    return this.service.summary();
  }

  @Get(':schema/:table')
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @ApiOperation({
    summary:
      'Detalle de una tabla: toda la evidencia con su fuente y las contradicciones sin resolver',
  })
  @ApiOkResponse({ type: MutabilityDetailDto })
  @ApiResponse({ status: 404, description: 'La tabla no está en el catálogo' })
  detail(
    @Param('schema') schema: string,
    @Param('table') table: string,
  ): Promise<MutabilityDetailDto> {
    return this.service.detail(schema, table);
  }
}
