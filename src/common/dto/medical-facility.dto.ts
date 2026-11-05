import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/** Recorta los blancos de los extremos; lo que no es texto pasa tal cual. */
const trimmed = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Recorta cada línea de una lista de textos; lo que no es lista pasa tal cual. */
const trimmedLines = ({ value }: TransformFnParams): unknown =>
  Array.isArray(value)
    ? value.map((line: unknown) =>
        typeof line === 'string' ? line.trim() : line,
      )
    : value;

/**
 * NIT: dígitos y guiones, empezando por dígito (de 4 a 20 caracteres).
 *
 * Es el número, no el certificado: el PDF del NIT viaja aparte, en
 * `legalDocuments.taxIdentifierFileId`.
 */
export const MEDICAL_FACILITY_TAX_ID_PATTERN = /^[0-9][0-9-]{3,19}$/;

/**
 * Número de registro del establecimiento ante la autoridad sanitaria (el SEDES
 * en Bolivia): letras, dígitos, punto, barra y guion.
 */
export const MEDICAL_FACILITY_REGISTRATION_PATTERN = /^[A-Za-z0-9./-]+$/;

/** Nombre con el que nace la casa central si el cliente no manda otro. */
export const MEDICAL_FACILITY_HEADQUARTERS_DEFAULT_NAME = 'Casa central';

/** Tope de sucursales declarables en el alta. */
export const MEDICAL_FACILITY_MAX_BRANCHES = 50;

/**
 * El director médico (responsable técnico) del establecimiento.
 *
 * La norma sanitaria exige uno por establecimiento: es quien responde
 * clínicamente por la institución. **No es una cuenta de la plataforma** ni una
 * fila de `profiles.persons`: es un dato declarado de contacto y
 * responsabilidad, que la plataforma contrasta con el colegio profesional al
 * verificar la organización. Por eso la matrícula viaja con él.
 *
 * El nombre se declara en partes, como el de las gerencias, pero sin la forma
 * anterior `fullName`: este bloque nace con el contrato nuevo y no hay
 * clientes que lo hayan integrado antes.
 */
export class MedicalDirectorDto {
  /** Nombre de pila del director médico. */
  @ApiProperty({ maxLength: 100, example: 'Ana' })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  /** Segundo nombre. Opcional: mucha gente no tiene. */
  @ApiPropertyOptional({ maxLength: 100, example: 'Lucía' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /** Apellido paterno. */
  @ApiProperty({ maxLength: 100, example: 'Rojas' })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  /** Apellido materno. Opcional: no todas las jurisdicciones lo emiten. */
  @ApiPropertyOptional({ maxLength: 100, example: 'Paz' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * Matrícula profesional del director médico (colegio de médicos).
   *
   * Es el dato que permite verificar que quien responde clínicamente por el
   * establecimiento está habilitado para ejercer.
   */
  @ApiProperty({
    description: 'Matrícula profesional del director médico',
    minLength: 3,
    maxLength: 50,
    example: 'MAT-12345',
  })
  @Transform(trimmed)
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  professionalLicenseNumber!: string;

  /** Correo de contacto del director médico. */
  @ApiProperty({
    format: 'email',
    maxLength: 320,
    example: 'dir@clinica.bo',
  })
  @Transform(trimmed)
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Teléfono de contacto. Opcional. El piso de 7 caracteres es laxo a
   * propósito, igual que en las gerencias: el formato lo compone el formulario.
   */
  @ApiPropertyOptional({ maxLength: 30, example: '+591 70012345' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone?: string;
}

/**
 * Una sede declarada del establecimiento: la casa central o una sucursal.
 *
 * Son datos declarados, no la práctica ni la sede operativa: esas se crean en
 * `medical-center-setup` cuando la plataforma verifica la organización, y estos
 * datos sirven para pre-llenarlo y para el equipo de verificación.
 *
 * ## Coordenadas: ambas o ninguna
 *
 * Mismo patrón que `OwnSiteAddressDto`: el `ValidateIf` mira las dos
 * propiedades y no lleva `@IsOptional()` (anularía la condición), así que
 * mandar una sola hace caer a la que falta en su validador y la petición
 * termina en 400. Media coordenada no ubica nada.
 */
export class MedicalFacilitySiteDto {
  /** Nombre de la sede, tal como la va a ver el equipo de verificación. */
  @ApiProperty({ maxLength: 200, example: 'Sucursal Equipetrol' })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /** Líneas de la dirección (calle, número, referencia): de 1 a 10. */
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 10,
    example: ['Av. San Martín 123'],
  })
  @Transform(trimmedLines)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  addressLines!: string[];

  /** Latitud del punto en el mapa; va junto con `longitude` o no va. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90, example: -17.78 })
  @ValidateIf(
    (dto: MedicalFacilitySiteDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLatitude()
  latitude?: number;

  /** Longitud del punto en el mapa; va junto con `latitude` o no va. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180, example: -63.18 })
  @ValidateIf(
    (dto: MedicalFacilitySiteDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLongitude()
  longitude?: number;
}

/**
 * La casa central. Igual que cualquier sede, salvo que su nombre es opcional y
 * por defecto es «Casa central».
 */
export class MedicalFacilityHeadquartersDto {
  /** Nombre de la casa central. Por defecto, «Casa central». */
  @ApiPropertyOptional({ maxLength: 200, default: 'Casa central' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  /** Líneas de la dirección (calle, número, referencia): de 1 a 10. */
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 10,
    example: ['Av. San Martín 123'],
  })
  @Transform(trimmedLines)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  addressLines!: string[];

  /** Latitud del punto en el mapa; va junto con `longitude` o no va. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90, example: -17.78 })
  @ValidateIf(
    (dto: MedicalFacilityHeadquartersDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLatitude()
  latitude?: number;

  /** Longitud del punto en el mapa; va junto con `latitude` o no va. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180, example: -63.18 })
  @ValidateIf(
    (dto: MedicalFacilityHeadquartersDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLongitude()
  longitude?: number;
}

/**
 * Datos propios de un establecimiento de salud, declarados en el alta pública.
 *
 * Sólo corresponde a los cinco tipos médicos (`HOSPITAL`, `CLINIC`,
 * `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`); mandarlo con cualquier otro
 * `tenantType` es un 422 (`TenantTypeProfileService.assertProfileMatchesType`).
 *
 * El bloque entero es opcional en el contrato —un cliente que todavía no lo
 * manda no se rompe— y obligatorio en el formulario público. Si viene, el
 * número de NIT, el registro sanitario y el director médico son obligatorios:
 * son la razón de ser del bloque.
 */
export class MedicalFacilityDto {
  /**
   * NIT de la organización, como número.
   *
   * El PDF del certificado viaja aparte en `legalDocuments`; sin el número la
   * plataforma no puede cruzarlo con el padrón tributario.
   */
  @ApiProperty({
    description: 'NIT del establecimiento (número, sin el certificado)',
    pattern: '^[0-9][0-9-]{3,19}$',
    example: '1023456789',
  })
  @Transform(trimmed)
  @IsString()
  @Matches(MEDICAL_FACILITY_TAX_ID_PATTERN, {
    message:
      'taxIdentifierNumber debe empezar con un dígito y tener de 4 a 20 caracteres entre dígitos y guiones',
  })
  taxIdentifierNumber!: string;

  /**
   * Número de registro o habilitación del establecimiento ante la autoridad
   * sanitaria (el SEDES en Bolivia).
   *
   * Hoy sólo se sube el PDF del certificado; sin el número la plataforma no
   * puede verificarlo ni cruzarlo con el registro oficial.
   */
  @ApiProperty({
    description:
      'Número de registro del establecimiento ante la autoridad sanitaria (SEDES en Bolivia)',
    minLength: 3,
    maxLength: 50,
    pattern: '^[A-Za-z0-9./-]+$',
    example: 'SEDES-SC-2020-0412',
  })
  @Transform(trimmed)
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(MEDICAL_FACILITY_REGISTRATION_PATTERN, {
    message:
      'healthFacilityRegistrationNumber sólo admite letras, dígitos, punto, barra y guion',
  })
  healthFacilityRegistrationNumber!: string;

  /** Director médico (responsable técnico) del establecimiento. */
  @ApiProperty({ type: MedicalDirectorDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => MedicalDirectorDto)
  medicalDirector!: MedicalDirectorDto;

  /** Casa central: dirección y, si se quiere, punto en el mapa. */
  @ApiPropertyOptional({ type: MedicalFacilityHeadquartersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalFacilityHeadquartersDto)
  headquarters?: MedicalFacilityHeadquartersDto;

  /** Sucursales del establecimiento: hasta 50, opcionales. */
  @ApiPropertyOptional({
    type: [MedicalFacilitySiteDto],
    maxItems: MEDICAL_FACILITY_MAX_BRANCHES,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MEDICAL_FACILITY_MAX_BRANCHES)
  @ValidateNested({ each: true })
  @Type(() => MedicalFacilitySiteDto)
  branches?: MedicalFacilitySiteDto[];
}
