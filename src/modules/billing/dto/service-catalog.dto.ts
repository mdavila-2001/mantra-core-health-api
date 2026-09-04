import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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
   * Valor de description text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Descripción larga del servicio, para la tarjeta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionText?: string;

  /**
   * Identificador asociado a image file.
   */
  @ApiPropertyOptional({
    description: 'Imagen del servicio (`common.files`)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  imageFileId?: string;

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
   * Valor de description text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  descriptionText?: string;

  /**
   * Identificador asociado a image file.
   *
   * Es el id de un archivo de `common.files`, no una URL. Quién puede leer ese
   * contenido lo decide `common.files`, y hoy sólo lo entrega a quien lo subió
   * o a un rol de revisión.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  imageFileId?: string;

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
