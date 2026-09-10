import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OwnSiteAddressDto } from '../../practice/dto';

/**
 * Datos que identifican a una aseguradora (`PAYER`).
 *
 * Se exigen porque una aseguradora sin su código ni su identificador ante el
 * regulador no es contrastable: `insurance.insurance_carriers` los necesita para
 * existir y todo el flujo de siniestros cuelga de esa fila.
 */
export class PayerProfileDto {
  /**
   * Código interno de la aseguradora dentro de la plataforma.
   */
  @ApiProperty({ description: 'Código de la aseguradora', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  carrierCode!: string;

  /**
   * Sigla con la que se conoce a la aseguradora.
   */
  @ApiProperty({
    description: 'Sigla de la aseguradora',
    maxLength: 20,
    example: 'BUPA',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  sigla!: string;

  /**
   * Dirección de la aseguradora.
   */
  @ApiProperty({ description: 'Dirección de la aseguradora', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  address!: string;

  /**
   * Identificador ante el regulador de seguros (registro, matrícula, NIT).
   */
  @ApiProperty({
    description: 'Identificador ante el regulador de seguros',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  regulatorIdentifier!: string;

  /**
   * Jurisdicción en la que está autorizada a operar.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}

/**
 * Datos que identifican a un corredor de seguros (`BROKER`).
 *
 * Un corredor sin número de licencia no es un corredor: es la credencial que lo
 * habilita a intermediar, y `insurance.insurance_brokers` es la fila de la que
 * cuelgan sus acuerdos con aseguradoras y sus comisiones.
 */
export class BrokerProfileDto {
  /**
   * Código interno del corredor dentro de la plataforma.
   */
  @ApiProperty({ description: 'Código del corredor', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brokerCode!: string;

  /**
   * Número de licencia de intermediación.
   */
  @ApiProperty({
    description: 'Número de licencia de intermediación',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber!: string;

  /**
   * Jurisdicción que emitió la licencia.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}

/**
 * La sede primaria del centro de diagnóstico, declarada en el alta.
 *
 * Mismo bloque de dirección que el consultorio propio del profesional
 * (`practice/dto/create-own-site.dto.ts`, P20): es el mismo caso —una sede
 * que nace junto con quien la administra, sin que exista todavía ninguna
 * práctica ni sede previa a la que colgarse—.
 */
export class DiagnosticUnitPrimarySiteDto {
  /**
   * Nombre de la sede, tal como la va a ver el paciente.
   *
   * Opcional: si no viene, se usa «Sede central».
   */
  @ApiPropertyOptional({ maxLength: 200, example: 'Sede central' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  /**
   * Zona horaria IANA de la sede. Por defecto la de la organización.
   */
  @ApiPropertyOptional({ example: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Dirección de la sede. Opcional: se puede cargar más tarde.
   */
  @ApiPropertyOptional({ type: OwnSiteAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OwnSiteAddressDto)
  address?: OwnSiteAddressDto;
}

/**
 * Datos del centro de diagnóstico. Obligatorio cuando `tenantType` es
 * `DIAGNOSTIC_CENTER`... salvo que ninguno de sus campos lo sea: el alta
 * puede declarar sólo el tipo y completar la unidad diagnóstica después
 * desde el módulo 23 (`POST /diagnostic-units`).
 *
 * Declarar este bloque con cualquier otro `tenantType` es un error del
 * cliente (`TenantTypeProfileService.assertProfileMatchesType`), mismo
 * criterio que `payer`/`broker`.
 */
export class DiagnosticUnitProfileDto {
  /**
   * Código de la unidad dentro del tenant. Por defecto, el código de la
   * organización.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'CENTRO_IMAGEN_CENTRAL' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo',
  })
  code?: string;

  /**
   * Nombre operativo de la unidad. Por defecto, la razón social.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    example: 'Centro de Diagnóstico por Imágenes',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  /**
   * Tipo de unidad: por imágenes o de laboratorio clínico. Por defecto,
   * imágenes — es la única de las dos que este alta público sirve hoy; el
   * laboratorio de sangre tiene su propio módulo pendiente (ver handoff del
   * front).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitTypeConceptId?: string;

  /**
   * Modalidades que ofrece (Rayos X, Ecografía, Tomografía…). Lista cerrada
   * del módulo 23 (`diagnostic-unit-modalities.ts`), no el catálogo de
   * terminología: declarar una fuera de esa lista es un 422 que nombra cuál.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  modalityConceptIds?: string[];

  /**
   * Si acepta pacientes espontáneos de mostrador, sin orden previa.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  walkInAvailable?: boolean;

  /**
   * Si realiza toma de muestras o estudios a domicilio.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  homeCollectionAvailable?: boolean;

  /**
   * La sede operativa inicial de la unidad. Opcional: sin ella, la unidad
   * nace sin sede primaria y se completa después desde el módulo 23.
   */
  @ApiPropertyOptional({ type: DiagnosticUnitPrimarySiteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiagnosticUnitPrimarySiteDto)
  primarySite?: DiagnosticUnitPrimarySiteDto;
}
