import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Importe con hasta dos decimales y sin signo.
 *
 * `@IsNumberString()` a secas acepta `-1` y `10.123`: el primero es un precio
 * negativo y el segundo se redondea en silencio al llegar a `numeric(…, 2)`.
 * Ninguno de los dos puede entrar por un endpoint que edita plata.
 */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
/** Mensaje del patrón de importe, en el idioma del producto. */
const PRICE_PATTERN_MESSAGE =
  'El precio debe ser un número positivo con hasta dos decimales';

/** Cuerpo de `POST /billing/service-catalog`. */
export class CreateServiceCatalogItemDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código interno del servicio' })
  @IsString()
  @MaxLength(60)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del servicio' })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de clasificación del servicio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  /**
   * Valor de default price mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Precio de referencia; cada doctor puede cotizar otro precio',
    example: '100.00',
  })
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  defaultPrice!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ description: 'Moneda (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Identificador asociado a tax code.
   */
  @ApiPropertyOptional({
    description: 'Código de impuesto (billing.tax_codes)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  taxCodeId?: string;

  /**
   * Identificador asociado a income account.
   */
  @ApiPropertyOptional({
    description: 'Cuenta de ingreso (accounting.accounts)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  incomeAccountId?: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Si queda disponible para cotizar; por defecto true',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Cuerpo de `PATCH /billing/service-catalog/:id`.
 *
 * Es deliberadamente más chico que el alta: `practiceId` y `code` identifican al
 * servicio dentro de su práctica y moverlos sería otra operación, no una
 * edición. Lo que se edita es lo que el profesional decide de su propia oferta.
 */
export class UpdateServiceCatalogItemDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre del servicio' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  /**
   * Valor de default price mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Precio de referencia del servicio',
    example: '150.00',
  })
  @IsOptional()
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  defaultPrice?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({
    description:
      'Moneda del precio (concepto). Sólo se acepta junto con `defaultPrice`',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Si el servicio sigue disponible para cotizar',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Un servicio del catálogo maestro. */
export class ServiceCatalogItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  practiceId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  serviceConceptId?: string;

  /**
   * Valor de default price mantenido por la instancia.
   */
  @ApiProperty()
  defaultPrice!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  currencyConceptId?: string;

  /**
   * Sigla de la moneda (`BOB`, `USD`), cuando el concepto es uno de los
   * globales que el código conoce.
   *
   * Va junto al uuid y no en su lugar: quien muestra un importe necesita la
   * unidad, y hoy no hay forma de resolverla en el cliente. Queda `undefined`
   * si la fila apunta a uno de los juegos de moneda que el proyecto todavía no
   * unificó (`PHARM_CURRENCY_*`, `PINV_CURRENCY_*`, `ACCT_*`); en ese caso el
   * importe se muestra sin unidad, que es lo que pasa hoy, en vez de inventarle
   * una.
   */
  @ApiPropertyOptional({ description: 'Sigla de la moneda', example: 'BOB' })
  currencyCode?: string;

  /**
   * Identificador asociado a tax code.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  taxCodeId?: string;

  /**
   * Identificador asociado a income account.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  incomeAccountId?: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiProperty()
  isActive!: boolean;
}

/** Respuesta de `GET /billing/service-catalog`: una página keyset por `code`. */
export class SearchServiceCatalogResponseDto {
  /**
   * Servicios de esta página, ordenados por código.
   */
  @ApiProperty({ type: [ServiceCatalogItemDto] })
  items!: ServiceCatalogItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Cursor opaco de continuación, o `null` si ésta es la última página.
   */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}
