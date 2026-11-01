import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import {
  AccessLogged,
  Audited,
} from '../../../common/audit-trail/audit-trail.decorators';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import {
  GOVERNANCE_READ_ROLES,
  QUALITY_RESOLVE_ROLES,
} from '../governance_admin.constants';
import {
  IdParamDto,
  IssuesQueryDto,
  RulesQueryDto,
} from '../dto/governance-admin.query.dto';
import { ResolveIssueDto } from '../dto/resolve-issue.dto';
import { DataQualityService } from '../services/data-quality.service';

/**
 * Calidad de datos CLÍNICOS (`health_data.*`) del portal de gobierno; no es la calidad del
 * catálogo de datos de la plataforma (`admin/catalog/quality/*`). Lecturas para los roles de
 * gobierno; resolver o descartar sólo para `QUALITY_RESOLVE_ROLES`. Plataforma, no tenant: lo
 * decide esta API.
 *
 * Leer incidencias deja rastro en `audit.data_access_log` (`@AccessLogged`): cada una apunta al
 * recurso clínico (`resourceId`) donde se detectó el problema. Las reglas no identifican a
 * nadie y no lo llevan.
 */
@ApiTags('admin-governance-data-quality')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('admin/governance/data-quality')
export class AdminDataQualityController {
  constructor(private readonly service: DataQualityService) {}

  @Get('issues')
  @Roles(...GOVERNANCE_READ_ROLES)
  @AccessLogged({
    resourceType: 'DATA_QUALITY_ISSUE',
    purpose: 'DATA_GOVERNANCE',
  })
  @ApiOperation({
    summary: 'Incidencias de calidad de datos clínicos, paginadas por cursor',
  })
  issues(@Query() q: IssuesQueryDto) {
    return this.service.listIssues(q);
  }

  @Get('issues/:id')
  @Roles(...GOVERNANCE_READ_ROLES)
  @AccessLogged({
    resourceType: 'DATA_QUALITY_ISSUE',
    resourceId: 'param:id',
    purpose: 'DATA_GOVERNANCE',
  })
  @ApiOperation({ summary: 'Una incidencia de calidad de datos clínicos' })
  @ApiResponse({ status: 404, description: 'No existe la incidencia' })
  issue(@Param() p: IdParamDto) {
    return this.service.getIssue(p.id);
  }

  @Audited({
    action: 'DATA_QUALITY_ISSUE_RESOLUTION',
    entity: 'health_data_quality_issue',
    entityId: 'param:id',
  })
  @Post('issues/:id/resolution')
  @HttpCode(HttpStatus.OK)
  @Roles(...QUALITY_RESOLVE_ROLES)
  @ApiOperation({
    summary: 'Resolver o descartar una incidencia abierta',
    description:
      'Idempotente: repetir la misma acción devuelve 200 con `alreadyApplied: true`. Pedir la contraria sobre una incidencia ya cerrada responde 409.',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya la cerró otra persona con otro desenlace',
  })
  resolve(@Param() p: IdParamDto, @Body() dto: ResolveIssueDto) {
    return this.service.resolve(p.id, dto);
  }

  @Get('rules')
  @Roles(...GOVERNANCE_READ_ROLES)
  @ApiOperation({
    summary: 'Reglas de calidad de datos clínicos, paginadas por cursor',
  })
  rules(@Query() q: RulesQueryDto) {
    return this.service.listRules(q);
  }

  @Get('rules/:id')
  @Roles(...GOVERNANCE_READ_ROLES)
  @ApiOperation({
    summary:
      'Una regla de calidad con su expresión, sus incidencias por estado y sus últimas corridas',
  })
  @ApiResponse({ status: 404, description: 'No existe la regla' })
  rule(@Param() p: IdParamDto) {
    return this.service.getRule(p.id);
  }
}
