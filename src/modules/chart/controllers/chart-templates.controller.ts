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
import { ChartTemplatesService } from '../services';
import { AssignmentResponseDto, AssignTemplateDto } from '../dto';

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
}
