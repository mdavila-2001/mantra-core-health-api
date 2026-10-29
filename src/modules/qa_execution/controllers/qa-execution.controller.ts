import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  ApprovePlanDto,
  ListPlansQueryDto,
  PlanRequestDto,
  UpsertTargetDto,
} from '../dto/qa-execution.dto';
import { QaExecutionService } from '../services/qa-execution.service';

/** Configurar destinos: amplía a dónde puede llamar el runner. */
export const QA_TARGET_ROLES = ['QA_ADMIN', 'SECURITY_ADMIN'] as const;
/** Pedir, previsualizar y cancelar planes. */
export const QA_PLAN_ROLES = ['QA_ADMIN', 'QA_ENGINEER'] as const;
/** Aprobar planes de riesgo. Quien pide no aprueba (se comprueba por identidad). */
export const QA_APPROVE_ROLES = [
  'QA_ADMIN',
  'RELEASE_MANAGER',
  'SECURITY_ADMIN',
] as const;
/** Leer planes y su bitácora. */
export const QA_READ_ROLES = [
  'QA_ADMIN',
  'QA_ENGINEER',
  'RELEASE_MANAGER',
  'PLATFORM_ADMIN',
] as const;

/**
 * Plano de ejecución de QA en el servidor: destinos aprobados, preflight,
 * planes con aprobación ligada a su hash, cancelación y bitácora. El navegador
 * no ejecuta nada: pide, aprueba y observa.
 */
@ApiTags('qa-execution')
@ApiBearerAuth()
@Controller('admin/qa')
export class QaExecutionController {
  constructor(private readonly execution: QaExecutionService) {}

  @Get('targets')
  @Roles(...QA_READ_ROLES)
  @ApiOperation({
    summary: 'Destinos aprobados por entorno (sin valores de secretos)',
  })
  listTargets() {
    return this.execution.listTargets();
  }

  @Audited({
    action: 'QA_EXECUTION_TARGET_UPSERTED',
    entity: 'execution_target',
    entityId: 'result.id',
  })
  @Put('environments/:environmentId/target')
  @Roles(...QA_TARGET_ROLES)
  @ApiOperation({
    summary:
      'Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados)',
  })
  upsertTarget(
    @Param('environmentId', ParseUUIDPipe) environmentId: string,
    @Body() dto: UpsertTargetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.execution.upsertTarget(environmentId, dto, actor);
  }

  @Audited({
    action: 'QA_EXECUTION_PLAN_PREFLIGHTED',
    entity: 'execution_plan',
  })
  @Post('plans/preflight')
  @Roles(...QA_PLAN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada',
  })
  preflight(@Body() dto: PlanRequestDto) {
    return this.execution.preflight(dto);
  }

  @Audited({
    action: 'QA_EXECUTION_PLAN_CREATED',
    entity: 'execution_plan',
    entityId: 'result.id',
  })
  @Post('plans')
  @Roles(...QA_PLAN_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({
    summary:
      'Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab',
  })
  async createPlan(
    @Body() dto: PlanRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const { plan, created } = await this.execution.createPlan(
      dto,
      idempotencyKey?.trim().slice(0, 200) || undefined,
      actor,
    );
    return { ...plan, created, statusUrl: `/admin/qa/plans/${plan.id}` };
  }

  @Get('plans')
  @Roles(...QA_READ_ROLES)
  @ApiOperation({ summary: 'Planes, del más reciente al más antiguo' })
  listPlans(@Query() query: ListPlansQueryDto) {
    return this.execution.listPlans(query);
  }

  @Get('plans/:planId')
  @Roles(...QA_READ_ROLES)
  @ApiOperation({
    summary: 'Plan con pasos, límites, aprobaciones y bitácora ordenada',
  })
  getPlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.execution.getPlan(planId);
  }

  @Audited({
    action: 'QA_EXECUTION_PLAN_APPROVED',
    entity: 'plan_approval',
    entityId: 'result.id',
  })
  @Post('plans/:planId/approvals')
  @Roles(...QA_APPROVE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar o rechazar el hash vigente del plan, con vencimiento',
  })
  approve(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: ApprovePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.execution.approve(planId, dto, actor);
  }

  @Audited({
    action: 'QA_EXECUTION_PLAN_CANCELLED',
    entity: 'execution_plan',
    entityId: 'param:planId',
  })
  @Post('plans/:planId/cancel')
  @Roles(...QA_PLAN_ROLES)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Pedir la cancelación (el runner la confirma entre casos)',
  })
  cancel(
    @Param('planId', ParseUUIDPipe) planId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.execution.cancel(planId, actor);
  }
}

/** Sólo el worker `qa_lab` con identidad de servicio. */
@ApiTags('qa-execution-internal')
@ApiBearerAuth()
@Controller('internal/qa/plans')
export class QaExecutionInternalController {
  constructor(private readonly execution: QaExecutionService) {}

  @Audited({
    action: 'QA_EXECUTION_PLAN_RUN',
    entity: 'execution_plan',
    entityId: 'result.id',
  })
  @Post('run-next')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reclamar y ejecutar el siguiente plan (worker)' })
  runNext(@CurrentUser() actor: AuthenticatedUser) {
    return this.execution.runNext(actor);
  }
}
