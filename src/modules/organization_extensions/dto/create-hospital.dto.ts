import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /orgext/hospitals` (UC-22-01). */
export class CreateHospitalDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant (directory) al que pertenece el hospital',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({
    description: 'Practice que se especializa como hospital (1:1)',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a hospital type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de hospital (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  hospitalTypeConceptId?: string;

  /**
   * Identificador asociado a care level concept.
   */
  @ApiPropertyOptional({
    description: 'Nivel de atención (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  careLevelConceptId?: string;

  /**
   * Identificador asociado a ownership type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de propiedad (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ownershipTypeConceptId?: string;

  /**
   * Identificador asociado a teaching status concept.
   */
  @ApiPropertyOptional({
    description: 'Estado docente (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  teachingStatusConceptId?: string;

  /**
   * Identificador asociado a emergency capability concept.
   */
  @ApiPropertyOptional({
    description: 'Capacidad de emergencia (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  emergencyCapabilityConceptId?: string;

  /**
   * Valor de licensed bed capacity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Camas licenciadas', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  licensedBedCapacity?: number;

  /**
   * Valor de operational bed capacity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Camas operativas', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  operationalBedCapacity?: number;
}
