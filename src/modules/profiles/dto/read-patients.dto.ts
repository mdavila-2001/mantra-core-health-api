import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fila del listado de pacientes (UC-05-13).
 *
 * Trae lo justo para pintar una tabla y decidir a cuál entrar; la ficha
 * completa es {@link PatientDetailResponseDto}. Los `*ConceptId` viajan como
 * uuid, igual que en el resto del contrato: se traducen a etiqueta con
 * `GET /terminology/concepts?ids=…`.
 */
export class PatientListItemDto {
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
  @ApiProperty({ description: 'Código único de paciente' })
  patientCode!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre visible de la persona' })
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  birthDate?: Date;

  /**
   * Identificador asociado a person status concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del estado de la persona',
    format: 'uuid',
  })
  personStatusConceptId?: string;

  /**
   * Valor de deceased mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Si la persona está registrada como fallecida. Es un booleano derivado y no un concepto: una lista de pacientes tiene que poder marcarlo sin resolver terminología',
  })
  deceased!: boolean;
}

/** Página del listado de pacientes. */
export class SearchPatientsResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [PatientListItemDto] })
  items!: PatientListItemDto[];

  /**
   * Número de elementos devueltos.
   */
  @ApiProperty({ description: 'Cantidad devuelta en esta página' })
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope de resultados aplicado' })
  limit!: number;

  /**
   * Cursor de continuación.
   */
  @ApiPropertyOptional({
    description:
      'Cursor opaco para la página siguiente; `null` cuando no hay más',
    nullable: true,
  })
  nextCursor!: string | null;
}

/** Persona relacionada / contacto, tal como la muestra la ficha. */
export class RelatedPersonItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional()
  displayName?: string;

  /**
   * Identificador asociado a relationship concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  relationshipConceptId?: string;

  /**
   * Valor de is emergency contact mantenido por la instancia.
   */
  @ApiProperty()
  isEmergencyContact!: boolean;

  /**
   * Valor de is legal guardian mantenido por la instancia.
   */
  @ApiProperty()
  isLegalGuardian!: boolean;
}

/**
 * Ficha de filiación del paciente (F-01): lo que la pantalla de filiación
 * necesita para pintarse y para reabrirse en modo edición.
 *
 * **No incluye datos clínicos.** Condiciones, alergias y medicación se leen de
 * `GET /clinical/patients/:patientProfileId/summary`, y las notas del
 * expediente de `GET /charts/patients/:patientProfileId/summary`. La separación
 * es deliberada: la filiación la administra el personal administrativo y el
 * expediente el clínico, y son roles distintos.
 */
export class PatientDetailResponseDto {
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
   * Valor de master patient index code mantenido por la instancia.
   */
  @ApiPropertyOptional()
  masterPatientIndexCode?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional()
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  birthDate?: Date;

  /**
   * Identificador asociado a administrative gender concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  administrativeGenderConceptId?: string;

  /**
   * Identificador asociado a sex at birth concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  sexAtBirthConceptId?: string;

  /**
   * Identificador asociado a gender identity concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  genderIdentityConceptId?: string;

  /**
   * Identificador asociado a nationality concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  nationalityConceptId?: string;

  /**
   * Identificador asociado a preferred language concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  preferredLanguageConceptId?: string;

  /**
   * Identificador asociado a person status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  personStatusConceptId?: string;

  /**
   * Identificador asociado a vital status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  vitalStatusConceptId?: string;

  /**
   * Valor de deceased at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deceasedAt?: Date;

  /**
   * Identificador asociado a abo group concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  aboGroupConceptId?: string;

  /**
   * Identificador asociado a rh factor concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  rhFactorConceptId?: string;

  /**
   * Identificador asociado a insurance status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  insuranceStatusConceptId?: string;

  /**
   * Identificador asociado a clinical language concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  clinicalLanguageConceptId?: string;

  /**
   * Identificador asociado a record linkage status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  recordLinkageStatusConceptId?: string;

  /**
   * Valor de related persons mantenido por la instancia.
   */
  @ApiProperty({
    type: [RelatedPersonItemDto],
    description: 'Contactos y representantes registrados (UC-05-10)',
  })
  relatedPersons!: RelatedPersonItemDto[];

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
