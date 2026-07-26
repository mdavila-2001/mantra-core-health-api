import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /consent/patient-objections` (UC-07-03). */
export class CreatePatientObjectionDto {
  @ApiProperty({ description: 'Paciente titular (patient profile id)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Propósito de procesamiento objetado', format: 'uuid' })
  @IsUUID()
  processingPurposeId!: string;

  @ApiPropertyOptional({ description: 'Tipo de objeción (concept id); por defecto objeción a procesamiento' })
  @IsOptional()
  @IsUUID()
  objectionTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Motivo textual de la objeción' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reasonText?: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Si true, materializa de inmediato una restricción de privacidad (include UC-07-07)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  applyRestriction?: boolean;

  @ApiPropertyOptional({ description: 'Clase de datos de la restricción inmediata (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  restrictionDataClassConceptId?: string;
}
