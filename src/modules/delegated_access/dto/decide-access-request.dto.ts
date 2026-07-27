import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

const DECISIONS = ['APPROVED', 'DENIED'] as const;
const PURPOSES = ['TREATMENT', 'BILLING', 'OPERATIONS'] as const;
const RESOURCE_TYPES = [
  'CLINICAL_NOTE',
  'APPOINTMENT',
  'PRESCRIPTION',
] as const;

/**
 * Cuerpo de `POST /access-requests/{id}/decision` (UC-29-05). Si `APPROVED` se
 * emite un grant scoped; los campos de grant (purpose/resource/valid_to) lo acotan.
 */
export class DecideAccessRequestDto {
  @ApiProperty({ description: 'Decisión del aprobador', enum: DECISIONS })
  @IsIn(DECISIONS)
  decision!: (typeof DECISIONS)[number];

  @ApiPropertyOptional({
    description: 'Propósito de uso del grant emitido',
    enum: PURPOSES,
  })
  @IsOptional()
  @IsIn(PURPOSES)
  purpose?: (typeof PURPOSES)[number];

  @ApiPropertyOptional({
    description: 'Tipo de recurso del grant',
    enum: RESOURCE_TYPES,
  })
  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  resourceType?: (typeof RESOURCE_TYPES)[number];

  @ApiPropertyOptional({
    description: 'Fin de vigencia del grant (ISO)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Encuentro del grant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;
}
