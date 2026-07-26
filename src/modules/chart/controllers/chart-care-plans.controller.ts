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
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { ChartCarePlansService } from '../services';
import {
  ActivityResponseDto,
  CarePlanResponseDto,
  CreateCarePlanDto,
  UpdateActivityDto,
} from '../dto';

/** Endpoints de planes de cuidado del chart (`/charts/care-plans`). */
@ApiTags('chart-care-plans')
@ApiBearerAuth()
@Controller('charts/care-plans')
export class ChartCarePlansController {
  constructor(private readonly carePlansService: ChartCarePlansService) {}

  /** UC-15-10. */
  @Post()
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
