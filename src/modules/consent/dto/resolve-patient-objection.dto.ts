import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

/** Resolución de una objeción: se mantiene (upheld) o se rechaza (rejected). */
export enum ObjectionResolution {
  UPHELD = 'UPHELD',
  REJECTED = 'REJECTED',
}

/** Cuerpo de `POST /consent/patient-objections/{id}/resolve` (UC-07-12). */
export class ResolvePatientObjectionDto {
  /**
   * Valor de resolution mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado de la resolución',
    enum: ObjectionResolution,
  })
  @IsEnum(ObjectionResolution)
  resolution!: ObjectionResolution;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    description: 'Motivo de la resolución (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}
