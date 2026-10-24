import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de informes diagnósticos (V08-03). */
export class DiagnosticReportItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  lifecycleStatusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentVersionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentReleasedVersionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  resultReleaseStatusConceptId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de informes diagnósticos. */
export class ListDiagnosticReportsQueryDto extends PaginationQueryDto {}

/** Página de informes diagnósticos. */
export class DiagnosticReportPageDto extends pageResponseOf(
  DiagnosticReportItemDto,
  'DiagnosticReportPageDto',
) {}

/** Fila de inmunizaciones (V08-09). */
export class ImmunizationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  vaccineConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  doseNumber!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  lotNumber!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  routeConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  administeredAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  administeredByProfileId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de inmunizaciones. */
export class ListImmunizationsQueryDto extends PaginationQueryDto {}

/** Página de inmunizaciones. */
export class ImmunizationPageDto extends pageResponseOf(
  ImmunizationItemDto,
  'ImmunizationPageDto',
) {}

/** Fila de registros de medicación (V08-10). */
export class MedicationRecordItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requestId!: string | null;

  @ApiProperty({ format: 'uuid' })
  medicationConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recordTypeConceptId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  doseDecimal!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  unitConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  administeredAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recordedByUserId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de registros de medicación. */
export class ListMedicationRecordsQueryDto extends PaginationQueryDto {}

/** Página de registros de medicación. */
export class MedicationRecordPageDto extends pageResponseOf(
  MedicationRecordItemDto,
  'MedicationRecordPageDto',
) {}

/** Fila de procedimientos (V08-11). */
export class ProcedureItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  performerProfileId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  performedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  noteText!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentProcedureId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  statusReasonConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceSiteId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  careSpaceId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recorderProfileId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  outcomeConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  reportedSourceConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  occurrenceStartAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  occurrenceEndAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  recordedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  followUpText!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  operativeReportFileId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de procedimientos. */
export class ListProceduresQueryDto extends PaginationQueryDto {}

/** Página de procedimientos. */
export class ProcedurePageDto extends pageResponseOf(
  ProcedureItemDto,
  'ProcedurePageDto',
) {}

/** Fila de solicitudes de servicio (V08-12). */
export class ServiceRequestItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  @ApiProperty({ format: 'uuid' })
  codeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  intentConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  priorityConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  requesterProfileId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  performerTenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  previousDiagnosticReportId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  duplicateOverrideReason!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  formInstanceId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de solicitudes de servicio. */
export class ListServiceRequestsQueryDto extends PaginationQueryDto {}

/** Página de solicitudes de servicio. */
export class ServiceRequestPageDto extends pageResponseOf(
  ServiceRequestItemDto,
  'ServiceRequestPageDto',
) {}
