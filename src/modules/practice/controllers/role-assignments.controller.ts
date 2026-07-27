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
import { PracticeWorkforceService } from '../services';
import {
  CreateSupportAssignmentDto,
  SupportAssignmentResponseDto,
} from '../dto';

/** Endpoints con raíz en `/role-assignments`: personal de apoyo a un rol. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('role-assignments')
export class RoleAssignmentsController {
  constructor(private readonly workforceService: PracticeWorkforceService) {}

  /** UC-14-09. */
  @Post(':roleId/support-assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adjuntar personal de apoyo a un rol de profesional',
  })
  attachSupport(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: CreateSupportAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportAssignmentResponseDto> {
    return this.workforceService.attachSupport(roleId, dto, actor);
  }
}
