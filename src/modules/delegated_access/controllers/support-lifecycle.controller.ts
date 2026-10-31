import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  EngagementHandoverService,
  EngagementMoveService,
  EngagementSuspensionService,
  LifecycleService,
  TeamAdminCasesService,
} from '../services';
import {
  AssignHandoverDto,
  AssignHandoverResultDto,
  CompleteChecklistItemDto,
  ConfidentialityAckResultDto,
  HandoverPreviewDto,
  IdentityVerificationDto,
  LifecycleCaseDetailDto,
  LifecycleCaseExportDto,
  ListLifecycleCasesQueryDto,
  ListLifecycleCasesResponseDto,
  MoveEngagementDto,
  MoveResultDto,
  OffboardEngagementDto,
  OffboardResultDto,
  OperationResultDto,
  PutOwnerDto,
  ReactivateEngagementDto,
  SuspendEngagementDto,
  SuspensionResultDto,
} from '../dto';

/**
 * Ciclo de vida del personal de apoyo desde la organización (CONTRATO-GOBIERNO
 * §6.1): ingreso, cambio de rol, baja con traspaso, suspensión y reactivación,
 * dueño de la cuenta y registro de transferencia. Lo que reduce acceso es
 * inmediato; lo que lo aumenta pasa por cuatro ojos.
 */
@ApiTags('delegated-access-support-lifecycle')
@ApiBearerAuth()
@Controller()
export class SupportLifecycleController {
  /**
   * @param move - Cambio de rol.
   * @param suspension - Suspensión y reactivación.
   * @param handover - Baja con traspaso.
   * @param lifecycle - Casos, dueño, identidad y compromiso.
   * @param cases - Casos para quien administra por alcance.
   */
  constructor(
    private readonly moves: EngagementMoveService,
    private readonly suspension: EngagementSuspensionService,
    private readonly handover: EngagementHandoverService,
    private readonly lifecycle: LifecycleService,
    private readonly caseAccess: TeamAdminCasesService,
  ) {}

  /** Casos de ciclo de vida (filtros `kind` y `status`). */
  @Get('org/lifecycle/cases')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Casos de ingreso, cambio, baja y suspensión' })
  cases(
    @Query() query: ListLifecycleCasesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListLifecycleCasesResponseDto> {
    return this.caseAccess.cases(actor, query);
  }

  /** Un caso con su lista de verificación y sus traspasos. */
  @Get('org/lifecycle/cases/:id')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Detalle de un caso de ciclo de vida' })
  getCase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LifecycleCaseDetailDto> {
    return this.caseAccess.caseOf(id, actor);
  }

  /** Marca a mano un ítem de la lista (los automáticos responden 409). */
  @Audited({
    action: 'LIFECYCLE_CHECKLIST_COMPLETED',
    entity: 'lifecycle_case',
    entityId: 'param:id',
  })
  @Post('org/lifecycle/cases/:id/checklist/:code')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar un ítem de la lista de un caso' })
  completeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('code') code: string,
    @Body() dto: CompleteChecklistItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LifecycleCaseDetailDto> {
    return this.caseAccess.completeItem(id, code, actor, dto);
  }

  /** Reasigna los traspasos pendientes de un caso de baja. */
  @Audited({
    action: 'SUPPORT_HANDOVER_COMPLETED',
    entity: 'lifecycle_case',
    entityId: 'param:id',
  })
  @Post('org/lifecycle/cases/:id/handover/assign')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar los traspasos pendientes de una baja' })
  assignHandover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignHandoverDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssignHandoverResultDto> {
    return this.caseAccess.assignHandover(id, dto, actor);
  }

  /** Registro de transferencia exportable (deja asiento de la exportación). */
  @Get('org/lifecycle/cases/:id/export')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Exportar el registro de transferencia de un caso' })
  exportCase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LifecycleCaseExportDto> {
    return this.lifecycle.exportCase(id, actor);
  }

  /** Un administrador registra la identidad verificada en persona o con documento. */
  @Audited({
    action: 'SUPPORT_IDENTITY_VERIFIED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('org/support-engagements/:id/identity-verification')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar la verificación de identidad de la persona',
  })
  identityVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IdentityVerificationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.lifecycle.identityVerification(id, dto, actor);
  }

  /** Asigna el dueño de la cuenta (GP-8). */
  @Audited({
    action: 'SUPPORT_OWNER_ASSIGNED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Put('org/support-engagements/:id/owner')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar el dueño de la cuenta de apoyo' })
  setOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PutOwnerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.lifecycle.setOwner(id, dto, actor);
  }

  /** La propia persona acepta el compromiso de confidencialidad (sin tenant activo). */
  @Audited({
    action: 'SUPPORT_CONFIDENTIALITY_ACKNOWLEDGED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
    tenantId: 'result.tenantId',
  })
  @Post('me/support-engagements/:id/confidentiality-ack')
  @TenantAgnostic()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar mi compromiso de confidencialidad' })
  confidentialityAck(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ConfidentialityAckResultDto> {
    return this.lifecycle.confidentialityAckMine(id, actor);
  }

  /** Cambio de rol o alcance: 200 si se ejecutó, 202 si pide cuatro ojos. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_MOVED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('org/support-engagements/:id/move')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el rol o alcance de una persona de apoyo' })
  async move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MoveResultDto> {
    const out = await this.moves.move(id, dto, actor);
    if (out.status === 'PENDING_APPROVAL') res.status(HttpStatus.ACCEPTED);
    return out;
  }

  /** Lo que la persona tiene en las manos (sin datos del paciente). */
  @Get('org/support-engagements/:id/handover-preview')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Vista previa del traspaso de una baja' })
  handoverPreview(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HandoverPreviewDto> {
    return this.handover.preview(id);
  }

  /** Baja con traspaso: revoca primero y reasigna después. */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_OFFBOARDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('org/support-engagements/:id/offboard')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de baja con traspaso del trabajo' })
  offboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OffboardEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OffboardResultDto> {
    return this.handover.offboard(id, dto, actor);
  }

  /** Suspensión inmediata, sin aprobación (reduce acceso). */
  @Audited({
    action: 'SUPPORT_ENGAGEMENT_SUSPENDED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Post('org/support-engagements/:id/suspend')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender a una persona de apoyo' })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SuspensionResultDto> {
    return this.suspension.suspend(id, dto, actor);
  }

  /** Pide reactivar: crea el cuatro ojos (202). */
  @Audited({
    action: 'FOUR_EYES_REQUESTED',
    entity: 'four_eyes_request',
    entityId: 'result.approvalId',
  })
  @Post('org/support-engagements/:id/reactivate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Pedir la reactivación de una persona suspendida' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactivateEngagementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SuspensionResultDto> {
    return this.suspension.reactivate(id, dto, actor);
  }
}
