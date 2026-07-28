import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Un miembro a incorporar al equipo de cuidado (UC-18-01). */
export class CareTeamMemberInputDto {
  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional de salud' })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  /**
   * Identificador asociado a related person.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Persona relacionada (cuidador)',
  })
  @IsOptional()
  @IsUUID()
  relatedPersonId?: string;

  /**
   * Identificador asociado a member role concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Rol del miembro (concept id)' })
  @IsUUID()
  memberRoleConceptId!: string;

  /**
   * Valor de is responsible mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Marca al miembro como responsable del equipo',
  })
  @IsOptional()
  @IsBoolean()
  isResponsible?: boolean;
}

/** Cuerpo de `POST /care-teams` (UC-18-01). */
export class CreateCareTeamDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente del equipo' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid', description: 'Tenant custodio' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a episode.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Episodio de cuidado' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Categoría del equipo (concept id)',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  periodStart?: string;

  /**
   * Valor de members mantenido por la instancia.
   */
  @ApiProperty({
    type: [CareTeamMemberInputDto],
    description: 'Miembros iniciales del equipo',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CareTeamMemberInputDto)
  members!: CareTeamMemberInputDto[];
}

/** Miembro devuelto tras crear el equipo. */
export class CareTeamMemberResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a member role concept.
   */
  @ApiProperty({ format: 'uuid' })
  memberRoleConceptId!: string;

  /**
   * Valor de is responsible mantenido por la instancia.
   */
  @ApiProperty()
  isResponsible!: boolean;
}

/** Respuesta de creación de equipo de cuidado. */
export class CareTeamResponseDto {
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
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado del equipo (concept id)',
  })
  statusConceptId!: string;

  /**
   * Valor de members mantenido por la instancia.
   */
  @ApiProperty({ type: [CareTeamMemberResponseDto] })
  members!: CareTeamMemberResponseDto[];

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
