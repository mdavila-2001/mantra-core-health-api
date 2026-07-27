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
  @ApiPropertyOptional({ format: 'uuid', description: 'Profesional de salud' })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Persona relacionada (cuidador)',
  })
  @IsOptional()
  @IsUUID()
  relatedPersonId?: string;

  @ApiProperty({ format: 'uuid', description: 'Rol del miembro (concept id)' })
  @IsUUID()
  memberRoleConceptId!: string;

  @ApiPropertyOptional({
    description: 'Marca al miembro como responsable del equipo',
  })
  @IsOptional()
  @IsBoolean()
  isResponsible?: boolean;
}

/** Cuerpo de `POST /care-teams` (UC-18-01). */
export class CreateCareTeamDto {
  @ApiProperty({ format: 'uuid', description: 'Paciente del equipo' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Tenant custodio' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Episodio de cuidado' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Categoría del equipo (concept id)',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  periodStart?: string;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  memberRoleConceptId!: string;

  @ApiProperty()
  isResponsible!: boolean;
}

/** Respuesta de creación de equipo de cuidado. */
export class CareTeamResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado del equipo (concept id)',
  })
  statusConceptId!: string;

  @ApiProperty({ type: [CareTeamMemberResponseDto] })
  members!: CareTeamMemberResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
