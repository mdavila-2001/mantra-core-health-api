import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ============================================================================
    `GET /profiles/practitioners/me/summary` — el perfil profesional propio.

    ## Por qué existe

    El módulo tenía cuatro escrituras de fuerza laboral (alta, matrícula,
    verificación de credencial, especialidad) y **ninguna lectura**. Lo único
    que un profesional podía consultar de sí mismo era
    `GET /profiles/patients/me/summary`, que es de pacientes: a un médico le
    respondía 404 —no tiene perfil de paciente— o 403 si además no había
    verificado su identidad. En pantalla eso era un perfil que no funcionaba.

    Todo lo que este contrato devuelve ya estaba en la base desde el principio
    —biografía, especialidades, idiomas, credenciales, matrículas—: se escribía
    y no había forma de volver a leerlo.

    ## Alcance

    Es el perfil que la persona ve **de sí misma**: no admite consultar el de
    otra. El sujeto lo resuelve el servidor desde la sesión, así que no hay
    identificador que pasar y no hay forma de pedir el de otro profesional.

    Todos los `*ConceptId` viajan como uuid y los traduce quien los muestra,
    igual que en el resto del contrato: el backend no decide en qué idioma se
    lee un concepto.
    ========================================================================== */

/**
 * Una especialidad del profesional.
 *
 * Se devuelven las vigentes **y las pasadas**: un perfil profesional es una
 * trayectoria, y `validTo` es lo que distingue «ya no la ejerce» de «nunca la
 * tuvo». Sin ese dato, la lectura no puede decir ninguna de las dos cosas.
 */
export class PractitionerSpecialtyDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  specialtyConceptId!: string;

  /** Si es la especialidad con la que se presenta. Hay una sola vigente. */
  @ApiProperty()
  isPrimary!: boolean;

  /** Certificación del colegio o consejo. Es un dato que la gente busca. */
  @ApiProperty()
  boardCertified!: boolean;

  /** Alcance de práctica en palabras del propio profesional. */
  @ApiPropertyOptional()
  practiceScopeText?: string;

  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validFrom?: Date;

  /** Presente sólo si dejó de ejercerla. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date;
}

/**
 * Una credencial: título, posgrado o certificación.
 *
 * Es la **formación** del profesional. Se devuelven todas, incluidas las
 * vencidas y las que no llegaron a verificarse: una certificación que caducó
 * sigue siendo formación cursada, y esconderla dejaría huecos inexplicables en
 * la línea de tiempo. Su estado viaja para que la lectura los distinga.
 */
export class PractitionerCredentialDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  credentialTypeConceptId!: string;

  /** Nº de título o certificado. */
  @ApiProperty()
  number!: string;

  /** Dónde se cursó, en texto libre: la institución no siempre es un tenant. */
  @ApiPropertyOptional()
  issuingInstitutionText?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  issueDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  expiryDate?: Date;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Cuándo se comprobó la credencial contra su fuente. Ausente significa «no
   * verificada todavía», que no es lo mismo que «rechazada» —eso lo dice
   * `stateConceptId`—.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  verifiedAt?: Date;
}

/** Una matrícula: dónde está habilitado a ejercer y con qué número. */
export class PractitionerLicenseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  jurisdictionConceptId!: string;

  @ApiProperty()
  licenseNumber!: string;

  @ApiPropertyOptional()
  regulatoryAuthority?: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validFrom?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  validTo?: Date;
}

/**
 * Un idioma en el que atiende.
 *
 * `clinicalInterpretationAllowed` no es lo mismo que hablarlo: distingue
 * «se defiende» de «puede sostener una consulta clínica en ese idioma», que es
 * la pregunta real cuando se decide si hace falta intérprete.
 */
export class PractitionerLanguageDto {
  @ApiProperty({ format: 'uuid' })
  languageConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  proficiencyConceptId?: string;

  @ApiProperty()
  clinicalInterpretationAllowed!: boolean;
}

/**
 * Lo que el profesional lleva registrado en la plataforma.
 *
 * Son cuentas de **su** actividad, atribuidas por el usuario que las creó. No
 * son un ranking ni una métrica de desempeño, y por eso no incluyen nada
 * comparativo: sirven para que quien mira su perfil sepa qué dejó asentado.
 *
 * Se cuentan, no se listan: el detalle de cada encuentro o de cada receta vive
 * en el expediente de la persona atendida, con sus propios permisos, y sacarlo
 * de ahí para un perfil sería mover datos clínicos fuera de su control de
 * acceso.
 */
export class PractitionerActivityDto {
  /** Encuentros que abrió. */
  @ApiProperty()
  encounters!: number;

  /** Recetas que prescribió. */
  @ApiProperty()
  medicationRequests!: number;

  /** Notas clínicas que redactó. */
  @ApiProperty()
  clinicalNotes!: number;

  /** Documentos que publicó en expedientes. */
  @ApiProperty()
  documents!: number;
}

/** El perfil profesional completo que la persona ve de sí misma. */
export class PractitionerProfileSummaryDto {
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  @ApiProperty({ format: 'uuid' })
  personId!: string;

  @ApiProperty()
  practitionerCode!: string;

  @ApiPropertyOptional()
  displayName?: string;

  /** «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. */
  @ApiPropertyOptional()
  professionalTitle?: string;

  /** Presentación en prosa. Es lo que hace que un perfil se lea como una persona. */
  @ApiPropertyOptional()
  professionalBio?: string;

  /** Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. */
  @ApiPropertyOptional({ format: 'uuid' })
  photoFileId?: string;

  @ApiProperty({ format: 'uuid' })
  practitionerCategoryConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  practiceStatusConceptId!: string;

  /** Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. */
  @ApiProperty()
  acceptsNewPatients!: boolean;

  @ApiProperty()
  telehealthAvailable!: boolean;

  @ApiProperty({ type: [PractitionerSpecialtyDto] })
  specialties!: PractitionerSpecialtyDto[];

  @ApiProperty({ type: [PractitionerCredentialDto] })
  credentials!: PractitionerCredentialDto[];

  @ApiProperty({ type: [PractitionerLicenseDto] })
  licenses!: PractitionerLicenseDto[];

  @ApiProperty({ type: [PractitionerLanguageDto] })
  languages!: PractitionerLanguageDto[];

  @ApiProperty({ type: PractitionerActivityDto })
  activity!: PractitionerActivityDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
