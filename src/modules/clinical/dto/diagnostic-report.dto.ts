import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /clinical/diagnostic-reports` (UC-08-06). */
export class CreateDiagnosticReportDto {
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
   * Identificador asociado a service request.
   */
  @ApiPropertyOptional({
    description: 'Orden de servicio que origina el reporte',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    description: 'Código del estudio (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

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
   * Identificador asociado a current version.
   */
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
  /**
   * Valor de expected row version mantenido por la instancia.
   */
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
   * Valor de lifecycle status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado de ciclo de vida (concept id)',
    format: 'uuid',
  })
  lifecycleStatus!: string;

  /**
   * Valor de result release status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado de liberación de resultados (concept id)',
    format: 'uuid',
    nullable: true,
  })
  resultReleaseStatus!: string | null;

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
