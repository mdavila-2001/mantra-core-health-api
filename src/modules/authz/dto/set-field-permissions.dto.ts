import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Estrategia de enmascaramiento de un campo. */
export const MASK_STRATEGIES = [
  'REDACT',
  'HASH',
  'PARTIAL',
  'NULLIFY',
] as const;
/**
 * Define el tipo de dominio mask strategy.
 */
export type MaskStrategy = (typeof MASK_STRATEGIES)[number];

/** Una regla de enmascaramiento por (entity, column). */
export class FieldPermissionItemDto {
  /**
   * Valor de entity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidad/tabla', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  entity!: string;

  /**
   * Valor de column name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Columna', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  columnName!: string;

  /**
   * Valor de can read mantenido por la instancia.
   */
  @ApiProperty({ description: '¿Puede leerse el campo?' })
  @IsBoolean()
  canRead!: boolean;

  /**
   * Valor de can write mantenido por la instancia.
   */
  @ApiProperty({ description: '¿Puede escribirse el campo? (exige canRead)' })
  @IsBoolean()
  canWrite!: boolean;

  /**
   * Valor de mask strategy mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Estrategia de enmascaramiento',
    enum: MASK_STRATEGIES,
  })
  @IsOptional()
  @IsIn(MASK_STRATEGIES)
  maskStrategy?: MaskStrategy;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Condición ABAC (JSON)', type: Object })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;
}

/** Cuerpo de `PUT /authz/roles/{roleId}/field-permissions` (UC-06-08). */
export class SetFieldPermissionsDto {
  /**
   * Valor de fields mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Reglas de enmascaramiento a aplicar (upsert)',
    type: [FieldPermissionItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldPermissionItemDto)
  fields!: FieldPermissionItemDto[];
}
