import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/**
 * Cuerpo de `POST /me/support-patient-search`.
 *
 * La organización llega como `tenantId` o como `org` (el front y el contrato
 * compartido usan nombres distintos) y el documento como `nationalId` o como
 * `document`: se aceptan las dos formas y, si llegan las dos de un mismo par,
 * tienen que coincidir.
 */
export class SupportPatientSearchDto {
  /** Organización en la que busca. */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Organización. Alternativa: `org`.',
  })
  @ValidateIf(
    (dto: SupportPatientSearchDto) =>
      dto.org === undefined || dto.tenantId !== undefined,
  )
  @IsUUID()
  tenantId?: string;

  /** Alias de `tenantId`. */
  @ApiPropertyOptional({ format: 'uuid', description: 'Alias de `tenantId`.' })
  @ValidateIf(
    (dto: SupportPatientSearchDto) =>
      dto.tenantId === undefined || dto.org !== undefined,
  )
  @IsUUID()
  org?: string;

  /** Documento completo. */
  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  nationalId?: string;

  /** Alias de `nationalId`. */
  @ApiPropertyOptional({ maxLength: 40, description: 'Alias de `nationalId`.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  document?: string;

  /** Teléfono completo. */
  @ApiPropertyOptional({ maxLength: 25 })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  /** Nombre completo. */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  /** Fecha de nacimiento exacta (YYYY-MM-DD). */
  @ApiPropertyOptional({ example: '1984-05-17' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;
}

/** Representante de un menor: su representante legal o un familiar autorizado. */
export class SupportPatientRepresentativeDto {
  /** Id de la fila de la que sale. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Nombre. */
  @ApiProperty() name!: string;
  /** «Madre», «Padre», «Tutor legal», «Abuela»… */
  @ApiProperty() relationship!: string;
}

/**
 * Coincidencia de una búsqueda exacta o paciente recién registrado: lo mínimo
 * para reconocer a la persona y nada clínico. Documento y teléfono salen
 * tapados; el menor trae a sus representantes.
 */
export class SupportPatientMatchDto {
  /** Perfil del paciente (nombre del contrato compartido). */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  /** Perfil del paciente (nombre que usa el front). */
  @ApiProperty({ format: 'uuid' }) profileId!: string;
  /** Nombre para mostrar. */
  @ApiProperty() displayName!: string;
  /** Documento con lo central tapado: `***556`. */
  @ApiPropertyOptional() documentMasked?: string;
  /** Teléfono con lo central tapado: `7******7`. Ausente si no tiene. */
  @ApiPropertyOptional() phoneMasked?: string;
  /** Edad cumplida; ausente si el paciente no tiene fecha de nacimiento. */
  @ApiPropertyOptional() ageYears?: number;
  /** Menor de 18 años. */
  @ApiProperty() isMinor!: boolean;
  /** Solo en menores: quiénes pueden actuar por él. Vacío = sin representante. */
  @ApiPropertyOptional({ type: [SupportPatientRepresentativeDto] })
  representatives?: SupportPatientRepresentativeDto[];
}

/** Resultado de la búsqueda exacta. */
export class SupportPatientSearchResponseDto {
  /** Coincidencias exactas (a lo sumo cinco). */
  @ApiProperty({ type: [SupportPatientMatchDto] })
  items!: SupportPatientMatchDto[];
  /** Cantidad. */
  @ApiProperty() count!: number;
}

/** El representante que se declara al registrar a un menor. */
export class SupportPatientGuardianDto {
  /** Nombre completo del representante. */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  /**
   * Documento del representante. No se guarda ni se usa para buscar su cuenta:
   * el mostrador no crea representaciones legales.
   */
  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  document!: string;

  /** Teléfono del representante. */
  @ApiProperty({ maxLength: 25 })
  @IsString()
  @Matches(/^\+?[\d\s()-]{7,25}$/)
  phone!: string;

  /** «Madre», «Padre», «Tutor legal», «Abuela autorizada»… */
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  relationship!: string;
}

/**
 * Cuerpo de `POST /me/support-patients`: el alta rápida de un paciente nuevo.
 *
 * Mismos alias que la búsqueda: `tenantId` u `org`, `document` o `nationalId`.
 */
export class RegisterSupportPatientDto {
  /** Organización en la que se registra. */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Organización. Alternativa: `org`.',
  })
  @ValidateIf(
    (dto: RegisterSupportPatientDto) =>
      dto.org === undefined || dto.tenantId !== undefined,
  )
  @IsUUID()
  tenantId?: string;

  /** Alias de `tenantId`. */
  @ApiPropertyOptional({ format: 'uuid', description: 'Alias de `tenantId`.' })
  @ValidateIf(
    (dto: RegisterSupportPatientDto) =>
      dto.tenantId === undefined || dto.org !== undefined,
  )
  @IsUUID()
  org?: string;

  /** Nombre(s) de pila. */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  /** Apellido paterno. */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  /** Apellido materno. */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * Documento de identidad completo. Se guarda y se compara en su forma
   * canónica (mayúsculas, sin puntos, guiones ni espacios y sin ceros de
   * relleno): «01.234-567» y «1234567» son el mismo documento.
   */
  @ApiPropertyOptional({ maxLength: 40 })
  @ValidateIf(
    (dto: RegisterSupportPatientDto) =>
      dto.nationalId === undefined || dto.document !== undefined,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  document?: string;

  /** Alias de `document`. */
  @ApiPropertyOptional({ maxLength: 40, description: 'Alias de `document`.' })
  @ValidateIf(
    (dto: RegisterSupportPatientDto) =>
      dto.document === undefined || dto.nationalId !== undefined,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  nationalId?: string;

  /** Fecha de nacimiento (YYYY-MM-DD). */
  @ApiProperty({ example: '1984-05-17' })
  @IsString()
  @MaxLength(10)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate!: string;

  /** Teléfono completo. */
  @ApiProperty({ maxLength: 25 })
  @IsString()
  @Matches(/^\+?[\d\s()-]{7,25}$/)
  phone!: string;

  /** Obligatorio si es menor de 18 años: su representante legal o familiar autorizado. */
  @ApiPropertyOptional({ type: SupportPatientGuardianDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SupportPatientGuardianDto)
  guardian?: SupportPatientGuardianDto;

  /** Si se invita al paciente a activar su cuenta de portal. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inviteToPortal?: boolean;

  /** `true` cuando quien registra ya vio los posibles duplicados y sigue de todos modos. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acknowledgeDuplicates?: boolean;
}

/**
 * Un posible duplicado. Si el paciente es de la organización que registra, sale
 * con su perfil y lo mínimo para reconocerlo. Si es de OTRA organización, NO
 * sale su perfil, ni su nombre, ni su edad ni su documento: solo que existe
 * alguien con esos datos (y los «tapados» son los que quien registra acaba de
 * escribir).
 */
export class SupportPatientDuplicateDto {
  /** Perfil (nombre del front). Solo si el paciente es de la organización. */
  @ApiPropertyOptional({ format: 'uuid' }) profileId?: string;
  /** Perfil (nombre del contrato compartido). Solo si es de la organización. */
  @ApiPropertyOptional({ format: 'uuid' }) patientProfileId?: string;
  /** Nombre; de otra organización, un rótulo genérico. */
  @ApiProperty() displayName!: string;
  /** Documento tapado. */
  @ApiProperty() documentMasked!: string;
  /** Teléfono tapado. Solo si el paciente es de la organización. */
  @ApiPropertyOptional() phoneMasked?: string;
  /** Edad; de otra organización, la que sale de lo que quien registra escribió. */
  @ApiPropertyOptional() ageYears?: number;
  /** Menor de 18 años. */
  @ApiProperty() isMinor!: boolean;
  /** Representantes (solo si es menor y de la organización). */
  @ApiPropertyOptional({ type: [SupportPatientRepresentativeDto] })
  representatives?: SupportPatientRepresentativeDto[];
  /** ¿Es paciente de la organización que registra? */
  @ApiProperty() linkedToOrganization!: boolean;
  /** Con qué coincide: `DOCUMENT`, `NAME_AND_BIRTH_DATE`, `PHONE_AND_SURNAME`. */
  @ApiProperty({ type: [String] }) matchedBy!: string[];
}

/** Cómo quedó anotado el representante de un menor registrado por el mostrador. */
export class SupportPatientGuardianResultDto {
  /** El representante quedó anotado como persona relacionada. */
  @ApiProperty() recorded!: true;
  /**
   * `PENDING_VERIFICATION`: no es representante legal. La representación legal
   * la crea un SECURITY_ADMIN con `documentRef` o la acepta el propio
   * representante desde su cuenta.
   */
  @ApiProperty({ enum: ['PENDING_VERIFICATION'] })
  status!: 'PENDING_VERIFICATION';
}

/** Respuesta de `POST /me/support-patients`. */
export class SupportPatientRegistrationResponseDto {
  /** `CREATED` (201) o `POSSIBLE_DUPLICATES` (200, no se creó nada). */
  @ApiProperty({ enum: ['CREATED', 'POSSIBLE_DUPLICATES'] })
  outcome!: 'CREATED' | 'POSSIBLE_DUPLICATES';
  /** El paciente creado (solo `CREATED`). */
  @ApiPropertyOptional({ type: SupportPatientMatchDto })
  patient?: SupportPatientMatchDto;
  /** ¿Quedó pedida la invitación al portal? (solo `CREATED`). */
  @ApiPropertyOptional() invitationSent?: boolean;
  /**
   * El paciente creado nace con la identidad SIN verificar: lo escribió el
   * mostrador y nadie comprobó el documento (solo `CREATED`). Siempre `false`.
   */
  @ApiPropertyOptional() identityVerified?: false;
  /**
   * Representante de un menor (solo `CREATED` con menor). El mostrador nunca
   * crea una representación legal: queda como persona relacionada, pendiente de
   * verificación. La respuesta es la misma exista o no una cuenta con el
   * documento del representante (no revela si la hay).
   */
  @ApiPropertyOptional({ type: SupportPatientGuardianResultDto })
  guardian?: SupportPatientGuardianResultDto;
  /** Los parecidos (solo `POSSIBLE_DUPLICATES`). */
  @ApiPropertyOptional({ type: [SupportPatientDuplicateDto] })
  duplicates?: SupportPatientDuplicateDto[];
}
