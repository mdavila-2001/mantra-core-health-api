import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /forms/fields/{id}/access-rules` (UC-09-12). */
export class CreateAccessRuleDto {
  @ApiProperty({
    description: 'Value set de propósitos de uso permitidos',
    format: 'uuid',
  })
  @IsUUID()
  purposeOfUseValueSetId!: string;

  @ApiPropertyOptional({
    description: 'Asignación concreta afectada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({
    description: 'Value set de roles de lectura',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  readRoleValueSetId?: string;

  @ApiPropertyOptional({
    description: 'Value set de roles de escritura',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  writeRoleValueSetId?: string;

  @ApiPropertyOptional({
    description: 'Categoría de consentimiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  consentCategoryConceptId?: string;

  @ApiPropertyOptional({
    enum: ['NONE', 'REDACT', 'HASH'],
    description: 'Estrategia de enmascarado',
  })
  @IsOptional()
  @IsIn(['NONE', 'REDACT', 'HASH'])
  maskStrategy?: 'NONE' | 'REDACT' | 'HASH';

  @ApiPropertyOptional({ description: '¿Permite acceso break-glass?' })
  @IsOptional()
  @IsBoolean()
  breakGlassAllowed?: boolean;
}
