import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

/** Cuerpo de `POST /clinical/procedures` (UC-08-12). */
export class CreateProcedureDto {
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({
    description: 'Código del procedimiento (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({
    description: 'Profesional ejecutante',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  performerProfileId?: string;

  @ApiPropertyOptional({
    description: 'Orden de servicio que lo origina',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @ApiPropertyOptional({
    description: 'Procedimiento padre (jerarquía)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentProcedureId?: string;

  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({
    description: 'Resultado (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  outcomeConceptId?: string;

  @ApiPropertyOptional({ description: 'Sede de práctica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({ description: 'Espacio de atención', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  @ApiPropertyOptional({
    description: 'Inicio de la ocurrencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  occurrenceStartAt?: string;

  @ApiPropertyOptional({
    description: 'Fin de la ocurrencia',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  occurrenceEndAt?: string;

  @ApiPropertyOptional({
    description: 'Reporte operatorio (common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  operativeReportFileId?: string;

  @ApiPropertyOptional({ description: 'Seguimiento en texto libre' })
  @IsOptional()
  @IsString()
  followUpText?: string;
}

/** Respuesta tras registrar un procedimiento. */
export class ProcedureResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
