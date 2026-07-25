import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';

/** Cuerpo de `POST /clinical/care-episodes` (UC-08-01). */
export class CreateCareEpisodeDto {
  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ description: 'Profesional responsable', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  responsiblePractitionerId?: string;

  @ApiPropertyOptional({ description: 'Tipo de episodio (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  @ApiPropertyOptional({ description: 'Inicio del episodio', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startAt?: string;
}

/** Respuesta tras abrir un episodio. */
export class CareEpisodeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ description: 'Estado del episodio (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
