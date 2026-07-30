import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';

/** Cuerpo de `POST /clinical/care-episodes` (UC-08-01). */
export class CreateCareEpisodeDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a responsible practitioner.
   */
  @ApiPropertyOptional({
    description: 'Profesional responsable',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  responsiblePractitionerId?: string;

  /**
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de episodio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio del episodio',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;
}

/** Respuesta tras abrir un episodio. */
export class CareEpisodeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado del episodio (concept id)',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
