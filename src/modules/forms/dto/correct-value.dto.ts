import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  TECHNICAL_DATA_TYPES,
  type TechnicalDataType,
} from './create-field-definition.dto';

/** Cuerpo de `PATCH /forms/values/{id}` (UC-09-09) — corrección con supersede. */
export class CorrectValueDto {
  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({
    enum: TECHNICAL_DATA_TYPES,
    description: 'Tipo de dato del valor corregido',
  })
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType!: TechnicalDataType;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nuevo valor tipado' })
  @Allow()
  value!: unknown;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    description: 'Motivo de la corrección (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}
