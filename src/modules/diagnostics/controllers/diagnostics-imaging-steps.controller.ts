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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { DiagnosticsImagingStepsService } from '../services';
import {
  CreateImagingStepDto,
  ImagingStepDto,
  ImagingWorklistDto,
  ImagingWorklistQueryDto,
  ScheduleImagingStepDto,
} from '../dto';

/**
 * Pasos de imagen programados y Modality Worklist (F5a).
 *
 * Programar un paso lo hacen el clínico y quien agenda (no lleva datos clínicos: equipo,
 * sala y hora); crear el paso y leer la worklist —que lleva el identificador del paciente—
 * quedan para el personal clínico.
 */
@ApiTags('diagnostics-imaging')
@ApiBearerAuth()
@Controller('diagnostics')
export class DiagnosticsImagingStepsController {
  /** @param steps - Pasos y worklist. */
  constructor(private readonly steps: DiagnosticsImagingStepsService) {}

  /** Crea un paso planificado de un estudio. */
  @Audited({
    action: 'IMAGING_STEP_CREATED',
    entity: 'imaging_procedure_step',
    entityId: 'result.id',
  })
  @Post('imaging-studies/:id/procedure-steps')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un paso de procedimiento de un estudio' })
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateImagingStepDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImagingStepDto> {
    return this.steps.createStep(id, dto, actor);
  }

  /** Programa un paso en un equipo y una hora; la sala es la del equipo. */
  @Audited({
    action: 'IMAGING_STEP_SCHEDULED',
    entity: 'imaging_procedure_step',
    entityId: 'param:id',
  })
  @Post('imaging-procedure-steps/:id/schedule')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SCHEDULING_ADMIN', 'SCHEDULING_AGENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Programar un paso en un equipo (la sala sale de dónde está el equipo)',
  })
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleImagingStepDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImagingStepDto> {
    return this.steps.scheduleStep(id, dto, actor);
  }

  /** La Modality Worklist de una estación. */
  @AccessLogged({ resourceType: 'IMAGING_WORKLIST' })
  @Get('imaging-worklist')
  @Roles('CLINICIAN', 'PRACTITIONER')
  @ApiOperation({
    summary:
      'Modality Worklist de una estación: pasos programados con AE Title y sala (SPS Location)',
  })
  worklist(
    @Query() query: ImagingWorklistQueryDto,
  ): Promise<ImagingWorklistDto> {
    return this.steps.worklist(query);
  }
}
