import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /forms/fields/{id}/access-rules` (UC-09-12). */
export class CreateAccessRuleDto {
  /**
   * Identificador asociado a purpose of use value set.
   */
  @ApiProperty({
    description: 'Value set de propósitos de uso permitidos',
    format: 'uuid',
  })
  @IsUUID()
  purposeOfUseValueSetId!: string;

  /**
   * Identificador asociado a assignment.
   */
  @ApiPropertyOptional({
    description: 'Asignación concreta afectada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  /**
   * Identificador asociado a read role value set.
   */
  @ApiPropertyOptional({
    description: 'Value set de roles de lectura',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  readRoleValueSetId?: string;

  /**
   * Identificador asociado a write role value set.
   */
  @ApiPropertyOptional({
    description: 'Value set de roles de escritura',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  writeRoleValueSetId?: string;

  /**
   * Identificador asociado a consent category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría de consentimiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  consentCategoryConceptId?: string;

  /**
   * Valor de mask strategy mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: ['NONE', 'REDACT', 'HASH'],
    description: 'Estrategia de enmascarado',
  })
  @IsOptional()
  @IsIn(['NONE', 'REDACT', 'HASH'])
  maskStrategy?: 'NONE' | 'REDACT' | 'HASH';

  /**
   * Valor de break glass allowed mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Permite acceso break-glass?' })
  @IsOptional()
  @IsBoolean()
  breakGlassAllowed?: boolean;
}
