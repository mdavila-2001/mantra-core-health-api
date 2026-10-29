import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /diagnostics/imaging-studies/{id}/procedure-steps` (F5a). */
export class CreateImagingStepDto {
  /** Procedimiento del paso (concepto). */
  @ApiProperty({ format: 'uuid', description: 'Procedimiento (concept id)' })
  @IsUUID()
  codeConceptId!: string;

  /** Modalidad DICOM del paso. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  /** Región anatómica. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /** Protocolo (referencia libre). */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  protocolReference?: string;
}

/** Cuerpo de `POST /diagnostics/imaging-procedure-steps/{id}/schedule` (F5a). */
export class ScheduleImagingStepDto {
  /** Equipo (modalidad) donde se hará el paso. La sala sale de dónde está el equipo. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  equipmentId!: string;

  /** Cuándo empieza (Scheduled Procedure Step Start). */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  scheduledStartAt!: string;
}

/** Paso de imagen, como lo ve quien lo programa. Sin datos de paciente. */
export class ImagingStepDto {
  /** Id del paso. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Estudio al que pertenece. */
  @ApiProperty({ format: 'uuid' })
  imagingStudyId!: string;

  /** Número de paso dentro del estudio. */
  @ApiProperty()
  stepNumber!: number;

  /** Estado del paso (concepto). */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Equipo programado. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  scheduledEquipmentId!: string | null;

  /** Sala programada: la del equipo, derivada por la API. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  scheduledCareSpaceId!: string | null;

  /** Inicio programado. */
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  scheduledStartAt!: string | null;
}

/** Filtros de `GET /diagnostics/imaging-worklist` (F5a). */
export class ImagingWorklistQueryDto {
  /** Equipo (estación). Uno de `equipmentId` o `aeTitle` es obligatorio. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  /** Scheduled Station AE Title. */
  @ApiPropertyOptional({ maxLength: 16 })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  aeTitle?: string;

  /** Desde (inclusive). Por omisión, hoy a las 00:00 UTC. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Hasta (exclusive). Por omisión, 24 horas después de `from`. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** Tope de filas. */
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** Un ítem de la Modality Worklist. */
export class ImagingWorklistItemDto {
  /** Id del paso programado. */
  @ApiProperty({ format: 'uuid' })
  stepId!: string;

  /** Estudio. */
  @ApiProperty({ format: 'uuid' })
  imagingStudyId!: string;

  /** Study Instance UID. */
  @ApiProperty()
  studyInstanceUid!: string;

  /** Accession Number, si el estudio lo tiene. */
  @ApiProperty({ nullable: true, type: String })
  accessionNumber!: string | null;

  /** Paciente (solo el identificador: la estación lo resuelve contra el MPI). */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** Modalidad. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  modalityConceptId!: string | null;

  /** Scheduled Station AE Title (0040,0001). */
  @ApiProperty({ nullable: true, type: String })
  scheduledStationAETitle!: string | null;

  /** Scheduled Station Name (0040,0010). */
  @ApiProperty({ nullable: true, type: String })
  scheduledStationName!: string | null;

  /** Scheduled Procedure Step Location (0040,0011): el código de la sala. */
  @ApiProperty({ nullable: true, type: String })
  spsLocation!: string | null;

  /** Sala. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  careSpaceId!: string | null;

  /** Equipo. */
  @ApiProperty({ format: 'uuid' })
  equipmentId!: string;

  /** Inicio programado (0040,0002/0003). */
  @ApiProperty({ format: 'date-time' })
  scheduledStartAt!: string;
}

/** Respuesta de `GET /diagnostics/imaging-worklist`. */
export class ImagingWorklistDto {
  /** Los pasos programados en la estación, por hora de inicio. */
  @ApiProperty({ type: [ImagingWorklistItemDto] })
  items!: ImagingWorklistItemDto[];

  /** Cuántos. */
  @ApiProperty()
  count!: number;
}
