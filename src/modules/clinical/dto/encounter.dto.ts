import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Participante de un encuentro (profesional + rol). */
export class EncounterParticipantInput {
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiProperty({ description: 'Profesional participante', format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  /**
   * Identificador asociado a role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del participante (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  roleConceptId?: string;

  /**
   * Valor de is responsible mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Marca al participante como responsable',
  })
  @IsOptional()
  @IsBoolean()
  isResponsible?: boolean;
}

/** Ubicación física del encuentro. */
export class EncounterLocationInput {
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty({
    description: 'Sede de práctica (practice.practice_sites)',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @ApiPropertyOptional({ description: 'Unidad clínica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Identificador asociado a care space.
   */
  @ApiPropertyOptional({
    description: 'Espacio de atención (cama/consultorio)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;
}

/** Cuerpo de `POST /clinical/encounters/check-in` (UC-08-02). */
export class CheckInEncounterDto {
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
   * Identificador asociado a episode.
   */
  @ApiPropertyOptional({
    description: 'Episodio de cuidado asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({
    description: 'Sucursal (directory.branches)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Identificador asociado a primary practitioner.
   */
  @ApiPropertyOptional({ description: 'Profesional principal', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryPractitionerId?: string;

  /**
   * Identificador asociado a appointment.
   */
  @ApiPropertyOptional({
    description: 'Cita que origina el check-in',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  /**
   * Identificador asociado a class concept.
   */
  @ApiPropertyOptional({
    description: 'Clase del encuentro (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  classConceptId?: string;

  /**
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo del encuentro (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de consulta' })
  @IsOptional()
  @IsString()
  reasonText?: string;

  /**
   * Valor de participants mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [EncounterParticipantInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EncounterParticipantInput)
  participants?: EncounterParticipantInput[];

  /**
   * Valor de location mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: EncounterLocationInput })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncounterLocationInput)
  location?: EncounterLocationInput;
}

/** Cuerpo de `POST /clinical/encounters/{id}/close` (UC-08-14). */
export class CloseEncounterDto {
  /**
   * Valor de expected row version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'row_version esperado (bloqueo optimista)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;
}

/** Respuesta tras un check-in de encuentro. */
export class EncounterResponseDto {
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
   * Identificador asociado a episode.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  episodeId!: string | null;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado del encuentro (concept id)',
    format: 'uuid',
  })
  status!: string;

  /**
   * Valor de participant ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de participantes creados' })
  participantIds!: string[];

  /**
   * Valor de location ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de ubicaciones creadas' })
  locationIds!: string[];

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endAt!: Date | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * Sello SHA-256 del contenido del encuentro, calculado al cerrarlo.
   * `null` mientras el encuentro sigue en curso.
   */
  @ApiProperty({ type: String, nullable: true })
  contentHash!: string | null;

  /**
   * Fecha y hora en que se calculó el sello del encuentro.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  sealedAt!: Date | null;
}
