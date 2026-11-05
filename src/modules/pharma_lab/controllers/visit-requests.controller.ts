import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CancelVisitDto,
  CreateVisitRequestDto,
  CreatedResourceDto,
  ProposeVisitTimeDto,
  RescheduleVisitDto,
  TransitionResultDto,
  VisitDecisionDto,
} from '../dto';
import type {
  VisitRequestEvents,
  VisitRequestTopics,
  VisitRequests,
} from '../entities';
import { VisitRequestsService } from '../services';

/**
 * Solicitudes de visita médica (UC-17-13 a UC-17-17).
 * Capa fina que delega en `VisitRequestsService`.
 */
@ApiTags('pharma-lab-visit-requests')
@ApiBearerAuth()
@Controller('visit-requests')
export class VisitRequestsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de la solicitud de visita.
   */
  constructor(private readonly service: VisitRequestsService) {}

  /** UC-17-13. */
  @Audited({
    action: 'VISIT_REQUEST_CREATED',
    entity: 'visit_request',
    entityId: 'result.id',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('MEDICAL_VISITOR')
  @ApiOperation({ summary: 'Solicitar una visita médica a un doctor' })
  create(
    @Body() dto: CreateVisitRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createRequest(dto, actor);
  }

  /** Solicitudes del visitador autenticado. */
  @Get('mine')
  @Roles('MEDICAL_VISITOR')
  @ApiOperation({ summary: 'Listar las propias solicitudes de visita' })
  listMine(@CurrentUser() actor: AuthenticatedUser): Promise<VisitRequests[]> {
    return this.service.listOwnRequests(actor);
  }

  /** Solicitudes dirigidas al doctor autenticado. */
  @Get('inbox')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Listar las solicitudes de visita recibidas' })
  listInbox(@CurrentUser() actor: AuthenticatedUser): Promise<VisitRequests[]> {
    return this.service.listDoctorRequests(actor);
  }

  /** Detalle con temario y bitácora. */
  @Get(':visitRequestId')
  @Roles('MEDICAL_VISITOR', 'PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Consultar una solicitud con su bitácora' })
  getOne(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{
    /** La solicitud. */
    request: VisitRequests;
    /** Productos o temas declarados. */
    topics: VisitRequestTopics[];
    /** Bitácora de transiciones. */
    events: VisitRequestEvents[];
  }> {
    return this.service.getRequestDetail(visitRequestId, actor);
  }

  /** UC-17-14. */
  @Audited({
    action: 'VISIT_REQUEST_ACCEPTED',
    entity: 'visit_request',
    entityId: 'param:visitRequestId',
  })
  @Post(':visitRequestId/accept')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Aceptar la visita' })
  accept(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @Body() dto: VisitDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.accept(visitRequestId, dto, actor);
  }

  /** UC-17-14. */
  @Audited({
    action: 'VISIT_REQUEST_REJECTED',
    entity: 'visit_request',
    entityId: 'param:visitRequestId',
  })
  @Post(':visitRequestId/reject')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Rechazar la visita' })
  reject(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @Body() dto: VisitDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.reject(visitRequestId, dto, actor);
  }

  /** UC-17-14. */
  @Audited({
    action: 'VISIT_REQUEST_INFO_REQUESTED',
    entity: 'visit_request',
    entityId: 'param:visitRequestId',
  })
  @Post(':visitRequestId/request-info')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Solicitar información adicional al visitador' })
  requestInfo(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @Body() dto: VisitDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.requestInfo(visitRequestId, dto, actor);
  }

  /** UC-17-15. */
  @Audited({
    action: 'VISIT_REQUEST_TIME_PROPOSED',
    entity: 'visit_request',
    entityId: 'param:visitRequestId',
  })
  @Post(':visitRequestId/propose-time')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Proponer otro horario' })
  proposeTime(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @Body() dto: ProposeVisitTimeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.proposeTime(visitRequestId, dto, actor);
  }

  /** UC-17-16. */
  @Audited({
    action: 'VISIT_REQUEST_RESCHEDULED',
    entity: 'visit_request',
    entityId: 'param:visitRequestId',
  })
  @Post(':visitRequestId/reschedule')
  @Roles('MEDICAL_VISITOR')
  @ApiOperation({ summary: 'Reprogramar la visita dentro del plazo permitido' })
  reschedule(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @Body() dto: RescheduleVisitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.reschedule(visitRequestId, dto, actor);
  }

  /** UC-17-17. */
  @Audited({
    action: 'VISIT_REQUEST_CANCELLED',
    entity: 'visit_request',
    entityId: 'param:visitRequestId',
  })
  @Post(':visitRequestId/cancel')
  @Roles('MEDICAL_VISITOR', 'PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Cancelar la visita' })
  cancel(
    @Param('visitRequestId', ParseUUIDPipe) visitRequestId: string,
    @Body() dto: CancelVisitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.cancel(visitRequestId, dto, actor);
  }
}
