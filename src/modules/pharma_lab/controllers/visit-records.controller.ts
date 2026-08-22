import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  ConfirmVisitRecordDto,
  CreateVisitRecordDto,
  CreatedResourceDto,
  RateVisitDto,
  TransitionResultDto,
} from '../dto';
import type { VisitRecords } from '../entities';
import { VisitRecordsService, type RatingAggregate } from '../services';

/**
 * Registro, confirmación y calificación de visitas (UC-17-18 a UC-17-20).
 * Capa fina que delega en `VisitRecordsService`.
 */
@ApiTags('pharma-lab-visit-records')
@ApiBearerAuth()
@Controller('visit-records')
export class VisitRecordsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso del registro de visita.
   */
  constructor(private readonly service: VisitRecordsService) {}

  /** UC-17-18. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('MEDICAL_VISITOR')
  @ApiOperation({ summary: 'Registrar la visita realizada' })
  create(
    @Body() dto: CreateVisitRecordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createRecord(dto, actor);
  }

  /** Visitas recibidas por el doctor autenticado. */
  @Get('inbox')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Listar las visitas recibidas' })
  listInbox(@CurrentUser() actor: AuthenticatedUser): Promise<VisitRecords[]> {
    return this.service.listDoctorRecords(actor);
  }

  /** UC-17-19. */
  @Post(':visitRecordId/confirm')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Confirmar que la visita ocurrió' })
  confirm(
    @Param('visitRecordId', ParseUUIDPipe) visitRecordId: string,
    @Body() dto: ConfirmVisitRecordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.confirmRecord(visitRecordId, dto, actor);
  }

  /** UC-17-20. */
  @Post(':visitRecordId/rating')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Calificar la visita completada' })
  rate(
    @Param('visitRecordId', ParseUUIDPipe) visitRecordId: string,
    @Body() dto: RateVisitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.rateVisit(visitRecordId, dto, actor);
  }

  /** Historial de visitas del laboratorio. */
  @Get('labs/:pharmaLabId')
  @Roles('PHARMA_LAB_ADMIN', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Historial de visitas del laboratorio' })
  listLabRecords(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<VisitRecords[]> {
    return this.service.listLabRecords(pharmaLabId);
  }

  /** Resultados agregados de las calificaciones (spec 5523). */
  @Get('labs/:pharmaLabId/rating-summary')
  @Roles('PHARMA_LAB_ADMIN', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Resultados agregados de las calificaciones del laboratorio',
    description:
      'Devuelve promedios por dimensión. Las calificaciones individuales no se exponen.',
  })
  ratingSummary(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<RatingAggregate> {
    return this.service.getRatingAggregate(pharmaLabId);
  }
}
