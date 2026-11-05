import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { PracticeAffiliationInvitationsService } from '../services';
import {
  InvitePractitionerDto,
  RoleAssignmentRowsResponseDto,
} from '../dto/role-assignment-row.dto';

/**
 * Invitaciones del centro a sus profesionales (`/practices/:practiceId/role-assignments/invitations`).
 *
 * Sin `@Roles`: quien invita es el administrador de **esa** organización
 * (A-6), y esa regla la aplica el servicio —depende de la membresía, no de un
 * rol global—.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practices')
export class PracticeInvitationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param invitationsService - Invitar, aceptar y declinar.
   */
  constructor(
    private readonly invitationsService: PracticeAffiliationInvitationsService,
  ) {}

  /** El centro invita a un profesional a procedimientos de una sede. */
  @Audited({
    action: 'PRACTITIONER_ROLE_INVITED',
    entity: 'practitioner_role_assignment',
    entityId: 'param:practiceId',
  })
  @Post(':practiceId/role-assignments/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invitar a un profesional a procedimientos de una sede',
    description:
      'Crea una vinculación INVITED por procedimiento. Ninguna llega a ACTIVE sin que el profesional la acepte.',
  })
  invite(
    @Param('practiceId', ParseUUIDPipe) practiceId: string,
    @Body() dto: InvitePractitionerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowsResponseDto> {
    return this.invitationsService.invite(practiceId, dto, actor);
  }
}
