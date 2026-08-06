import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope de una página de búsqueda de pacientes. */
export const PATIENT_SEARCH_MAX_LIMIT = 100;

/** Query de `GET /profiles/patients`. */
export class SearchPatientsQueryDto {
  /**
   * Texto libre sobre el nombre visible de la persona.
   */
  @ApiPropertyOptional({
    description: 'Búsqueda parcial, sin distinguir mayúsculas, sobre el nombre',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  /**
   * Código de paciente exacto.
   */
  @ApiPropertyOptional({ description: 'Código de paciente exacto' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientCode?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 25, maximum: PATIENT_SEARCH_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PATIENT_SEARCH_MAX_LIMIT)
  limit?: number;

  /**
   * Desplazamiento de la página.
   */
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Un paciente en el resultado de búsqueda. */
export class PatientSearchItemDto {
  /**
   * Identificador del perfil de paciente, que es también el de la persona.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Código de paciente.
   */
  @ApiProperty()
  patientCode!: string;

  /**
   * Nombre visible.
   */
  @ApiPropertyOptional({ nullable: true })
  displayName!: string | null;

  /**
   * Fecha de nacimiento.
   */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  birthDate!: string | null;

  /**
   * Identificador asociado a person status concept.
   */
  @ApiProperty({ format: 'uuid' })
  personStatusConceptId!: string;
}

/** Respuesta de `GET /profiles/patients`. */
export class SearchPatientsResponseDto {
  /**
   * Pacientes de esta página.
   */
  @ApiProperty({ type: [PatientSearchItemDto] })
  items!: PatientSearchItemDto[];

  /**
   * Cantidad devuelta.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Desplazamiento aplicado.
   */
  @ApiProperty()
  offset!: number;
}

/** Un vínculo del paciente con su identidad en un sistema externo. */
export class PatientIdentityLinkDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a source tenant.
   */
  @ApiProperty({ format: 'uuid' })
  sourceTenantId!: string;

  /**
   * Identificador del paciente en el sistema de origen.
   */
  @ApiProperty()
  sourcePatientIdentifier!: string;

  /**
   * URI del sistema de origen.
   */
  @ApiPropertyOptional({ nullable: true })
  sourceSystemUri!: string | null;

  /**
   * Identificador asociado a verification status concept.
   */
  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;
}

/** Una persona relacionada con el paciente. */
export class PatientRelatedPersonDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Nombre visible de la persona relacionada.
   */
  @ApiPropertyOptional({ nullable: true })
  displayName!: string | null;

  /**
   * Identificador asociado a relationship concept.
   */
  @ApiProperty({ format: 'uuid' })
  relationshipConceptId!: string;

  /**
   * Si es contacto de emergencia.
   */
  @ApiProperty()
  isEmergencyContact!: boolean;

  /**
   * Si ejerce la representación legal.
   */
  @ApiProperty()
  isLegalGuardian!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/**
 * Filiación completa del paciente: `GET /profiles/patients/{profileId}`.
 *
 * Es la lectura que sostiene la pantalla F-01. Trae los contactos de emergencia
 * y la representación legal junto al resto porque son datos de seguridad
 * clínica: quien atiende necesita verlos sin encadenar otra petición.
 */
export class PatientFiliationResponseDto {
  /**
   * Identificador del perfil de paciente.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Código de paciente.
   */
  @ApiProperty()
  patientCode!: string;

  /**
   * Código del índice maestro de pacientes.
   */
  @ApiPropertyOptional({ nullable: true })
  masterPatientIndexCode!: string | null;

  /**
   * Nombre visible.
   */
  @ApiPropertyOptional({ nullable: true })
  displayName!: string | null;

  /**
   * Fecha de nacimiento.
   */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  birthDate!: string | null;

  /**
   * Identificador asociado a administrative gender concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  administrativeGenderConceptId!: string | null;

  /**
   * Identificador asociado a sex at birth concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sexAtBirthConceptId!: string | null;

  /**
   * Identificador asociado a gender identity concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  genderIdentityConceptId!: string | null;

  /**
   * Identificador asociado a nationality concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  nationalityConceptId!: string | null;

  /**
   * Identificador asociado a preferred language concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  preferredLanguageConceptId!: string | null;

  /**
   * Identificador asociado a person status concept.
   */
  @ApiProperty({ format: 'uuid' })
  personStatusConceptId!: string;

  /**
   * Identificador asociado a vital status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  vitalStatusConceptId!: string | null;

  /**
   * Instante de defunción, si consta.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  deceasedAt!: string | null;

  /**
   * Identificador asociado a abo group concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  aboGroupConceptId!: string | null;

  /**
   * Identificador asociado a rh factor concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  rhFactorConceptId!: string | null;

  /**
   * Identificador asociado a insurance status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  insuranceStatusConceptId!: string | null;

  /**
   * Identificador asociado a clinical language concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clinicalLanguageConceptId!: string | null;

  /**
   * Identificador asociado a record linkage status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recordLinkageStatusConceptId!: string | null;

  /**
   * Vínculos con identidades de sistemas externos.
   */
  @ApiProperty({ type: [PatientIdentityLinkDto] })
  identityLinks!: PatientIdentityLinkDto[];

  /**
   * Contactos y representantes registrados.
   */
  @ApiProperty({ type: [PatientRelatedPersonDto] })
  relatedPersons!: PatientRelatedPersonDto[];

  /**
   * Instante de creación del perfil.
   */
  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/** Query de `GET /profiles/patients/{profileId}`. */
export class ReadPatientParamDto {
  /**
   * Identificador del perfil de paciente.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  profileId!: string;
}
