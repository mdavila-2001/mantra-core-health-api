import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { FormsAssignmentsService, FormsReadService } from '../services';
import {
  CreateAssignmentDto,
  FieldAssignmentListResponseDto,
  IdResponseDto,
} from '../dto';

/**
 * Asignación de campos a targets sobre `/forms/assignments`. Administración de
 * extensibilidad con enforcement de la política de gobernanza. Capa fina que
 * delega en `FormsAssignmentsService`.
 *
 * La lectura admite también a los roles clínicos: qué campos van en qué
 * sección lo consulta quien dibuja el formulario, no sólo quien lo asigna.
 */
@ApiTags('forms-assignments')
@ApiBearerAuth()
@Controller('forms/assignments')
export class FormsAssignmentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param assignmentsService - Valor de assignments service requerido por la operación.
   * @param readService - Lecturas de asignaciones y secciones.
   */
  constructor(
    private readonly assignmentsService: FormsAssignmentsService,
    private readonly readService: FormsReadService,
  ) {}

  /** Fase 1 de lecturas: asignaciones visibles, con secciones resueltas. */
  @Get()
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar asignaciones de campo (globales y del tenant)',
  })
  @ApiQuery({
    name: 'targetResourceConceptId',
    required: false,
    description: 'Acotar por target',
  })
  @ApiQuery({
    name: 'fieldId',
    required: false,
    description: 'Acotar por campo',
  })
  @ApiQuery({
    name: 'sectionId',
    required: false,
    description: 'Acotar por sección',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  listAssignments(
    @Query('targetResourceConceptId', new ParseUUIDPipe({ optional: true }))
    targetResourceConceptId?: string,
    @Query('fieldId', new ParseUUIDPipe({ optional: true }))
    fieldId?: string,
    @Query('sectionId', new ParseUUIDPipe({ optional: true }))
    sectionId?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<FieldAssignmentListResponseDto> {
    return this.readService.listAssignments(
      { targetResourceConceptId, fieldId, sectionId },
      getCurrentTenantId(),
      limit ?? 50,
    );
  }

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
