import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ParseOptionalLimitPipe,
  Roles,
  requireTenantId,
} from '../../../common';
import { DelegatedAccessListingService } from '../services';
import {
  ListAccessRequestsResponseDto,
  ListOrgUserAssignmentsResponseDto,
  ListPractitionerDelegatesResponseDto,
} from '../dto';

/** CV-13: lecturas del hub de acceso delegado, siempre acotadas al tenant del actor. */
@ApiTags('delegated-access')
@ApiBearerAuth()
@Controller()
export class DelegatedAccessListingController {
  constructor(private readonly service: DelegatedAccessListingService) {}

  @Get('org/user-assignments')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las asignaciones de usuario de organización del tenant',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ListOrgUserAssignmentsResponseDto })
  listOrgUserAssignments(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListOrgUserAssignmentsResponseDto> {
    return this.service.listOrgUserAssignments(requireTenantId(), {
      cursor,
      limit,
    });
  }

  @Get('practitioner-delegates')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las delegaciones de profesional del tenant',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ListPractitionerDelegatesResponseDto })
  listPractitionerDelegates(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListPractitionerDelegatesResponseDto> {
    return this.service.listPractitionerDelegates(requireTenantId(), {
      cursor,
      limit,
    });
  }

  @Get('access-requests')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las solicitudes de acceso delegado del tenant',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ListAccessRequestsResponseDto })
  listAccessRequests(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListAccessRequestsResponseDto> {
    return this.service.listAccessRequests(requireTenantId(), {
      cursor,
      limit,
    });
  }
}
