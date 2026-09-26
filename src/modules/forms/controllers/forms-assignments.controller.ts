import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
  ExtensionBudgetResponseDto,
  FieldAssignmentListResponseDto,
  IdResponseDto,
  OkResultDto,
  ReorderAssignmentsDto,
  UpdateAssignmentDto,
} from '../dto';

/**
 * Asignación de campos a targets sobre `/forms/assignments`. Administración de
 * extensibilidad con enforcement de la política de gobernanza. Capa fina que
 * delega en `FormsAssignmentsService`.
 *
 * La lectura admite también a los roles clínicos: qué campos van en qué
 * sección lo consulta quien dibuja el formulario, no sólo quien lo asigna.
 *
 * Y desde el generador de formularios, **la escritura también**: un doctor
 * puede colgar campos propios dentro de su organización, con la política de
 * extensión como techo. Los tres límites que eso implica los aplica
 * `FormsAssignmentsService`, no este controlador — acá sólo se abre la puerta
 * del rol.
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

  /**
   * Cuánto puede extender el tenant este target, antes de escribir nada.
   *
   * Va acá y no en un controlador propio porque es la misma regla que aplica el
   * `POST` de al lado; separarlas es lo que hace que una diga que sí y la otra
   * que no.
   */
  @Get('budget')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Presupuesto de extensión del target para el tenant actual',
  })
  @ApiQuery({
    name: 'targetResourceConceptId',
    required: true,
    description: 'Target cuyo presupuesto se consulta',
  })
  getBudget(
    @Query('targetResourceConceptId', new ParseUUIDPipe())
    targetResourceConceptId: string,
  ): Promise<ExtensionBudgetResponseDto> {
    return this.readService.getExtensionBudget(
      targetResourceConceptId,
      getCurrentTenantId(),
    );
  }

  /** UC-09-06. */
  @Post()
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
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

  /**
   * CL-61: reordena los campos propios de un target. **Declarada antes** que
   * las rutas con `:id` para que `order` nunca se lea como un identificador.
   */
  @Put('order')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar los campos propios de un formulario' })
  reorderAssignments(
    @Body() dto: ReorderAssignmentsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.assignmentsService.reorderAssignments(dto, actor);
  }

  /** CL-61: cambia lo obligatorio, visible o editable de un campo propio. */
  @Patch(':id')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar una asignación propia' })
  updateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.assignmentsService.updateAssignment(id, dto, actor);
  }

  /** CL-61: descuelga un campo propio (baja lógica; los valores siguen). */
  @Delete(':id')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar una asignación propia (baja lógica)' })
  retireAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.assignmentsService.retireAssignment(id, actor);
  }
}
