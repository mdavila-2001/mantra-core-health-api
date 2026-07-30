import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /consent/patient-objections` (UC-07-03). */
export class CreatePatientObjectionDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente titular (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a processing purpose.
   */
  @ApiProperty({
    description: 'Propósito de procesamiento objetado',
    format: 'uuid',
  })
  @IsUUID()
  processingPurposeId!: string;

  /**
   * Identificador asociado a objection type concept.
   */
  @ApiPropertyOptional({
    description:
      'Tipo de objeción (concept id); por defecto objeción a procesamiento',
  })
  @IsOptional()
  @IsUUID()
  objectionTypeConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo textual de la objeción' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reasonText?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de apply restriction mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Si true, materializa de inmediato una restricción de privacidad (include UC-07-07)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  applyRestriction?: boolean;

  /**
   * Identificador asociado a restriction data class concept.
   */
  @ApiPropertyOptional({
    description: 'Clase de datos de la restricción inmediata (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  restrictionDataClassConceptId?: string;
}
