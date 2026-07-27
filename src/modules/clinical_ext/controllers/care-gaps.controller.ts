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
  constructor(private readonly careGapsService: CareGapsService) {}

  /** UC-18-09. */
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
  @Post('immunization-schedules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una dosis del calendario de inmunización',
  })
  createSchedule(
    @Body() dto: CreateImmunizationScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.careGapsService.createSchedule(dto, actor);
  }
}
