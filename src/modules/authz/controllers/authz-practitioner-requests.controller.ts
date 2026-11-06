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
import {
  ApiBearerAuth,
  ApiOkResponse,
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
  AuthzAccessRequestsReadService,
  AuthzPrimaryCareService,
} from '../services';
import {
  AccessRequestItemDto,
  AuthzStatusResultDto,
  RespondPrimaryCareRequestDto,
} from '../dto';

/**
 * The practitioner's side of the access-request inbox: it lists what they sent
 * and received, and answers the primary-care requests patients make. The
 * practitioner comes from the session, never from the path.
 */
@ApiTags('authz-practitioner-requests')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('authz/practitioners/me')
export class AuthzPractitionerRequestsController {
  /**
   * @param accessRequests - Unified inbox.
   * @param primaryCare - Answer to primary-care requests.
   */
  constructor(
    private readonly accessRequests: AuthzAccessRequestsReadService,
    private readonly primaryCare: AuthzPrimaryCareService,
  ) {}

  /** Requests the practitioner sent and received. */
  @Get('access-requests')
  @ApiOkResponse({ type: AccessRequestItemDto, isArray: true })
  @ApiOperation({ summary: 'Solicitudes de acceso enviadas y recibidas' })
  listAccessRequests(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessRequestItemDto[]> {
    return this.accessRequests.listForPractitioner(actor);
  }

  /** Accepts or rejects a primary-care request made by a patient. */
  @Audited({
    action: 'CARE_RELATIONSHIP_REQUEST_ANSWERED',
    entity: 'care_relationship',
    entityId: 'param:id',
  })
  @Post('care-relationships/:id/respond')
  @ApiOkResponse({ type: AuthzStatusResultDto })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar o rechazar una solicitud de cabecera de un paciente',
  })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondPrimaryCareRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzStatusResultDto> {
    return this.primaryCare.respondAsPractitioner(id, dto, actor);
  }
}
