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
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
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
  @Audited({
    action: 'OPERATIONAL_FRAMEWORK_PUBLISHED',
    entity: 'operational_framework',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'WORKLOAD_ASSESSMENT_CREATED',
    entity: 'workload_assessment',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'WORKLOAD_ASSESSMENT_CONTROL_RESULTS_SET',
    entity: 'workload_assessment',
    entityId: 'param:id',
  })
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
  @Audited({
    action: 'ASSESSMENT_FINDING_CREATED',
    entity: 'assessment_finding',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'REMEDIATION_PLAN_CREATED',
    entity: 'remediation_plan',
    entityId: 'result.id',
  })
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
  @Audited({
    action: 'REMEDIATION_ACTION_VERIFIED',
    entity: 'remediation_action',
    entityId: 'param:id',
  })
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
  @Audited({
    action: 'ASSESSMENT_FINDING_UPDATED',
    entity: 'assessment_finding',
    entityId: 'param:id',
  })
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
