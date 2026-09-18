import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ClinicalRecordAccessGuard } from '../../clinical/guards';
import { ChartCarePlansService } from '../services';
import {
  ActivityResponseDto,
  CarePlanResponseDto,
  CreateCarePlanDto,
  UpdateActivityDto,
} from '../dto';

/**
 * Endpoints de planes de cuidado del chart (`/charts/care-plans`).
 *
 * SEC-01: el alta lleva el guard del expediente —`patientProfileId` viaja en el
 * cuerpo—; la actualización de una actividad no, porque su paciente sale del
 * plan ya cargado (GAP-3, deuda abierta).
 */
@ApiTags('chart-care-plans')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('charts/care-plans')
export class ChartCarePlansController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param carePlansService - Valor de care plans service requerido por la operación.
   */
  constructor(private readonly carePlansService: ChartCarePlansService) {}

  /** UC-15-10. */
  @Post()
  @UseGuards(ClinicalRecordAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un plan de cuidado con actividades' })
  createCarePlan(
    @Body() dto: CreateCarePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CarePlanResponseDto> {
    return this.carePlansService.createCarePlan(dto, actor);
  }

  /** UC-15-11. */
  @Patch(':planId/activities/:activityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una actividad del plan de cuidado' })
  updateActivity(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    return this.carePlansService.updateActivity(planId, activityId, dto, actor);
  }
}
