import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /clinical/immunizations` (UC-08-13). */
export class CreateImmunizationDto {
  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Vacuna (concept id)', format: 'uuid' })
  @IsUUID()
  vaccineConceptId!: string;

  @ApiPropertyOptional({ description: 'Número de dosis' })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumber?: number;

  @ApiPropertyOptional({ description: 'Número de lote' })
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Vía de administración (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  routeConceptId?: string;

  @ApiPropertyOptional({ description: 'Momento de administración', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @ApiPropertyOptional({ description: 'Profesional que administra', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  administeredByProfileId?: string;
}

/** Respuesta tras registrar una inmunización. */
export class ImmunizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  doseNumber!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
