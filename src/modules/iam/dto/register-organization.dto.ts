import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  TENANT_TYPE_CODES,
  type TenantTypeCode,
} from '../../directory/directory.concepts';
import {
  LEGAL_ENTITY_TYPE_CODES,
  type LegalEntityTypeCode,
} from '../../directory/legal-entity-types';
import {
  BrokerProfileDto,
  DiagnosticUnitProfileDto,
  PayerProfileDto,
} from '../../directory/dto';

/**
 * Los cinco documentos legales de afiliación en PDF (subtarea 1.2), ya
 * subidos por `POST /iam/auth/upload-registration-document`.
 *
 * El bloque es todo o nada: `@IsUUID()` sin `@IsOptional()` en cada campo
 * hace que mandar cuatro de cinco sea un **400** de `ValidationPipe` — nunca
 * un 422 de negocio, porque no es una regla de dominio, es una forma
 * incompleta del contrato.
 *
 * Los nombres son los roles canónicos del documento
 * (`AffiliationDocumentRole` de `directory/affiliation-documents.ts`), no
 * las siglas bolivianas del proceso original (`nitFileId`, `seprecFileId`,
 * `sedesCertificateFileId`): la API es en inglés y el mismo contrato tiene
 * que servir a Brasil o Estados Unidos, donde esos nombres no significan
 * nada.
 */
export class RegisterOrganizationLegalDocumentsDto {
  /**
   * Escritura de constitución de la empresa (1.1.2 del registro de procesos).
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Escritura de constitución (fileId de POST /iam/auth/upload-registration-document)',
  })
  @IsUUID()
  constitutionFileId!: string;

  /**
   * Certificado de inscripción tributaria — el NIT en Bolivia (1.2.1).
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Identificación tributaria (NIT en Bolivia)',
  })
  @IsUUID()
  taxIdentifierFileId!: string;

  /**
   * Registro mercantil — la matrícula de comercio SEPREC en Bolivia (1.3).
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Registro mercantil (matrícula SEPREC en Bolivia)',
  })
  @IsUUID()
  commerceRegistryFileId!: string;

  /**
   * Licencia de funcionamiento municipal (1.4).
   */
  @ApiProperty({ format: 'uuid', description: 'Licencia de funcionamiento' })
  @IsUUID()
  operatingLicenseFileId!: string;

  /**
   * Certificado de la autoridad sanitaria — el SEDES en Bolivia (1.5).
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Certificado de la autoridad sanitaria (SEDES en Bolivia)',
  })
  @IsUUID()
  healthAuthorityCertificateFileId!: string;
}

/**
 * Una gerencia de contacto de la organización (subtarea 1.4).
 *
 * El registro de procesos pide, para la aseguradora, el nombre, el celular y
 * el correo de tres cargos — general, comercial y marketing (ASEGURADORA
 * 1.9-1.17) —. No son cuentas de la plataforma: son a quién llamar para un
 * convenio, una conciliación o un siniestro.
 *
 * ## El nombre se declara en partes
 *
 * Mismo criterio que `RegisterOrganizationOwnerDto`: `name`/`lastName` son
 * obligatorios salvo que venga `fullName`, que es la forma anterior y sigue
 * aceptada para no romper a quien ya integró contra este endpoint. No hay
 * `thirdName` — ninguna persona de este alta lo tiene en el contrato — así
 * que un tercer nombre u otros se pliega en `middleName` antes de enviarlo,
 * como ya hace el cliente con el owner.
 */
export class RegisterOrganizationExecutiveContactDto {
  /**
   * Nombre de pila del ejecutivo.
   *
   * Obligatorio salvo que se envíe `fullName`, la forma anterior de declarar
   * el nombre.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Carlos' })
  @ValidateIf(
    (dto: RegisterOrganizationExecutiveContactDto) =>
      dto.fullName === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /**
   * Segundo nombre. Opcional: mucha gente no tiene.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Eduardo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /**
   * Apellido paterno. Mismo criterio que `name`.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Mendoza' })
  @ValidateIf(
    (dto: RegisterOrganizationExecutiveContactDto) =>
      dto.fullName === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  /**
   * Apellido materno. Opcional: no todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Rivero' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * Nombre completo del ejecutivo, tal como lo escriban.
   *
   * Forma anterior de declarar el nombre. Preferí `name`/`lastName`: si viene,
   * manda tal cual; si no, se compone con las partes.
   */
  @ApiPropertyOptional({
    description: 'Nombre completo del ejecutivo (forma anterior; preferí name/lastName)',
    maxLength: 200,
    example: 'Carlos Mendoza Rivero',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  fullName?: string;

  /**
   * Celular de contacto, con su prefijo internacional.
   *
   * El piso de 7 caracteres es deliberadamente laxo: el formato lo compone el
   * formulario (`+591 70012345`) y validarlo por longitud acá rechazaría
   * números legítimos de otras jurisdicciones.
   */
  @ApiProperty({
    description: 'Teléfono celular de contacto',
    maxLength: 30,
    example: '+591 70012345',
  })
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone!: string;

  /**
   * Correo corporativo del ejecutivo.
   */
  @ApiProperty({
    description: 'Correo electrónico corporativo',
    format: 'email',
    maxLength: 320,
    example: 'cmendoza@aseguradora.com',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

/**
 * El representante legal de la organización y su poder notariado (subtarea 1.4).
 *
 * `powerOfAttorneyFileId` es el `fileId` que devolvió
 * `POST /iam/auth/upload-registration-document`, igual que los cinco
 * documentos de `legalDocuments`: el alta lo reclama dentro de su propia
 * transacción y lo materializa como un documento de afiliación de tipo
 * `PODER_REPRESENTANTE_LEGAL`, emitido por una notaría, que apunta a la
 * persona del representante.
 */
export class RegisterOrganizationLegalRepresentativeDto {
  /**
   * Nombre de pila del representante legal.
   *
   * Obligatorio salvo que se envíe `fullName`, la forma anterior de declarar
   * el nombre. Sin `thirdName` en el contrato: se pliega en `middleName`.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Mariana' })
  @ValidateIf(
    (dto: RegisterOrganizationLegalRepresentativeDto) =>
      dto.fullName === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /**
   * Segundo nombre. Opcional: mucha gente no tiene.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Elena' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /**
   * Apellido paterno. Mismo criterio que `name`.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Siles' })
  @ValidateIf(
    (dto: RegisterOrganizationLegalRepresentativeDto) =>
      dto.fullName === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  /**
   * Apellido materno. Opcional: no todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Justiniano' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * Nombre completo del representante legal.
   *
   * Forma anterior de declarar el nombre. Preferí `name`/`lastName`: si viene,
   * manda tal cual; si no, se compone con las partes.
   */
  @ApiPropertyOptional({
    description: 'Nombre completo del representante legal (forma anterior; preferí name/lastName)',
    maxLength: 200,
    example: 'Mariana Siles Justiniano',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  fullName?: string;

  /**
   * Documento de identidad, tal como figura en el carnet.
   */
  @ApiProperty({
    description: 'Cédula de identidad o documento legal equivalente',
    maxLength: 50,
    example: '4872190 SC',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  idNumber!: string;

  /**
   * Correo al que se le notifica lo legal.
   */
  @ApiProperty({
    description: 'Correo oficial para notificaciones legales',
    format: 'email',
    maxLength: 320,
    example: 'legal@aseguradora.com',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Teléfono de contacto. Opcional: el registro de procesos no lo pide, pero
   * si el formulario lo captura no se tira.
   */
  @ApiPropertyOptional({
    description: 'Teléfono de contacto del representante',
    maxLength: 30,
    example: '+591 70012345',
  })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone?: string;

  /**
   * Id del PDF del poder notariado, ya subido con
   * `POST /iam/auth/upload-registration-document`.
   */
  @ApiProperty({
    description: 'Id del archivo del poder notariado (PDF ya pre-cargado)',
    format: 'uuid',
  })
  @IsUUID()
  powerOfAttorneyFileId!: string;
}

/**
 * Las tres gerencias de contacto. Bloque todo-o-nada (subtarea 1.4).
 *
 * Las tres propiedades llevan `@IsNotEmptyObject()` además de
 * `@ValidateNested()` porque `class-validator` **no valida una propiedad
 * anidada ausente**: sin él, mandar sólo `generalManager` pasaría el pipe y
 * llegaría al servicio con dos gerencias `undefined`. Mismo patrón que
 * `organization`/`owner` en {@link RegisterOrganizationDto}.
 */
export class RegisterOrganizationExecutivesDto {
  /**
   * Gerencia general.
   */
  @ApiProperty({ type: RegisterOrganizationExecutiveContactDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationExecutiveContactDto)
  generalManager!: RegisterOrganizationExecutiveContactDto;

  /**
   * Gerencia comercial.
   */
  @ApiProperty({ type: RegisterOrganizationExecutiveContactDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationExecutiveContactDto)
  commercialManager!: RegisterOrganizationExecutiveContactDto;

  /**
   * Gerencia de marketing.
   */
  @ApiProperty({ type: RegisterOrganizationExecutiveContactDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationExecutiveContactDto)
  marketingManager!: RegisterOrganizationExecutiveContactDto;
}

/** Datos de la organización que se está dando de alta a sí misma. */
export class RegisterOrganizationDetailsDto {
  /**
   * Código único global con el que se identifica al tenant.
   */
  @ApiProperty({
    description: 'Código único global de la organización',
    maxLength: 100,
    example: 'CLINICA_SAN_RAFAEL',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  // Mismo criterio que el documento de identidad en el registro de pacientes:
  // el código viaja en URLs y logs, así que no admite espacios ni control.
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo',
  })
  code!: string;

  /**
   * Razón social con la que la organización está inscrita.
   */
  @ApiProperty({ description: 'Razón social / nombre legal', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  /**
   * Nombre comercial, si difiere de la razón social.
   */
  @ApiPropertyOptional({ description: 'Nombre comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  /**
   * Tipo de organización: prestador, aseguradora, corredor, universidad,
   * farmacia, institución de salud o negocio de salud.
   */
  @ApiProperty({
    description:
      'Tipo de organización. Obligatorio: cada tipo exige sus propios datos. ' +
      'PAYER exige el bloque `payer` y BROKER el bloque `broker`. El resto ' +
      '—PROVIDER, UNIVERSITY, PHARMACY, DIAGNOSTIC_CENTER y las cuatro ' +
      'institucionales (HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER) y ' +
      'HEALTH_BUSINESS— ' +
      'exigen país y ' +
      'jurisdicción, que es lo que determina bajo qué regulador operan.',
    enum: TENANT_TYPE_CODES,
    example: 'HOSPITAL',
  })
  @IsIn(TENANT_TYPE_CODES)
  tenantType!: TenantTypeCode;

  /**
   * Tipo societario, del diccionario internacional (subtarea 1.1).
   *
   * Opcional en el contrato por compatibilidad: los clientes que ya integraron
   * contra este endpoint no lo declaran, y sin él la organización sigue
   * naciendo con la forma legada `COMPANY`. El formulario público de alta SÍ
   * lo exige — «SOLO SELECCIONAR AL REGISTRAR», registro de procesos 2.2.1.1 —
   * pero esa obligatoriedad es del cliente, no de este contrato.
   */
  @ApiPropertyOptional({
    description:
      'Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Sin ' +
      'él, la organización nace con la forma legada `COMPANY`.',
    enum: LEGAL_ENTITY_TYPE_CODES,
    example: 'SRL',
  })
  @IsOptional()
  @IsIn(LEGAL_ENTITY_TYPE_CODES)
  legalEntityType?: LegalEntityTypeCode;

  /**
   * Documentos legales de afiliación en PDF (subtarea 1.2).
   *
   * Opcional en el contrato por el mismo motivo que `legalEntityType`: los
   * clientes que ya integraron contra este endpoint no los declaran, y sin
   * ellos el tenant nace igual (pendiente de verificación, como siempre). El
   * formulario público de alta SÍ los exige — «Adjuntar … en PDF», registro
   * de procesos 1.1.2/1.2.1/1.3/1.4/1.5 — pero esa obligatoriedad es del
   * cliente, no de este contrato.
   */
  @ApiPropertyOptional({ type: RegisterOrganizationLegalDocumentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterOrganizationLegalDocumentsDto)
  legalDocuments?: RegisterOrganizationLegalDocumentsDto;

  /**
   * El representante legal de la organización, con su poder notariado
   * (subtarea 1.4).
   *
   * Va acá y no en `payer` por dos razones: el registro de procesos repite el
   * mismo bloque para farmacia, laboratorio e imagenología —es onboarding del
   * tenant, no de la aseguradora—, y `PayerProfileDto` lo consumen tres
   * puertas de alta, dos de las cuales no pueden crear las personas que este
   * bloque implica.
   *
   * Opcional en el contrato y obligatorio en el formulario, mismo criterio que
   * `legalEntityType` (1.1), `legalDocuments` (1.2) y las coordenadas de la
   * casa matriz (1.3): un cliente que todavía no lo manda no se rompe.
   */
  @ApiPropertyOptional({ type: RegisterOrganizationLegalRepresentativeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterOrganizationLegalRepresentativeDto)
  legalRepresentative?: RegisterOrganizationLegalRepresentativeDto;

  /**
   * Las tres gerencias de contacto (subtarea 1.4). Ver
   * {@link RegisterOrganizationDetailsDto.legalRepresentative} para por qué
   * está acá y no en `payer`.
   */
  @ApiPropertyOptional({ type: RegisterOrganizationExecutivesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterOrganizationExecutivesDto)
  executives?: RegisterOrganizationExecutivesDto;

  /**
   * Datos de aseguradora. Obligatorio cuando `tenantType` es `PAYER`.
   */
  @ApiPropertyOptional({ type: PayerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayerProfileDto)
  payer?: PayerProfileDto;

  /**
   * Datos de corredor. Obligatorio cuando `tenantType` es `BROKER`.
   */
  @ApiPropertyOptional({ type: BrokerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerProfileDto)
  broker?: BrokerProfileDto;

  /**
   * Datos del centro de diagnóstico. Sólo corresponde cuando `tenantType` es
   * `DIAGNOSTIC_CENTER`; con cualquier otro tipo es un 422 (PR #404 del
   * front, «alta del centro de imagenología»).
   */
  @ApiPropertyOptional({ type: DiagnosticUnitProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiagnosticUnitProfileDto)
  diagnosticUnit?: DiagnosticUnitProfileDto;

  /**
   * País de la organización. Obligatorio para `PROVIDER`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Jurisdicción de la organización. Obligatoria para `PROVIDER`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Zona horaria IANA en la que opera.
   */
  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    maxLength: 100,
    example: 'America/La_Paz',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

/**
 * Datos de la persona que queda como owner de la organización.
 *
 * El nombre se declara en partes, como en el resto de las altas. Ojo: esta vía
 * crea la cuenta del owner y nada más —no hay fila en `profiles.persons`—, así
 * que las partes sólo sobreviven compuestas en `iam.users.display_name`.
 */
export class RegisterOrganizationOwnerDto {
  /**
   * Correo con el que el owner iniciará sesión.
   */
  @ApiProperty({
    description: 'Correo con el que el owner iniciará sesión',
    format: 'email',
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Contraseña definitiva: el titular está presente, no hay token de activación.
   */
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /**
   * Nombre de pila del owner.
   *
   * Obligatorio salvo que se envíe `displayName`, que es la forma anterior de
   * declarar el nombre y se sigue aceptando para no romper a quien ya la usa.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Ana' })
  @ValidateIf(
    (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /**
   * Segundo nombre. Opcional: mucha gente no tiene.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Lucía' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /**
   * Apellido paterno. Mismo criterio que `name`.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Rojas' })
  @ValidateIf(
    (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  /**
   * Apellido materno. Opcional: no todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * Nombre ya compuesto, para mostrar.
   *
   * Dejó de ser la forma de declarar el nombre —ahora se envían sus partes— pero
   * sigue siendo opcional en vez de prohibido: quitarlo de golpe rompería a todo
   * cliente que ya integró contra este endpoint. Si viene, manda tal cual; si no,
   * se compone con las partes.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Forma anterior de declarar el nombre. Preferí name/lastName.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName?: string;

  /**
   * Zona horaria del owner; por defecto la de la organización.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

/**
 * Cuerpo de `POST /iam/auth/register-organization`.
 *
 * Registro en un solo paso: la organización y la cuenta de quien la dirige nacen
 * juntas. Separarlo obligaría a que alguien creara antes el usuario, que es
 * justo lo que impedía que una organización se diera de alta a sí misma.
 */
export class RegisterOrganizationDto {
  /**
   * Datos de la organización.
   */
  @ApiProperty({ type: RegisterOrganizationDetailsDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationDetailsDto)
  organization!: RegisterOrganizationDetailsDto;

  /**
   * Datos del owner inicial.
   */
  @ApiProperty({ type: RegisterOrganizationOwnerDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationOwnerDto)
  owner!: RegisterOrganizationOwnerDto;
}

/** Resultado del auto-registro de una organización. */
export class RegisterOrganizationResponseDto {
  /**
   * Identificador del tenant creado.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Código único de la organización, tal como quedó persistido.
   */
  @ApiProperty({ example: 'CLINICA_SAN_RAFAEL' })
  code!: string;

  /**
   * Identificador de la cuenta owner creada.
   */
  @ApiProperty({ format: 'uuid' })
  ownerUserId!: string;

  /**
   * Identificador de la membresía OWNER que vincula cuenta y organización.
   */
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  /**
   * Estado del tenant: nace pendiente de verificación por la plataforma.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto de estado del tenant (pendiente de verificación)',
  })
  status!: string;

  /**
   * Si el correo de verificación quedó encolado. No condiciona el acceso.
   */
  @ApiProperty({
    description: 'Si se pudo encolar el correo de verificación',
  })
  emailVerificationSent!: boolean;

  /**
   * Id de la unidad diagnóstica creada. Sólo presente cuando `tenantType`
   * es `DIAGNOSTIC_CENTER` y el alta declaró el bloque `diagnosticUnit`.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id de la unidad diagnóstica creada (sólo DIAGNOSTIC_CENTER)',
  })
  diagnosticUnitId?: string;

  /**
   * Cuántos documentos legales quedaron registrados, pendientes de
   * verificación (subtarea 1.2). Ausente si el alta no declaró `legalDocuments`.
   */
  @ApiPropertyOptional({
    description:
      'Cuántos documentos legales quedaron registrados pendientes de ' +
      'verificación (sólo si el alta los declaró)',
  })
  legalDocumentsRegistered?: number;

  /**
   * Cuántos vínculos de representación quedaron registrados (subtarea 1.4):
   * el representante legal más las tres gerencias, cuando el alta los declara.
   *
   * Ausente cuando el alta no declaró ninguno.
   */
  @ApiPropertyOptional({
    description:
      'Vínculos de representación registrados (representante legal + gerencias)',
    example: 4,
  })
  representativesRegistered?: number;
}
