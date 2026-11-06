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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  PatientAnyTenant,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  AuthzAccessRequestsReadService,
  AuthzMeService,
  AuthzPrimaryCareService,
} from '../services';
import {
  AccessRequestItemDto,
  AuthzIdResponseDto,
  AuthzStatusResultDto,
  MyClinicalAccessResponseDto,
  RequestPrimaryPractitionerDto,
} from '../dto';

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
   * @param primaryCare - Pedido de médico de cabecera.
   * @param accessRequests - Buzón unificado de solicitudes.
   */
  constructor(
    private readonly service: AuthzMeService,
    private readonly primaryCare: AuthzPrimaryCareService,
    private readonly accessRequests: AuthzAccessRequestsReadService,
  ) {}

  /** Relaciones asistenciales y accesos clínicos sobre mi historia. */
  @Get('access')
  @ApiOperation({ summary: 'Quién ve mi historia' })
  listMyAccess(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyClinicalAccessResponseDto> {
    return this.service.listMyAccess(actor);
  }

  /** Revoca una de mis relaciones asistenciales. */
  @Audited({
    action: 'CARE_RELATIONSHIP_REVOKED',
    entity: 'care_relationship',
    entityId: 'param:id',
  })
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
  @Audited({
    action: 'CLINICAL_ACCESS_REVOKED',
    entity: 'clinical_access_grant',
    entityId: 'param:grantId',
  })
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

  /** Buzón unificado: solicitudes recibidas y enviadas, de cabecera y granulares. */
  @Get('access-requests')
  @ApiOkResponse({ type: AccessRequestItemDto, isArray: true })
  @ApiOperation({ summary: 'Mis solicitudes de acceso, recibidas y enviadas' })
  listAccessRequests(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessRequestItemDto[]> {
    return this.accessRequests.listForPatient(actor);
  }

  /** Pide a un profesional que sea mi médico de cabecera (el tenant va en `X-Tenant-Id`). */
  @Audited({
    action: 'CARE_RELATIONSHIP_REQUESTED',
    entity: 'care_relationship',
    entityId: 'result.id',
  })
  @Post('primary-practitioner-requests')
  @ApiCreatedResponse({ type: AuthzIdResponseDto })
  @PatientAnyTenant()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pedir a un profesional que sea mi médico de cabecera',
  })
  requestPrimaryPractitioner(
    @Body() dto: RequestPrimaryPractitionerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.primaryCare.requestAsPatient(dto, actor);
  }
}
