import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /profiles/patients` (UC-05-01): alta de persona + perfil de paciente. */
export class CreatePatientDto {
  /**
   * Valor de patient code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de paciente (patient_code, UK)',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  patientCode!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre visible de la persona' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (ISO 8601)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  /**
   * Identificador asociado a administrative gender concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de género administrativo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  administrativeGenderConceptId?: string;

  /**
   * Identificador asociado a sex at birth concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de sexo al nacer',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sexAtBirthConceptId?: string;

  /**
   * Valor de master patient index code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código MPI maestro (UK)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  masterPatientIndexCode?: string;
}

/** Respuesta de alta de paciente. */
export class PatientProfileResponseDto {
  /**
   * Identificador asociado a profile.
   */
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Valor de patient code mantenido por la instancia.
   */
  @ApiProperty()
  patientCode!: string;

  /**
   * Valor de record linkage status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de vinculación',
    format: 'uuid',
  })
  recordLinkageStatus!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Resumen que el propio paciente ve de sí mismo, una vez verificada su
 * identidad. No incluye datos clínicos: es el patrón de acceso, no la ficha.
 */
export class PatientSummaryResponseDto {
  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de patient code mantenido por la instancia.
   */
  @ApiProperty()
  patientCode!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional()
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional()
  birthDate?: Date;

  /**
   * Identificador asociado a person status concept.
   */
  @ApiProperty({ format: 'uuid' })
  personStatus!: string;
}
