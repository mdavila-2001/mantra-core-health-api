import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /orgext/hospitals` (UC-22-01). */
export class CreateHospitalDto {
  @ApiProperty({ description: 'Tenant (directory) al que pertenece el hospital', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Practice que se especializa como hospital (1:1)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({ description: 'Tipo de hospital (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hospitalTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Nivel de atención (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careLevelConceptId?: string;

  @ApiPropertyOptional({ description: 'Tipo de propiedad (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownershipTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Estado docente (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teachingStatusConceptId?: string;

  @ApiPropertyOptional({ description: 'Capacidad de emergencia (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  emergencyCapabilityConceptId?: string;

  @ApiPropertyOptional({ description: 'Camas licenciadas', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  licensedBedCapacity?: number;

  @ApiPropertyOptional({ description: 'Camas operativas', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  operationalBedCapacity?: number;
}
