import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { SurveysAssignmentsService } from '../services';
import {
  CreateAssignmentDto,
  IdResponseDto,
  InvitationsIssuedDto,
  IssueInvitationsDto,
} from '../dto';

/**
 * Reparto de encuestas: a qué se asocian y cuándo se emiten.
 *
 * `POST /surveys/invitations` existe como comando explícito porque el cierre de
 * la cita vive en `scheduling`, dominio de otro carril. La nota de integración
 * para encadenarlo automáticamente está en el README del módulo.
 */
@ApiTags('surveys-assignments')
@ApiBearerAuth()
@Roles('PRACTITIONER', 'CLINICIAN')
@Controller('surveys')
export class SurveysAssignmentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param assignmentsService - Asignación y emisión de invitaciones.
   */
  constructor(private readonly assignmentsService: SurveysAssignmentsService) {}

  /** Asocia una versión publicada a una consulta o a un servicio. */
  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asociar una encuesta a una consulta o servicio',
  })
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.assignmentsService.createAssignment(dto, actor);
  }

  /** Emite las invitaciones que correspondan a una atención completada. */
  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir los cuestionarios de una atención completada',
  })
  issueInvitations(
    @Body() dto: IssueInvitationsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InvitationsIssuedDto> {
    return this.assignmentsService.issueForBooking(dto, actor);
  }
}
