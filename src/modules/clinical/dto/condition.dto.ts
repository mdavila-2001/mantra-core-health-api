import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /clinical/conditions` (UC-08-08). */
export class CreateConditionDto {
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
    description: 'Código de la condición/diagnóstico (concept id)',
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
    description: 'Severidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  @ApiPropertyOptional({
    description: 'Lateralidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  lateralityConceptId?: string;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({
    description: 'Estado clínico (concept id)',
    format: 'uuid',
    nullable: true,
  })
  clinicalStatus!: string | null;

  @ApiProperty({
    description: 'Estado de verificación (concept id)',
    format: 'uuid',
    nullable: true,
  })
  verificationStatus!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
