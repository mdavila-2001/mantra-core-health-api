import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Parámetros de `GET /org/assignment-targets`. */
export class AssignmentTargetsQueryDto {
  /** Qué nodo se lista. */
  @ApiProperty({ enum: ['practice', 'site', 'unit', 'space'] })
  @IsIn(['practice', 'site', 'unit', 'space'])
  kind!: 'practice' | 'site' | 'unit' | 'space';

  /** Sede (obligatoria para unidades y espacios). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  /** Unidad que acota los espacios. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  /** Texto a buscar en código o nombre. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  /** Tope de filas (50 por omisión, 200 máximo). */
  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
