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
export const MASK_STRATEGIES = ['REDACT', 'HASH', 'PARTIAL', 'NULLIFY'] as const;
export type MaskStrategy = (typeof MASK_STRATEGIES)[number];

/** Una regla de enmascaramiento por (entity, column). */
export class FieldPermissionItemDto {
  @ApiProperty({ description: 'Entidad/tabla', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  entity!: string;

  @ApiProperty({ description: 'Columna', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  columnName!: string;

  @ApiProperty({ description: '¿Puede leerse el campo?' })
  @IsBoolean()
  canRead!: boolean;

  @ApiProperty({ description: '¿Puede escribirse el campo? (exige canRead)' })
  @IsBoolean()
  canWrite!: boolean;

  @ApiPropertyOptional({ description: 'Estrategia de enmascaramiento', enum: MASK_STRATEGIES })
  @IsOptional()
  @IsIn(MASK_STRATEGIES)
  maskStrategy?: MaskStrategy;

  @ApiPropertyOptional({ description: 'Condición ABAC (JSON)', type: Object })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;
}

/** Cuerpo de `PUT /authz/roles/{roleId}/field-permissions` (UC-06-08). */
export class SetFieldPermissionsDto {
  @ApiProperty({ description: 'Reglas de enmascaramiento a aplicar (upsert)', type: [FieldPermissionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldPermissionItemDto)
  fields!: FieldPermissionItemDto[];
}
