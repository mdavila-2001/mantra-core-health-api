import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  RequestId,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InpatientAdtService } from '../services/inpatient-adt.service';
import { InpatientCensusService } from '../services/inpatient-census.service';
import { InpatientIndicatorsService } from '../services/inpatient-indicators.service';
import {
  AdtResultDto,
  BedAssignmentDto,
  BedCompatibilityQueryDto,
  BedSwapDto,
  CancelLocationDto,
  CensusAdjustmentDto,
  CloseCensusDto,
  CreateAdmissionDto,
  DischargeDto,
  ReviewIncidentDto,
  TransferDto,
} from '../dto/inpatient.dto';

const IF_MATCH = {
  name: 'If-Match',
  required: false,
  description: 'rowVersion del encuentro; distinta: 412',
};

/**
 * Internación / ADT (F3, CONTRATO-F2-F5 §F3.3). Autorización por tenant,
 * alcance y rol de §0.3 (`InfrastructureAccessService`); otro tenant → 404.
 */
@ApiTags('clinical-adt')
@ApiBearerAuth()
@Controller()
export class ClinicalAdtController {
  constructor(private readonly adt: InpatientAdtService) {}

  /** Compatibilidad en vivo de una cama con el encuentro. */
  @Audited({
    action: 'BED_COMPATIBILITY_CHECKED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/bed-compatibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compatibilidad de una cama con el encuentro' })
  compatibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BedCompatibilityQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.adt.compatibility(id, dto.careSpaceId, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Ingreso (A01). */
  @Audited({
    action: 'INPATIENT_ADMITTED',
    entity: 'encounter',
    entityId: 'result.encounterId',
  })
  @Post('clinical/admissions')
  @ApiOperation({ summary: 'Internar a un paciente' })
  @ApiCreatedResponse({ type: AdtResultDto })
  admit(
    @Body() dto: CreateAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AdtResultDto> {
    return this.adt.admit(dto, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Asignar o reservar cama (convierte la reserva propia). */
  @Audited({
    action: 'INPATIENT_BED_ASSIGNED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/bed-assignment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar o reservar cama' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: AdtResultDto })
  assignBed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BedAssignmentDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AdtResultDto> {
    return this.adt.assignBed(id, dto, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Traslado (A02). */
  @Audited({
    action: 'INPATIENT_TRANSFERRED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trasladar de cama' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: AdtResultDto })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AdtResultDto> {
    return this.adt.transfer(id, dto, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Intercambio (A17). */
  @Audited({
    action: 'INPATIENT_BEDS_SWAPPED',
    entity: 'encounter',
    entityId: 'body.encounterAId',
  })
  @Post('clinical/bed-swaps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Intercambiar camas entre dos pacientes' })
  @ApiOkResponse({ type: AdtResultDto })
  swap(
    @Body() dto: BedSwapDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AdtResultDto> {
    return this.adt.swap(dto, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Egreso (A03). */
  @Audited({
    action: 'INPATIENT_DISCHARGED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/discharge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de alta (egreso)' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: AdtResultDto })
  discharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DischargeDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AdtResultDto> {
    return this.adt.discharge(id, dto, ifMatch, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Anular una reserva o un traslado (A12). */
  @Audited({
    action: 'INPATIENT_LOCATION_CANCELLED',
    entity: 'encounter_location',
    entityId: 'param:id',
  })
  @Post('clinical/encounter-locations/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular una reserva o un traslado' })
  @ApiOkResponse({ type: AdtResultDto })
  cancelLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ): Promise<AdtResultDto> {
    return this.adt.cancelLocation(id, dto.reasonText, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Censo vivo de la sede. */
  @Get('sites/:siteId/inpatients')
  @ApiOperation({ summary: 'Pacientes internados de una sede' })
  @ApiQuery({ name: 'unitId', required: false })
  inpatients(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('unitId') unitId: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.adt.inpatients(siteId, unitId, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Ficha de internación: encuentro, movimientos e incidentes. */
  @Get('clinical/encounters/:id/stay')
  @ApiOperation({ summary: 'Ficha de internación' })
  stay(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.adt.stay(id, { actor, tenantId: requireTenantId() });
  }

  /** Revisar un incidente de ubicación forzada. */
  @Audited({
    action: 'PLACEMENT_INCIDENT_REVIEWED',
    entity: 'placement_incident',
    entityId: 'param:id',
  })
  @Patch('clinical/placement-incidents/:id')
  @ApiOperation({ summary: 'Revisar un incidente de ubicación' })
  reviewIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewIncidentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.adt.reviewIncident(id, dto, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }
}

/** Censo diario e indicadores (F3, §F3.3). */
@ApiTags('clinical-census')
@ApiBearerAuth()
@Controller()
export class ClinicalCensusController {
  constructor(
    private readonly census: InpatientCensusService,
    private readonly indicatorsService: InpatientIndicatorsService,
  ) {}

  /** Día cerrado (snapshot + ajustes) o vista previa del día abierto. */
  @Get('sites/:siteId/census')
  @ApiOperation({ summary: 'Censo de un día' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'unitId', required: false })
  view(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('date') date: string,
    @Query('unitId') unitId: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.census.view(siteId, date, unitId, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Cerrar el censo de un día (idempotente por unidad). */
  @Audited({
    action: 'CENSUS_DAY_CLOSED',
    entity: 'inpatient_census_day',
    entityId: 'param:siteId',
  })
  @Post('sites/:siteId/census/:date/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar el censo de un día' })
  close(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Param('date') date: string,
    @Body() dto: CloseCensusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.census
      .close(siteId, date, dto.unitIds, {
        actor,
        tenantId: requireTenantId(),
        requestId,
      })
      .then((closed) => ({ closed }));
  }

  /** Ajuste de un día cerrado (el snapshot no cambia). */
  @Audited({
    action: 'CENSUS_DAY_ADJUSTED',
    entity: 'inpatient_census_day',
    entityId: 'param:id',
  })
  @Post('census-days/:id/adjustments')
  @ApiOperation({ summary: 'Ajustar un día de censo cerrado' })
  adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CensusAdjustmentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.census.adjust(id, dto, {
      actor,
      tenantId: requireTenantId(),
      requestId,
    });
  }

  /** Indicadores OPS sobre días cerrados. */
  @Get('sites/:siteId/inpatient-indicators')
  @ApiOperation({ summary: 'Indicadores hospitalarios (OPS)' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  @ApiQuery({ name: 'unitId', required: false })
  indicators(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('unitId') unitId: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.indicatorsService.indicators(siteId, from, to, unitId, {
      actor,
      tenantId: requireTenantId(),
    });
  }

  /** Tick del worker: cierra los días vencidos. */
  @Audited({ action: 'CENSUS_CLOSE_TICKED', entity: 'inpatient_census_day' })
  @Post('internal/clinical/census-close-tick')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar los censos vencidos (worker)' })
  tick() {
    return this.census.tick();
  }
}
