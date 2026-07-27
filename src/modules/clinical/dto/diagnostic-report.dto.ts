import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /clinical/diagnostic-reports` (UC-08-06). */
export class CreateDiagnosticReportDto {
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

  @ApiPropertyOptional({
    description: 'Orden de servicio que origina el reporte',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @ApiPropertyOptional({ description: 'Encuentro asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiProperty({
    description: 'Código del estudio (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({
    description: 'Versión actual del reporte',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currentVersionId?: string;
}

/** Cuerpo de `POST /clinical/diagnostic-reports/{id}/release` (UC-08-07). */
export class ReleaseDiagnosticReportDto {
  @ApiPropertyOptional({
    description: 'row_version esperado (bloqueo optimista)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;
}

/** Respuesta de un reporte diagnóstico. */
export class DiagnosticReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({
    description: 'Estado de ciclo de vida (concept id)',
    format: 'uuid',
  })
  lifecycleStatus!: string;

  @ApiProperty({
    description: 'Estado de liberación de resultados (concept id)',
    format: 'uuid',
    nullable: true,
  })
  resultReleaseStatus!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceRequestId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
