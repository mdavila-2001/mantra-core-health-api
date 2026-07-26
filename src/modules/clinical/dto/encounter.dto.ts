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
  @ApiProperty({ description: 'Profesional participante', format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  @ApiPropertyOptional({ description: 'Rol del participante (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  roleConceptId?: string;

  @ApiPropertyOptional({ description: 'Marca al participante como responsable' })
  @IsOptional()
  @IsBoolean()
  isResponsible?: boolean;
}

/** Ubicación física del encuentro. */
export class EncounterLocationInput {
  @ApiProperty({ description: 'Sede de práctica (practice.practice_sites)', format: 'uuid' })
  @IsUUID()
  practiceSiteId!: string;

  @ApiPropertyOptional({ description: 'Unidad clínica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Espacio de atención (cama/consultorio)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;
}

/** Cuerpo de `POST /clinical/encounters/check-in` (UC-08-02). */
export class CheckInEncounterDto {
  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ description: 'Episodio de cuidado asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @ApiPropertyOptional({ description: 'Sucursal (directory.branches)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Profesional principal', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryPractitionerId?: string;

  @ApiPropertyOptional({ description: 'Cita que origina el check-in', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Clase del encuentro (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classConceptId?: string;

  @ApiPropertyOptional({ description: 'Tipo del encuentro (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  @ApiPropertyOptional({ description: 'Motivo de consulta' })
  @IsOptional()
  @IsString()
  reasonText?: string;

  @ApiPropertyOptional({ type: [EncounterParticipantInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EncounterParticipantInput)
  participants?: EncounterParticipantInput[];

  @ApiPropertyOptional({ type: EncounterLocationInput })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncounterLocationInput)
  location?: EncounterLocationInput;
}

/** Cuerpo de `POST /clinical/encounters/{id}/close` (UC-08-14). */
export class CloseEncounterDto {
  @ApiPropertyOptional({ description: 'row_version esperado (bloqueo optimista)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;
}

/** Respuesta tras un check-in de encuentro. */
export class EncounterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  episodeId!: string | null;

  @ApiProperty({ description: 'Estado del encuentro (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: [String], description: 'Ids de participantes creados' })
  participantIds!: string[];

  @ApiProperty({ type: [String], description: 'Ids de ubicaciones creadas' })
  locationIds!: string[];

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
