import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { OrgUserAssignmentsService } from '../services';
import {
  CreateOrgUserAssignmentDto,
  UpdateOrgUserAssignmentDto,
  ResourceCreatedDto,
  OperationResultDto,
} from '../dto';

/** Asignaciones de usuario de organización (UC-29-01, UC-29-10). */
@ApiTags('delegated-access-org')
@ApiBearerAuth()
@Controller()
export class OrgUserAssignmentsController {
  constructor(private readonly service: OrgUserAssignmentsService) {}

  /** UC-29-01. */
  @Post('org/:tenantMembershipId/user-assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar usuario de organización con alcance y vigencia' })
  create(
    @Param('tenantMembershipId', ParseUUIDPipe) tenantMembershipId: string,
    @Body() dto: CreateOrgUserAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.createAssignment(tenantMembershipId, dto, actor);
  }

  /** UC-29-10. */
  @Patch('org/user-assignments/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reasignar supervisor / suspender asignación de organización' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrgUserAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.service.updateAssignment(id, dto, actor);
  }
}
