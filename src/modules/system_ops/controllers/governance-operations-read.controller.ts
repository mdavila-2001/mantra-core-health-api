import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PlatformScopeOptional } from '../../../common/tenant/platform-scope';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  DomainListQueryDto,
  LegalHoldListQueryDto,
  RetentionExecutionListQueryDto,
} from '../dto/governance-read.dto';
import {
  GOVERNANCE_VIEW_ROLES,
  rolesWithoutPlatformScope,
  LEGAL_HOLD_VIEW_ROLES,
} from '../governance-read.roles';
import { GovernanceOperationsReadService } from '../services/governance-operations-read.service';

/**
 * Lecturas de gobierno de datos de plataforma bajo `admin/governance`: dominios, retenciones legales
 * y ejecuciones de retención. Sólo `GET`; sólo metadatos.
 *
 * ## Alcance de plataforma, por MÉTODO
 *
 * `@PlatformScopeOptional()` (sin `X-Tenant-Id` = plataforma, para los roles globales de plataforma)
 * va en cada `GET` y no en la clase: una ruta que se agregue mañana y mute no debe heredarlo.
 * `@PlatformTenantOptional(...)` completa el caso de los roles de gobierno que NO son de alcance
 * plataforma (`DPO`, `AUDITOR`, `DATA_STEWARD`, `SECURITY_ADMIN`): se asignan sin tenant, así que sin
 * esto un `GET` sin cabecera daría 403 `TENANT_REQUIRED`. Sólo cubre a los roles de la propia ruta.
 *
 * CONTRATO (evidencia-f0/CONTRATO-gobierno-lectura.md del portal de observabilidad y gobierno)
 *  - GET /admin/governance/domains            query: q?, limit?, cursor?
 *  - GET /admin/governance/legal-holds        query: status?, targetType?, tenantId?, targetId?, limit?, cursor?
 *  - GET /admin/governance/retention-executions
 *      query: policyId?, entityRegistryId?, status?, from?, to?, limit?, cursor?
 * Sin token 401; otro rol 403; parámetro no declarado, uuid o fecha inválidos o cursor corrupto 400.
 */
@ApiTags('system-ops-governance')
@ApiBearerAuth()
@Controller('admin/governance')
export class GovernanceOperationsReadController {
  constructor(private readonly service: GovernanceOperationsReadService) {}

  @Get('domains')
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...rolesWithoutPlatformScope(GOVERNANCE_VIEW_ROLES))
  @ApiOperation({
    summary: 'Dominios de datos y cuántas entidades declara cada uno',
  })
  @ApiResponse({ status: 200, description: 'Página de dominios' })
  domains(@Query() q: DomainListQueryDto) {
    return this.service.domains(q);
  }

  @Get('legal-holds')
  @Roles(...LEGAL_HOLD_VIEW_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...rolesWithoutPlatformScope(LEGAL_HOLD_VIEW_ROLES))
  @ApiOperation({
    summary:
      'Retenciones legales (legal holds), sin la referencia de la autoridad',
  })
  @ApiResponse({ status: 200, description: 'Página de retenciones legales' })
  legalHolds(@Query() q: LegalHoldListQueryDto) {
    return this.service.legalHolds(q);
  }

  @Get('retention-executions')
  @Roles(...GOVERNANCE_VIEW_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...rolesWithoutPlatformScope(GOVERNANCE_VIEW_ROLES))
  @ApiOperation({
    summary: 'Ejecuciones de políticas de retención: estado, tiempos y conteos',
  })
  @ApiResponse({ status: 200, description: 'Página de ejecuciones' })
  retentionExecutions(@Query() q: RetentionExecutionListQueryDto) {
    return this.service.retentionExecutions(q);
  }
}
