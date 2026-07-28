import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

/** Cuerpo de `POST /clinical/procedures` (UC-08-12). */
export class CreateProcedureDto {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    description: 'Código del procedimiento (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Identificador asociado a performer profile.
   */
  @ApiPropertyOptional({
    description: 'Profesional ejecutante',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  performerProfileId?: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({
    description: 'Orden de servicio que lo origina',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Identificador asociado a parent procedure.
   */
  @ApiPropertyOptional({
    description: 'Procedimiento padre (jerarquía)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentProcedureId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @ApiPropertyOptional({
    description: 'Resultado (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  outcomeConceptId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({ description: 'Sede de práctica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a care space.
   */
  @ApiPropertyOptional({ description: 'Espacio de atención', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /**
   * Valor de occurrence start at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de la ocurrencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  occurrenceStartAt?: string;

  /**
   * Valor de occurrence end at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fin de la ocurrencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  occurrenceEndAt?: string;

  /**
   * Identificador asociado a operative report file.
   */
  @ApiPropertyOptional({
    description: 'Reporte operatorio (common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  operativeReportFileId?: string;

  /**
   * Valor de follow up text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Seguimiento en texto libre' })
  @IsOptional()
  @IsString()
  followUpText?: string;
}

/** Respuesta tras registrar un procedimiento. */
export class ProcedureResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
