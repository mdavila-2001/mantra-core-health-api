import type { CoverageValidity } from '../patient-coverage-validity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { BIRTH_SEX_CODES, type BirthSexCode } from '../profiles.concepts';

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

/**
 * Filtros de `GET /profiles/patients` (UC-05-13).
 *
 * `nationalId` e `issuerAdministrativeAreaConceptId` son el camino nuevo de la
 * TAREA-07: encontrar a alguien por su documento aunque su nombre y su código
 * de paciente no contengan el texto buscado. El departamento sólo tiene efecto
 * junto al documento — un carnet sin departamento no es único en Bolivia.
 */
export class SearchPatientsQueryDto {
  /** Texto a buscar en el código de paciente o el nombre. */
  @ApiPropertyOptional({
    description: 'Texto a buscar en el código de paciente o el nombre',
  })
  @IsOptional()
  q?: string;

  /** Documento de identidad exacto. */
  @ApiPropertyOptional({
    description: 'Documento de identidad exacto (`common.identifiers.value`)',
  })
  @IsOptional()
  nationalId?: string;

  /** Departamento que expidió el documento (`VS_BO_DEPARTMENT`). */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Departamento que expidió el documento; sólo tiene efecto junto a nationalId',
  })
  @IsOptional()
  @IsUUID()
  issuerAdministrativeAreaConceptId?: string;

  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional({
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @IsOptional()
  cursor?: string;

  /** Tope de resultados de la página (por defecto 50). */
  @ApiPropertyOptional({ default: 50, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
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

/** Una dirección del paciente, con su ubicación si la declaró. */
export class OwnAddressDto {
  @ApiPropertyOptional({ description: 'Calle y número, tal como la escribió' })
  lines?: string;

  @ApiPropertyOptional({ description: 'Ciudad, derivada del municipio' })
  city?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio (VS_BO_MUNICIPALITY)',
  })
  municipalityConceptId?: string;

  @ApiPropertyOptional({ description: 'Latitud, si marcó el punto en el mapa' })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud; viaja siempre junto a la latitud',
  })
  longitude?: number;
}

/** Regla del plan con su vigencia explícita para el paciente. */
export class CoverageBenefitSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional()
  categoryCode?: string;

  @ApiPropertyOptional()
  categoryName?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  serviceConceptId?: string;

  @ApiPropertyOptional()
  serviceName?: string;

  /** `null` en persistencia se serializa como ausencia: no significa 0 %. */
  @ApiPropertyOptional({ example: '80.00' })
  coveragePercent?: string;

  @ApiPropertyOptional({ example: '20.00' })
  copayAmount?: string;

  @ApiPropertyOptional({ example: '0.00' })
  deductibleAmount?: string;

  @ApiPropertyOptional()
  statusCode?: string;

  @ApiProperty({
    enum: ['CURRENT', 'UPCOMING', 'EXPIRED', 'INACTIVE', 'UNKNOWN'],
  })
  validityStatus!: CoverageValidity;

  @ApiPropertyOptional({ type: String, format: 'date' })
  effectiveFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  effectiveTo?: string;
}

/** Un seguro declarado por el paciente, con la información que puede verificar por sí mismo. */
export class OwnCoverageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Aseguradora, en palabras' })
  carrierName!: string;

  @ApiPropertyOptional({ description: 'Plan contratado, en palabras' })
  planName?: string;

  @ApiProperty({ description: 'Si el seguro es público o privado' })
  isPublic!: boolean;

  @ApiPropertyOptional({ description: 'Número de póliza declarado' })
  policyIdentifier?: string;

  @ApiPropertyOptional({ description: 'Con qué documento figura afiliado' })
  memberIdentifier?: string;

  @ApiProperty({
    description: 'Si la plataforma confirmó la cobertura con la aseguradora',
  })
  verified!: boolean;

  @ApiPropertyOptional({ description: 'Estado legible de la cobertura' })
  status?: string;

  @ApiPropertyOptional()
  statusCode?: string;

  @ApiProperty({
    enum: ['CURRENT', 'UPCOMING', 'EXPIRED', 'INACTIVE', 'UNKNOWN'],
  })
  validityStatus!: CoverageValidity;

  @ApiProperty({ type: String, format: 'date' })
  referenceDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  effectiveFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Código de moneda del plan' })
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Canal oficial de WhatsApp de la aseguradora',
  })
  carrierWhatsappNumber?: string;

  @ApiPropertyOptional({ description: 'Call center oficial de la aseguradora' })
  carrierCallCenterPhone?: string;

  @ApiProperty({ type: [CoverageBenefitSummaryDto] })
  benefits!: CoverageBenefitSummaryDto[];

  @ApiPropertyOptional({ format: 'uuid', description: 'Plan de salud elegido' })
  planId?: string;

  @ApiProperty({ description: 'Orden de la cobertura: 1 privada, 2 pública' })
  coverageOrder!: number;
}

/**
 * Un tutor o persona autorizada.
 *
 * El teléfono viaja acá y no en una lectura aparte porque es el dato por el que
 * existe el registro: el proceso del stakeholder pide «número celular persona
 * tutor o autorizada», y un tutor sin forma de contacto no cumple su función.
 */
export class OwnGuardianDto {
  @ApiPropertyOptional({ description: 'Cómo se llama' })
  displayName?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Parentesco (concept id)',
  })
  relationshipConceptId?: string;

  @ApiProperty({ description: 'Es a quien llamar en una urgencia' })
  isEmergencyContact!: boolean;

  @ApiProperty({ description: 'Es su representante legal' })
  isLegalGuardian!: boolean;

  @ApiPropertyOptional({ description: 'Su teléfono' })
  phone?: string;
}

/**
 * El propio perfil del paciente: exactamente lo que declaró al registrarse, tal
 * como lo ve —y lo edita— el titular de la cuenta.
 *
 * Es un contrato distinto de {@link PatientSummaryResponseDto}, que es el
 * resumen mínimo con el que el portal se identifica. Éste trae las **partes** del
 * nombre y no sólo el compuesto, porque un formulario de edición necesita saber
 * cuál es el apellido materno para poder cambiarlo, y `displayName` no es
 * separable. Tampoco trae nada clínico: es filiación.
 *
 * Los opcionales viajan **ausentes, no `null`**, igual que el resumen: un campo
 * que la persona nunca declaró y un campo que declaró vacío no son lo mismo, y
 * `null` los confunde.
 */
export class OwnPatientProfileResponseDto {
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
   * Nombre de pila.
   */
  @ApiPropertyOptional({ description: 'Nombre de pila' })
  name?: string;

  /**
   * Segundo nombre.
   */
  @ApiPropertyOptional({ description: 'Segundo nombre' })
  middleName?: string;

  /**
   * Apellido paterno.
   */
  @ApiPropertyOptional({ description: 'Apellido paterno' })
  lastName?: string;

  /**
   * Apellido materno.
   */
  @ApiPropertyOptional({ description: 'Apellido materno' })
  motherLastName?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Nombre compuesto por el servidor a partir de las partes. No se edita directamente.',
  })
  displayName?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description:
      'Fecha sin hora: serializarla como instante la desplazaría un día',
  })
  birthDate?: Date;

  /**
   * Sexo asignado al nacer, por código legible.
   */
  @ApiPropertyOptional({
    enum: BIRTH_SEX_CODES,
    description:
      'Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología.',
  })
  sexAtBirth?: BirthSexCode;

  /**
   * Ocupación del catálogo.
   *
   * Va el uuid y no un código, al revés que el sexo al nacer: aquél sale de una
   * lista corta y fija que el contrato enumera, y las ocupaciones son un catálogo
   * abierto que el formulario ya tiene que pedir para pintar el desplegable
   * (`GET /terminology/value-sets?code=VS_BO_OCCUPATION` y su expansión). Con la
   * lista en la mano, el uuid es lo que le sirve para marcar la opción elegida.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ocupación elegida del catálogo (VS_BO_OCCUPATION)',
  })
  occupationConceptId?: string;

  /**
   * Ocupación en texto libre.
   *
   * Nunca viaja junto a {@link OwnPatientProfileResponseDto.occupationConceptId}:
   * es la salida para lo que no está en el catálogo, y la escritura deja sólo una
   * de las dos.
   */
  @ApiPropertyOptional({ description: 'Ocupación declarada en texto libre' })
  occupationFreeText?: string;

  /**
   * Empresa donde trabaja, elegida del catálogo (`VS_BO_EMPLOYER`).
   *
   * Mismo criterio que la ocupación: nunca viaja junto a
   * {@link OwnPatientProfileResponseDto.workEmployerFreeText}.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER)',
  })
  workEmployerConceptId?: string;

  /** Empresa en texto libre, para cuando no está en el catálogo. */
  @ApiPropertyOptional({ description: 'Empresa declarada en texto libre' })
  workEmployerFreeText?: string;

  /**
   * Teléfono de contacto vigente.
   */
  @ApiPropertyOptional({
    description: 'Teléfono de contacto vigente (`common.contact_points`)',
  })
  phone?: string;

  /**
   * Identificador asociado a residence municipality concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor.',
  })
  residenceMunicipalityConceptId?: string;

  /**
   * Si el titular tiene una aserción de identidad vigente.
   */
  @ApiProperty({
    description:
      'Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`.',
  })
  identityVerified!: boolean;

  /**
   * Valor de patient code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`.',
  })
  patientCode?: string;

  /* --- lo que el alta captura y hasta ahora no volvía ----------------------
     El registro del stakeholder pide que el paciente vea SUS datos, y la
     pantalla mostraba tres campos de quince. Todo esto ya estaba en la base
     —lo escribe el alta— y sólo faltaba devolverlo. */

  @ApiPropertyOptional({
    description:
      'Documento de identidad. Es su usuario de acceso, así que no se edita desde acá.',
  })
  nationalId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Departamento que emitió el documento (VS_BO_DEPARTMENT)',
  })
  issuerAdministrativeAreaConceptId?: string;

  @ApiPropertyOptional({ description: 'NIT para facturación' })
  taxId?: string;

  /** A nombre de quién sale el comprobante. Acompaña al NIT. */
  @ApiPropertyOptional()
  taxHolderName?: string;

  @ApiPropertyOptional({ description: 'Correo de contacto vigente' })
  email?: string;

  /**
   * Foto de perfil de la persona (`profiles.persons.photo_file_id`).
   *
   * Es la foto de la persona, no de un perfil en particular —la misma
   * columna que ya usaba `education.instructors`—: identifica a quien entra
   * por la puerta cualquiera sea su rol. Viaja como id de archivo, igual que
   * el resto de las referencias a `common.files`; quien la pinta la resuelve
   * con `POST /common/files/:id/download-url`.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Foto de perfil (id de archivo en `common.files`)',
  })
  photoFileId?: string;

  @ApiPropertyOptional({
    type: OwnAddressDto,
    description: 'Domicilio, con calle y punto en el mapa si los declaró',
  })
  homeAddress?: OwnAddressDto;

  @ApiPropertyOptional({
    type: OwnAddressDto,
    description: 'Dirección de trabajo',
  })
  workAddress?: OwnAddressDto;

  @ApiProperty({
    type: [OwnCoverageDto],
    description: 'Seguros declarados. Vacío si no declaró ninguno.',
  })
  coverages!: OwnCoverageDto[];

  @ApiProperty({
    type: [OwnGuardianDto],
    description: 'Tutores y personas autorizadas, con su teléfono.',
  })
  guardians!: OwnGuardianDto[];
}
