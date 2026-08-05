import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Sentido del movimiento de inventario. */
export type MovementDirection = 'IN' | 'OUT' | 'ADJUST';

/** Cuerpo de `POST /inventory-items/{itemId}/movements` (UC-14-11). */
export class CreateMovementDto {
  /**
   * Valor de direction mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Sentido del movimiento',
    enum: ['IN', 'OUT', 'ADJUST'],
  })
  @IsIn(['IN', 'OUT', 'ADJUST'])
  direction!: MovementDirection;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad (positiva)' })
  @IsPositive()
  quantity!: number;

  /**
   * Valor de related resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de recurso relacionado',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedResourceType?: string;

  /**
   * Identificador asociado a related resource.
   */
  @ApiPropertyOptional({
    description: 'Id del recurso relacionado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  relatedResourceId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Momento en que ocurrió (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
