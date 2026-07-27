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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  PractitionerDelegatesService,
  AccessRequestsService,
} from '../services';
import {
  CreatePractitionerDelegateDto,
  CreateAccessRequestDto,
  CreateGrantDto,
  RevokeDelegationDto,
  ResourceCreatedDto,
  OperationResultDto,
} from '../dto';

/**
 * Delegaciones de practitioner y sus operaciones scoped: alta (UC-29-03),
 * solicitud de acceso (UC-29-04), grant pre-autorizado (UC-29-06) y revocación
 * (UC-29-07).
 */
@ApiTags('delegated-access-practitioner-delegates')
@ApiBearerAuth()
@Controller('practitioner-delegates')
export class PractitionerDelegatesController {
  constructor(
    private readonly delegatesService: PractitionerDelegatesService,
    private readonly requestsService: AccessRequestsService,
  ) {}

  /** UC-29-03. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear asignación de delegado de practitioner' })
  create(
    @Body() dto: CreatePractitionerDelegateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.delegatesService.createDelegate(dto, actor);
  }

  /** UC-29-04. */
  @Post(':id/access-requests')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar acceso delegado (aprobación previa)' })
  requestAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAccessRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.requestsService.requestAccess(id, dto, actor);
  }

  /** UC-29-06. */
  @Post(':id/grants')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Otorgar grant delegado por-propósito y temporal' })
  issueGrant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGrantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.delegatesService.issueGrant(id, dto, actor);
  }

  /** UC-29-07. */
  @Post(':id/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar delegación de forma inmediata (cascada authz)',
  })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeDelegationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.delegatesService.revoke(id, dto, actor);
  }
}
