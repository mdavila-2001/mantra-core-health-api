import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /forms/assignments` (UC-09-06). */
export class CreateAssignmentDto {
  /**
   * Identificador asociado a field.
   */
  @ApiProperty({ description: 'Campo a asignar', format: 'uuid' })
  @IsUUID()
  fieldId!: string;

  /**
   * Identificador asociado a target resource concept.
   */
  @ApiProperty({ description: 'Recurso destino (concept id)', format: 'uuid' })
  @IsUUID()
  targetResourceConceptId!: string;

  /**
   * Identificador asociado a section.
   */
  @ApiPropertyOptional({
    description: 'Sección destino; si se omite se aprovisiona una por defecto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  /**
   * Identificador asociado a profile type concept.
   */
  @ApiPropertyOptional({
    description: 'Perfil objetivo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  profileTypeConceptId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant que crea la asignación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({ description: 'Branch destino', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Requerido?', default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Valor de visible mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Visible?', default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  /**
   * Valor de editable mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Editable?', default: true })
  @IsOptional()
  @IsBoolean()
  editable?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden de presentación' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}
