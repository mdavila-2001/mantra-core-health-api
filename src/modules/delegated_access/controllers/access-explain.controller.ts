import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  ExplainAccessDto,
  ExplainAccessResponseDto,
  ExplainMyAccessDto,
  ExplainTeamAccessDto,
  SimulateAccessDto,
  SimulateAccessResponseDto,
} from '../dto';
import { AccessExplainService } from '../services/access-explain.service';

/** Explicar: 60 por minuto por persona. Simular: 20 (cuesta más). */
const EXPLAIN_THROTTLE = { default: { limit: 60, ttl: 60_000 } };
const SIMULATE_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

/**
 * «Explicar decisión» y «Simular antes de guardar» (CONTRATO-GOBIERNO §5). Usan
 * el mismo motor que decide y no tienen efectos: el único asiento es el
 * `ACCESS_EXPLAINED` o `ACCESS_SIMULATED` de cada ruta. `SECURITY_ADMIN` opera en
 * toda la organización; un administrador delegado (`SUPPORT_STAFF`) necesita el
 * átomo `audit.decisions.explain` (o `team.grants.assign` para simular) y solo ve
 * a las personas de su alcance (lo decide el servicio).
 */
@ApiTags('delegated-access-governance')
@ApiBearerAuth()
@Controller()
export class AccessExplainController {
  /** @param explain - Explicar y simular. */
  constructor(private readonly explain: AccessExplainService) {}

  /** Explica una decisión sobre una persona de apoyo. */
  @Audited({
    action: 'ACCESS_EXPLAINED',
    entity: 'support_engagement',
    entityId: 'body.engagementId',
  })
  @Throttle(EXPLAIN_THROTTLE)
  @Post('org/access/explain')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Explicar por qué una persona de apoyo puede o no puede hacer algo',
  })
  explainOrg(
    @Body() dto: ExplainAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExplainAccessResponseDto> {
    return this.explain.explain(
      dto,
      actor,
    ) as unknown as Promise<ExplainAccessResponseDto>;
  }

  /** Simula un borrador de permisos antes de guardarlo. */
  @Audited({
    action: 'ACCESS_SIMULATED',
    entity: 'support_engagement',
    entityId: 'body.engagementId',
  })
  @Throttle(SIMULATE_THROTTLE)
  @Post('org/access/simulate')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Simular los efectos de un borrador de permisos (sin guardar nada)',
  })
  simulate(
    @Body() dto: SimulateAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimulateAccessResponseDto> {
    return this.explain.simulate(
      dto,
      actor,
    ) as unknown as Promise<SimulateAccessResponseDto>;
  }

  /** La propia persona pregunta por qué no puede. */
  @Audited({
    action: 'ACCESS_EXPLAINED',
    entity: 'support_engagement',
    tenantId: 'result.tenantId',
  })
  @TenantAgnostic()
  @Throttle(EXPLAIN_THROTTLE)
  @Post('me/support-access/explain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '¿Por qué no puedo hacer esto? (autoservicio)' })
  explainMine(
    @Body() dto: ExplainMyAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExplainAccessResponseDto> {
    return this.explain.explainMine(
      dto,
      actor,
    ) as unknown as Promise<ExplainAccessResponseDto>;
  }

  /** El doctor pregunta por alguien de su equipo, solo sobre su agenda. */
  @Audited({
    action: 'ACCESS_EXPLAINED',
    entity: 'support_engagement',
    entityId: 'body.engagementId',
  })
  @Throttle(EXPLAIN_THROTTLE)
  @Post('me/practitioner/support-team/explain')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'El doctor explica una decisión sobre alguien de su equipo',
  })
  explainTeam(
    @Body() dto: ExplainTeamAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExplainAccessResponseDto> {
    return this.explain.explainTeam(
      dto,
      actor,
    ) as unknown as Promise<ExplainAccessResponseDto>;
  }
}
