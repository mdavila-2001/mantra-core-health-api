import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /forms/assignments` (UC-09-06). */
export class CreateAssignmentDto {
  @ApiProperty({ description: 'Campo a asignar', format: 'uuid' })
  @IsUUID()
  fieldId!: string;

  @ApiProperty({ description: 'Recurso destino (concept id)', format: 'uuid' })
  @IsUUID()
  targetResourceConceptId!: string;

  @ApiPropertyOptional({
    description: 'Sección destino; si se omite se aprovisiona una por defecto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({
    description: 'Perfil objetivo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  profileTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Tenant que crea la asignación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Branch destino', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: '¿Requerido?', default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '¿Visible?', default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ description: '¿Editable?', default: true })
  @IsOptional()
  @IsBoolean()
  editable?: boolean;

  @ApiPropertyOptional({ description: 'Orden de presentación' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}
