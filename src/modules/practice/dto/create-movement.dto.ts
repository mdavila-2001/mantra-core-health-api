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
  @ApiProperty({
    description: 'Sentido del movimiento',
    enum: ['IN', 'OUT', 'ADJUST'],
  })
  @IsIn(['IN', 'OUT', 'ADJUST'])
  direction!: MovementDirection;

  @ApiProperty({ description: 'Cantidad (positiva)' })
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Tipo de recurso relacionado',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedResourceType?: string;

  @ApiPropertyOptional({
    description: 'Id del recurso relacionado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  relatedResourceId?: string;

  @ApiPropertyOptional({ description: 'Momento en que ocurrió (ISO datetime)' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
