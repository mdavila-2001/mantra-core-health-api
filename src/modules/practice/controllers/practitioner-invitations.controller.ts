import {
  Controller,
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
import { PracticeAffiliationInvitationsService } from '../services';
import { RoleAssignmentRowDto } from '../dto/role-assignment-row.dto';

/**
 * El profesional responde a las invitaciones que recibe
 * (`/practitioners/me/role-assignments/:roleId/accept|decline`).
 *
 * Cuelga de `me`: cada profesional resuelve solo las suyas; la de otro
 * responde 404, igual que una inexistente.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practitioners')
export class PractitionerInvitationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param invitationsService - Invitar, aceptar y declinar.
   */
  constructor(
    private readonly invitationsService: PracticeAffiliationInvitationsService,
  ) {}

  /** `INVITED → ACTIVE`, solo esa fila. */
  @Audited({
    action: 'PRACTITIONER_ROLE_INVITATION_ACCEPTED',
    entity: 'practitioner_role_assignment',
    entityId: 'param:roleId',
  })
  @Post('me/role-assignments/:roleId/accept')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar una invitación de un centro' })
  accept(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowDto> {
    return this.invitationsService.accept(roleId, actor);
  }

  /** `INVITED → REJECTED`, solo esa fila. */
  @Audited({
    action: 'PRACTITIONER_ROLE_INVITATION_DECLINED',
    entity: 'practitioner_role_assignment',
    entityId: 'param:roleId',
  })
  @Post('me/role-assignments/:roleId/decline')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Declinar una invitación de un centro' })
  decline(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentRowDto> {
    return this.invitationsService.decline(roleId, actor);
  }
}
