import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

const PURPOSES = ['TREATMENT', 'BILLING', 'OPERATIONS'] as const;
const RESOURCE_TYPES = [
  'CLINICAL_NOTE',
  'APPOINTMENT',
  'PRESCRIPTION',
] as const;

/**
 * Cuerpo de `POST /practitioner-delegates/{id}/grants` (UC-29-06). `validTo` es
 * obligatorio: todo grant delegado tiene alcance temporal acotado.
 */
export class CreateGrantDto {
  /**
   * Valor de purpose mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propósito de uso', enum: PURPOSES })
  @IsIn(PURPOSES)
  purpose!: (typeof PURPOSES)[number];

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fin de vigencia del grant (ISO, obligatorio)',
    format: 'date-time',
  })
  @IsDateString()
  validTo!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ description: 'Paciente objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Valor de resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number];
}
