import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /clinical/conditions` (UC-08-08). */
export class CreateConditionDto {
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
    description: 'Código de la condición/diagnóstico (concept id)',
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
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({
    description: 'Severidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  /**
   * Identificador asociado a laterality concept.
   */
  @ApiPropertyOptional({
    description: 'Lateralidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  lateralityConceptId?: string;

  /**
   * Valor de onset at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de la condición',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  onsetAt?: string;
}

/** Respuesta tras registrar una condición. */
export class ConditionResponseDto {
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
   * Valor de clinical status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado clínico (concept id)',
    format: 'uuid',
    nullable: true,
  })
  clinicalStatus!: string | null;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado de verificación (concept id)',
    format: 'uuid',
    nullable: true,
  })
  verificationStatus!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
