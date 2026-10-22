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
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { CareGapsService } from '../services';
import {
  RecomputeCareGapsDto,
  CloseCareGapDto,
  ProjectImmunizationPlanDto,
  CreateImmunizationScheduleDto,
  RecomputeCareGapsResponseDto,
  ImmunizationPlanResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints de brechas de cuidado e inmunizaciones: recomputo (UC-18-09), cierre
 * (UC-18-10), proyección del plan de inmunización (UC-18-11) y alta del calendario
 * (dato de referencia). Capa fina sobre `CareGapsService`.
 */
@ApiTags('clinical-ext-care-gaps')
@ApiBearerAuth()
@Controller()
export class CareGapsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param careGapsService - Valor de care gaps service requerido por la operación.
   */
  constructor(private readonly careGapsService: CareGapsService) {}

  /** UC-18-09. */
  @Audited({
    action: 'CARE_GAPS_RECOMPUTED',
    entity: 'care_gap',
    entityId: 'result.id',
  })
  @Post('care-gaps/recompute')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Detectar y abrir brechas de cuidado (batch)' })
  recompute(
    @Body() dto: RecomputeCareGapsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RecomputeCareGapsResponseDto> {
    return this.careGapsService.recompute(dto, actor);
  }

  /** UC-18-10. */
  @Audited({
    action: 'CARE_GAP_CLOSED',
    entity: 'care_gap',
    entityId: 'param:id',
  })
  @Patch('care-gaps/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una brecha de cuidado por evento clínico' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseCareGapDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.careGapsService.close(id, dto, actor);
  }

  /** UC-18-11. */
  @Audited({
    action: 'IMMUNIZATION_PLAN_PROJECTED',
    entity: 'patient_profile',
    entityId: 'param:id',
  })
  @Post('patients/:id/immunization-plan/project')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Proyectar el plan de inmunización y abrir brechas',
  })
  projectImmunizationPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProjectImmunizationPlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImmunizationPlanResponseDto> {
    return this.careGapsService.projectImmunizationPlan(id, dto, actor);
  }

  /** Alta de dosis del calendario de inmunización (alimenta UC-18-11). */
  @Audited({
    action: 'IMMUNIZATION_SCHEDULE_CREATED',
    entity: 'immunization_schedule',
    entityId: 'result.id',
  })
  @Post('immunization-schedules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una dosis del calendario de inmunización',
  })
  createSchedule(
    @Body() dto: CreateImmunizationScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{
    /**
     * Identificador único de la instancia.
     */
    id: string;
  }> {
    return this.careGapsService.createSchedule(dto, actor);
  }
}
