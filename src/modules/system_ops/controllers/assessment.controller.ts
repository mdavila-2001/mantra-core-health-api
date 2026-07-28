import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AssessmentService } from '../services';
import {
  CreateFindingDto,
  CreateFrameworkDto,
  CreateRemediationPlanDto,
  CreateWorkloadAssessmentDto,
  FindingResponseDto,
  FrameworkResponseDto,
  IdResultDto,
  PutControlResultsDto,
  RemediationPlanResponseDto,
  StatusResultDto,
  UpdateFindingDto,
  VerifyRemediationActionDto,
} from '../dto';

/**
 * Endpoints del ciclo de assurance operativo (UC-11-11..14): frameworks,
 * evaluaciones, resultados de control, hallazgos, planes y verificación de
 * acciones de remediación.
 */
@ApiTags('system-ops-assessments')
@ApiBearerAuth()
@Controller('admin/governance')
export class AssessmentController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: AssessmentService) {}

  /** UC-11-11. */
  @Post('operational-frameworks')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar un framework operativo con sus controles',
  })
  publishFramework(
    @Body() dto: CreateFrameworkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FrameworkResponseDto> {
    return this.service.publishFramework(dto, actor);
  }

  /** UC-11-12. */
  @Post('workload-assessments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar una evaluación de workload' })
  createAssessment(
    @Body() dto: CreateWorkloadAssessmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createAssessment(dto, actor);
  }

  /** UC-11-12. */
  @Put('workload-assessments/:id/control-results')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar (UPSERT) resultados de control de una evaluación',
  })
  putControlResults(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PutControlResultsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.putControlResults(id, dto, actor);
  }

  /** UC-11-13. */
  @Post('assessments/:id/findings')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir un hallazgo sobre una evaluación' })
  createFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFindingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FindingResponseDto> {
    return this.service.createFinding(id, dto, actor);
  }

  /** UC-11-13. */
  @Post('assessments/:id/remediation-plans')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un plan de remediación con sus acciones' })
  createRemediationPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRemediationPlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RemediationPlanResponseDto> {
    return this.service.createRemediationPlan(id, dto, actor);
  }

  /** UC-11-14. */
  @Post('remediation-actions/:id/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar y cerrar una acción de remediación' })
  verifyAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyRemediationActionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.verifyAction(id, dto, actor);
  }

  /** UC-11-14. */
  @Patch('findings/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un hallazgo (estado / owner)' })
  updateFinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFindingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.updateFinding(id, dto, actor);
  }
}
