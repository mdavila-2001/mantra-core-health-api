import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Pacientes de cabecera por página, si no se pide otra cosa. */
export const PRIMARY_PATIENTS_DEFAULT_LIMIT = 50;

/** Tope de pacientes de cabecera por página. */
export const PRIMARY_PATIENTS_MAX_LIMIT = 200;

/** Cuerpo de `PUT /profiles/patients/me/primary-practitioner`. */
export class SetPrimaryPractitionerDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Perfil profesional que el paciente elige como médico de cabecera',
  })
  @IsUUID()
  practitionerProfileId!: string;
}

/** El médico de cabecera vigente del paciente. */
export class PrimaryPractitionerDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Con este id se abre su ficha en la guía',
  })
  practitionerProfileId!: string;

  @ApiPropertyOptional({ description: 'Nombre visible del profesional' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Título profesional declarado' })
  professionalTitle?: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Desde cuándo es su médico de cabecera',
  })
  since!: Date;
}

/**
 * Respuesta de las rutas del médico de cabecera del paciente.
 *
 * `current` es `null` cuando no eligió a nadie (o lo quitó): es un estado
 * real, no un error, y por eso no responde 404.
 */
export class OwnPrimaryPractitionerDto {
  @ApiPropertyOptional({ type: PrimaryPractitionerDto, nullable: true })
  current!: PrimaryPractitionerDto | null;
}

/** Query de `GET /profiles/practitioners/me/primary-patients`. */
export class ListPrimaryPatientsQueryDto {
  @ApiPropertyOptional({
    default: PRIMARY_PATIENTS_DEFAULT_LIMIT,
    maximum: PRIMARY_PATIENTS_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PRIMARY_PATIENTS_MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Un paciente que eligió al profesional como médico de cabecera. */
export class PrimaryPatientDto {
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Nombre visible del paciente' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Código de paciente' })
  patientCode?: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Desde cuándo lo tiene como médico de cabecera',
  })
  since!: Date;
}

/** Página de pacientes de cabecera del profesional de la sesión. */
export class PrimaryPatientsPageDto {
  @ApiProperty({ type: PrimaryPatientDto, isArray: true })
  items!: PrimaryPatientDto[];

  @ApiProperty({ description: 'Pacientes de cabecera vigentes, en total' })
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
