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
  @ApiProperty({ description: 'Propósito de uso', enum: PURPOSES })
  @IsIn(PURPOSES)
  purpose!: (typeof PURPOSES)[number];

  @ApiProperty({
    description: 'Fin de vigencia del grant (ISO, obligatorio)',
    format: 'date-time',
  })
  @IsDateString()
  validTo!: string;

  @ApiPropertyOptional({
    description: 'Inicio de vigencia (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Paciente objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ description: 'Encuentro objetivo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ description: 'Tipo de recurso', enum: RESOURCE_TYPES })
  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number];
}
