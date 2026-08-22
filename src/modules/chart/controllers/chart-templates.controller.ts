import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  Roles,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ChartTemplatesService } from '../services';
import {
  AssignmentResponseDto,
  AssignTemplateDto,
  ChartTemplateResponseDto,
  CreateChartTemplateDto,
} from '../dto';

/**
 * Endpoints de plantillas de chart (`/charts/templates`). La asignación es una
 * acción del Administrador de Práctica; se restringe con `@Roles`.
 */
@ApiTags('chart-templates')
@ApiBearerAuth()
@Controller('charts/templates')
export class ChartTemplatesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param templatesService - Valor de templates service requerido por la operación.
   */
  constructor(private readonly templatesService: ChartTemplatesService) {}

  /** UC-15-12. */
  @Post(':templateId/assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar una plantilla de chart por especialidad' })
  assignTemplate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: AssignTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssignmentResponseDto> {
    return this.templatesService.assignTemplate(templateId, dto, actor);
  }

  /** Carril 2 · punto 1: crear una plantilla con su esquema de campos. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Crear una plantilla de chart con su esquema de campos, por especialidad',
  })
  createTemplate(
    @Body() dto: CreateChartTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChartTemplateResponseDto> {
    return this.templatesService.createTemplate(dto, actor);
  }

  /**
   * Carril 2 · punto 1: listar las plantillas por especialidad.
   *
   * Lectura abierta a los roles clínicos (Fase 3 del carril de consulta): el
   * expediente necesita el esquema para pintar el formulario de especialidad, y
   * pedirle SECURITY_ADMIN a quien atiende era pedirle el rol equivocado. Los
   * POST administrativos siguen siendo del administrador.
   */
  @Get()
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar las plantillas de chart por especialidad' })
  @ApiQuery({ name: 'specialtyId', required: false, format: 'uuid' })
  listTemplates(
    @Query('specialtyId', new ParseUUIDPipe({ optional: true }))
    specialtyId?: string,
  ): Promise<ChartTemplateResponseDto[]> {
    return this.templatesService.listTemplates(
      specialtyId,
      getCurrentTenantId(),
    );
  }

  /** Carril 2 · punto 1: leer el esquema completo de una plantilla. */
  @Get(':id')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Leer el esquema de una plantilla de chart' })
  getTemplate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChartTemplateResponseDto> {
    // El mismo aislamiento que el listado: global o del tenant propio. Sin él,
    // saber el uuid bastaba para leer la plantilla de otra organización.
    return this.templatesService.getTemplate(id, getCurrentTenantId());
  }
}
