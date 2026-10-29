import {
  Body,
  Controller,
  Get,
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
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  NotAudited,
  type AuthenticatedUser,
} from '../../../common';
import { CorrelationId, IfMatch } from '../../practice/http/request-decorators';
import {
  AdtOverrideDto,
  BedAssignmentDto,
  BedCompatibilityDto,
  BedSwapDto,
  CancelLocationDto,
  CreateAdmissionDto,
  DischargeDto,
  InpatientsQueryDto,
  ReviewIncidentDto,
  TransferDto,
} from '../dto/adt.dto';
import { BedCompatibilityService } from '../services/bed-compatibility.service';
import { InpatientAdtService } from '../services/inpatient-adt.service';
import { InpatientReadService } from '../services/inpatient-read.service';

const IF_MATCH = {
  name: 'If-Match',
  required: true,
  description:
    'rowVersion vigente del encuentro (412 si no coincide, 428 si falta)',
};

/**
 * Internación / ADT (CONTRATO-F2-F5 F3.3): ingreso, asignación de cama,
 * traslado, intercambio, egreso, cancelaciones e incidentes de colocación.
 *
 * Sin `@Roles`: la autorización es de **alcance** —el rol operativo
 * (Enfermería, Admisión…) sobre la sede, la unidad o la cama— y la decide
 * `AdtAccessService`. Un recurso de otro tenant responde 404; sin el rol, 403
 * `INFRA_ACTION_NOT_ALLOWED`.
 */
@ApiTags('clinical-adt')
@ApiBearerAuth()
@Controller()
export class ClinicalAdtController {
  /**
   * @param adt - Ingreso, traslado, egreso.
   * @param compat - Compatibilidad de camas.
   * @param reader - Lecturas de internación.
   */
  constructor(
    private readonly adt: InpatientAdtService,
    private readonly compat: BedCompatibilityService,
    private readonly reader: InpatientReadService,
  ) {}

  /** Consulta de compatibilidad: no escribe. */
  @NotAudited('Consulta de compatibilidad de una cama: no cambia ningún dato')
  @Post('clinical/encounters/:id/bed-compatibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compatibilidad de una cama con el encuentro' })
  @ApiResponse({ status: 404, description: 'Encuentro o cama de otro tenant' })
  bedCompatibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BedCompatibilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.compat.check(id, dto, actor);
  }

  /** Ingreso con o sin cama. */
  @Audited({
    action: 'INPATIENT_ADMITTED',
    entity: 'encounter',
    entityId: 'result.encounterId',
  })
  @Post('clinical/admissions')
  @ApiOperation({ summary: 'Ingreso (A01) con asignación o reserva de cama' })
  @ApiResponse({
    status: 409,
    description:
      'PATIENT_ALREADY_ADMITTED, BED_NOT_ASSIGNABLE, BED_DOUBLE_OCCUPANCY',
  })
  @ApiResponse({
    status: 422,
    description:
      'BED_COMPATIBILITY_OVERRIDE_REQUIRED y validaciones del forzado',
  })
  admit(
    @Body() dto: CreateAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.admit(dto, actor, requestId);
  }

  /** Asigna o reserva una cama a un encuentro ya ingresado. */
  @Audited({
    action: 'BED_ASSIGNED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/bed-assignment')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH)
  @ApiOperation({
    summary: 'Asignar o reservar una cama (If-Match del encuentro)',
  })
  assignBed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BedAssignmentDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.assignBed(id, dto, expectedVersion, actor, requestId);
  }

  /** Traslado atómico entre camas. */
  @Audited({
    action: 'INPATIENT_TRANSFERRED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH)
  @ApiOperation({ summary: 'Traslado (A02) atómico; deja el origen sucio' })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.transfer(id, dto, expectedVersion, actor, requestId);
  }

  /** Intercambio de camas entre dos pacientes. */
  @Audited({
    action: 'BEDS_SWAPPED',
    entity: 'encounter',
    entityId: 'body.encounterAId',
  })
  @Post('clinical/bed-swaps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Intercambio de camas (A17) en una transacción' })
  swap(
    @Body() dto: BedSwapDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.swap(dto, actor, requestId);
  }

  /** Egreso: cierra ubicación y encuentro, deja la cama sucia. */
  @Audited({
    action: 'INPATIENT_DISCHARGED',
    entity: 'encounter',
    entityId: 'param:id',
  })
  @Post('clinical/encounters/:id/discharge')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH)
  @ApiOperation({
    summary: 'Egreso (A03); la cama queda sucia con su orden de limpieza',
  })
  discharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DischargeDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.discharge(id, dto, expectedVersion, actor, requestId);
  }

  /** Cancela una reserva o un traslado. */
  @Audited({
    action: 'ENCOUNTER_LOCATION_CANCELLED',
    entity: 'encounter_location',
    entityId: 'param:id',
  })
  @Post('clinical/encounter-locations/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una reserva (A11) o un traslado (A12)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.cancelLocation(id, dto, actor, requestId);
  }

  /** Censo vivo: los internados hoy. */
  @Get('sites/:siteId/inpatients')
  @ApiOperation({ summary: 'Pacientes internados hoy en el establecimiento' })
  @ApiResponse({ status: 404, description: 'Sede de otro tenant' })
  inpatients(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: InpatientsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reader.inpatients(siteId, query, actor);
  }

  /** Ficha de internación. */
  @Get('clinical/encounters/:id/stay')
  @ApiOperation({
    summary: 'Ficha de internación: encuentro, movimientos e incidentes',
  })
  @ApiResponse({ status: 404, description: 'Encuentro de otro tenant' })
  stay(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reader.stay(id, actor);
  }

  /** Revisión de un incidente de colocación. */
  @Audited({
    action: 'PLACEMENT_INCIDENT_REVIEWED',
    entity: 'placement_incident',
    entityId: 'param:id',
  })
  @Patch('clinical/placement-incidents/:id')
  @ApiOperation({ summary: 'Revisar o cerrar un incidente de colocación' })
  reviewIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewIncidentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.adt.reviewIncident(id, dto, actor, requestId);
  }
}

export type { AdtOverrideDto };
