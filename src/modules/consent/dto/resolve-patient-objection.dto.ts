import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Resolución de una objeción: se mantiene (upheld) o se rechaza (rejected). */
export type ObjectionResolution = 'UPHELD' | 'REJECTED';

/** Cuerpo de `POST /consent/patient-objections/{id}/resolve` (UC-07-12). */
export class ResolvePatientObjectionDto {
  @ApiProperty({ description: 'Resultado de la resolución', enum: ['UPHELD', 'REJECTED'] })
  @IsIn(['UPHELD', 'REJECTED'])
  resolution!: ObjectionResolution;

  @ApiPropertyOptional({ description: 'Motivo de la resolución (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}
