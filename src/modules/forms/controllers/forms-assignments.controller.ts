import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { FormsAssignmentsService } from '../services';
import { CreateAssignmentDto, IdResponseDto } from '../dto';

/**
 * Asignación de campos a targets sobre `/forms/assignments`. Administración de
 * extensibilidad con enforcement de la política de gobernanza. Capa fina que
 * delega en `FormsAssignmentsService`.
 */
@ApiTags('forms-assignments')
@ApiBearerAuth()
@Controller('forms/assignments')
export class FormsAssignmentsController {
  constructor(private readonly assignmentsService: FormsAssignmentsService) {}

  /** UC-09-06. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar campos a un target con política de extensión',
  })
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.assignmentsService.createAssignment(dto, actor);
  }
}
