import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PermissionSetItemDto } from './permission-set-item.dto';

const DELEGATE_TYPES = ['SECRETARY', 'ASSISTANT', 'NURSE', 'BILLING'] as const;

/** Cuerpo de `POST /delegated-permission-sets` (UC-29-02). */
export class CreatePermissionSetDto {
  @ApiProperty({ description: 'Tenant propietario del set', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código único del set por tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre legible del set', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Tipo de delegado',
    enum: DELEGATE_TYPES,
  })
  @IsOptional()
  @IsIn(DELEGATE_TYPES)
  delegateType?: (typeof DELEGATE_TYPES)[number];

  @ApiPropertyOptional({ description: 'Descripción del set' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Ítems de permiso de la versión 1',
    type: [PermissionSetItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PermissionSetItemDto)
  items!: PermissionSetItemDto[];
}
