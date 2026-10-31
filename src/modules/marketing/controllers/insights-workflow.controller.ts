import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { Audited } from '../../../common/audit-trail/audit-trail.decorators';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  INSIGHTS_PLATFORM_ROLES,
  INSIGHTS_READ_ROLES,
  INSIGHTS_RULE_WRITE_ROLES,
  INSIGHTS_WRITE_ROLES,
} from '../marketing.insights-access';
import {
  InsightsAlertRuleListResponseDto,
  InsightsAlertRuleResponseDto,
  InsightsAlertWorkflowListResponseDto,
  InsightsAlertWorkflowResponseDto,
  PatchAlertRuleDto,
  PutAlertWorkflowDto,
} from '../dto/insights-workspace.dto';
import { InsightsWorkflowService } from '../services/insights-workflow.service';

/**
 * AloVida Insights: flujo de trabajo de las alertas y reglas. Son compartidas
 * por todo el portal (no son «del usuario»). Mismas reglas de acceso que las
 * lecturas (D-7): rol de plataforma o `MARKETING_MANAGER` con tenant resuelto.
 */
@ApiTags('marketing-insights')
@ApiBearerAuth()
@Controller('marketing/insights')
@PlatformTenantOptional(...INSIGHTS_PLATFORM_ROLES)
export class InsightsWorkflowController {
  constructor(private readonly workflow: InsightsWorkflowService) {}

  @Get('alert-workflow')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary: 'Estado, responsable e historial de las alertas que existen',
  })
  @ApiOkResponse({ type: InsightsAlertWorkflowListResponseDto })
  listWorkflow() {
    return this.workflow.listWorkflow();
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_ALERT_WORKFLOW_SET',
    entity: 'insights_alert',
  })
  @Put('alert-workflow/:fingerprint')
  @Roles(...INSIGHTS_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cambia estado y/o responsable de una alerta (la crea la primera vez)',
    description:
      'Upsert por fingerprint con el snapshot de la alerta detectada. Deja una fila en insights_alert_transitions solo si cambia el estado o el responsable. Sin If-Match en el alta; si la alerta ya existe, If-Match con su rowVersion o 412 MARKETING_INSIGHTS_VERSION_MISMATCH.',
  })
  @ApiHeader({
    name: 'If-Match',
    required: false,
    description: 'rowVersion leído',
  })
  @ApiOkResponse({ type: InsightsAlertWorkflowResponseDto })
  putWorkflow(
    @Param('fingerprint') fingerprint: string,
    @Body() dto: PutAlertWorkflowDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workflow.putWorkflow(fingerprint, dto, ifMatch, actor);
  }

  @Get('alert-rules')
  @Roles(...INSIGHTS_READ_ROLES)
  @ApiOperation({
    summary: 'Las siete reglas de alerta con su umbral y estado',
  })
  @ApiOkResponse({ type: InsightsAlertRuleListResponseDto })
  listRules() {
    return this.workflow.listRules();
  }

  @Audited({
    action: 'MARKETING_INSIGHTS_ALERT_RULE_UPDATED',
    entity: 'insights_alert_rule',
  })
  @Patch('alert-rules/:code')
  @Roles(...INSIGHTS_RULE_WRITE_ROLES)
  @ApiOperation({
    summary: 'Enciende, apaga o cambia el umbral (1 a 500) de una regla',
    description:
      'If-Match con el rowVersion es obligatorio (428 si falta, 412 si está vieja).',
  })
  @ApiHeader({
    name: 'If-Match',
    required: true,
    description: 'rowVersion leído',
  })
  @ApiOkResponse({ type: InsightsAlertRuleResponseDto })
  patchRule(
    @Param('code') code: string,
    @Body() dto: PatchAlertRuleDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workflow.patchRule(code, dto, ifMatch, actor);
  }
}
