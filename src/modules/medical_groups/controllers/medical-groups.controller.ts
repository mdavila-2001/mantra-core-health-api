import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { MedicalGroupsService, type MedicalGroupTab } from '../services';
import {
  CreateMedicalGroupDto,
  MedicalGroupConditionOptionDto,
  MedicalGroupDto,
  MedicalGroupPageDto,
  RequestMedicalGroupRescheduleDto,
  RespondMedicalGroupInvitationDto,
  RespondMedicalGroupRescheduleDto,
  UpdateMedicalGroupExerciseNotesDto,
} from '../dto';

const VALID_TABS: readonly MedicalGroupTab[] = [
  'historico',
  'enviadas',
  'recibidas',
];

/**
 * FT-21 — Corrección de grupo médico. Módulo Doctor: crear, consultar y hacer
 * avanzar el ciclo de vida de un grupo médico (equipo + servicio + agenda).
 */
@ApiTags('medical-groups')
@ApiBearerAuth()
@Roles('PRACTITIONER', 'CLINICIAN')
@Controller('medical-groups')
export class MedicalGroupsController {
  constructor(private readonly service: MedicalGroupsService) {}

  /** AC-21-01/02/03: las tres pestañas comparten este mismo listado, por `tab`. */
  @Get()
  @ApiOperation({
    summary: 'Listar grupos médicos (histórico/enviadas/recibidas)',
  })
  @ApiQuery({ name: 'tab', enum: VALID_TABS, required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('tab') tab: string = 'historico',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<MedicalGroupPageDto> {
    const resolvedTab = VALID_TABS.includes(tab as MedicalGroupTab)
      ? (tab as MedicalGroupTab)
      : 'historico';
    return this.service.list(resolvedTab, actor, {
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** AC-21-06/07: diagnósticos del paciente, más reciente primero. */
  @Get('patients/:patientProfileId/conditions')
  @ApiOperation({
    summary: 'Diagnósticos del paciente para el selector del formulario',
  })
  listPatientConditions(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupConditionOptionDto[]> {
    return this.service.listPatientConditions(patientProfileId, actor);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar un grupo médico (formulario de sólo lectura)',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    return this.service.findOne(id, actor);
  }

  /** AC-21-04/05/08/09/10/11/12/13: crear grupo médico. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear grupo médico' })
  create(
    @Body() dto: CreateMedicalGroupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    return this.service.create(dto, actor);
  }

  /** AC-21-02/03: responder una invitación (solicitud enviada/recibida). */
  @Post(':id/members/:memberId/respond')
  @ApiOperation({
    summary: 'Aceptar o rechazar la invitación a un cargo del grupo',
  })
  respondToInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: RespondMedicalGroupInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    return this.service.respondToInvitation(id, memberId, dto.decision, actor);
  }

  /** AC-21-17/18: "Solicitar cambio de horario". */
  @Post(':id/reschedule-requests')
  @ApiOperation({ summary: 'Solicitar cambio de horario' })
  requestReschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestMedicalGroupRescheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    return this.service.requestReschedule(id, dto.proposedAt, actor);
  }

  /** AC-21-19/20: el creador acepta o rechaza la fecha propuesta. */
  @Post(':id/reschedule-requests/respond')
  @ApiOperation({ summary: 'Resolver la solicitud de cambio de horario' })
  respondToReschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondMedicalGroupRescheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    return this.service.respondToReschedule(id, dto.decision, actor);
  }

  /** AC-21-21/22: notas del procedimiento, hasta una semana después. */
  @Patch(':id/exercise-notes')
  @ApiOperation({
    summary: 'Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO)',
  })
  updateExerciseNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicalGroupExerciseNotesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    return this.service.updateExerciseNotes(id, dto.notesText, actor);
  }
}
