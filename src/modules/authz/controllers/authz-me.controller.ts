import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzMeService } from '../services';
import { AuthzStatusResultDto, MyClinicalAccessResponseDto } from '../dto';

/**
 * «Quién ve mi historia» (BR-20): el titular lista y revoca los accesos a su
 * historia. Cuelga de `me`: la persona sale de la cuenta y no hay identificador
 * de paciente que comparar. Los `@Roles` de los endpoints existentes de `authz`
 * no cambian.
 */
@ApiTags('authz-me')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('authz/me')
export class AuthzMeController {
  /**
   * @param service - Lectura y revocación del titular.
   */
  constructor(private readonly service: AuthzMeService) {}

  /** Relaciones asistenciales y accesos clínicos sobre mi historia. */
  @Get('access')
  @ApiOperation({ summary: 'Quién ve mi historia' })
  listMyAccess(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyClinicalAccessResponseDto> {
    return this.service.listMyAccess(actor);
  }

  /** Revoca una de mis relaciones asistenciales. */
  @Post('care-relationships/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar una de mis relaciones asistenciales' })
  revokeCareRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.service.revokeMyCareRelationship(actor, id);
  }

  /** Revoca uno de los accesos clínicos a mi historia. */
  @Post('clinical-access-grants/:grantId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar uno de los accesos clínicos a mi historia',
  })
  revokeClinicalGrant(
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.service.revokeMyClinicalGrant(actor, grantId);
  }
}
