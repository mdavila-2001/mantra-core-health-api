import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/** Tope de filas por página del listado administrativo. */
export const ADMIN_SERVICE_CATALOG_MAX_LIMIT = 200;
/** Página por defecto del listado administrativo. */
export const ADMIN_SERVICE_CATALOG_DEFAULT_LIMIT = 50;

/** Importe con hasta dos decimales y sin signo (mismo patrón que el alta por práctica). */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_PATTERN_MESSAGE =
  'El precio debe ser un número positivo con hasta dos decimales';

/**
 * Booleano de query string. `Boolean('false')` es `true`, así que se lee la
 * cadena original (`obj[key]`) y sólo las formas explícitas cuentan.
 */
const queryBoolean = () =>
  Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj?.[key];
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw !== 'string' && typeof raw !== 'number') return raw;
    const normalized = String(raw).trim().toLowerCase();
    if (['true', '1'].includes(normalized)) return true;
    if (['false', '0'].includes(normalized)) return false;
    return raw;
  });

/** Query de `GET /admin/catalogs/services`. Lista blanca: todo lo demás es 400. */
export class AdminListServicesQueryDto {
  /** Tipo de organización dueña del catálogo (`practice.practices.type_concept_id`). */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Tipo de organización (concepto PR_TYPE_*): consultorio, laboratorio, farmacia, aseguradora…',
  })
  @IsOptional()
  @IsUUID()
  practiceTypeConceptId?: string;

  /** Una práctica concreta de la organización activa. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /** Sólo activos (`true`) o sólo inactivos (`false`); ausente = todos. */
  @ApiPropertyOptional()
  @IsOptional()
  @queryBoolean()
  @IsBoolean()
  isActive?: boolean;

  /** Texto sobre código o nombre. */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  /** Filas por página. */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: ADMIN_SERVICE_CATALOG_MAX_LIMIT,
    default: ADMIN_SERVICE_CATALOG_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ADMIN_SERVICE_CATALOG_MAX_LIMIT)
  limit?: number;
}

/** Cuerpo de `POST /admin/catalogs/services`. */
export class AdminCreateServiceDto {
  @ApiProperty({ format: 'uuid', description: 'Práctica dueña del servicio' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({
    maxLength: 120,
    description: 'Código interno, único en la práctica',
  })
  @IsString()
  @MaxLength(120)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionText?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiProperty({ example: '100.00' })
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  defaultPrice!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ description: 'Por defecto true' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Cuerpo de `PATCH /admin/catalogs/services/:id`. */
export class AdminUpdateServiceDto {
  /** Versión que el cliente leyó; si el servidor tiene otra, 409. */
  @ApiProperty({
    minimum: 1,
    description: 'row_version leída (bloqueo optimista)',
  })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  descriptionText?: string | null;

  @ApiPropertyOptional({ maxLength: 20000, nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(20000)
  termsText?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({ example: '150.00' })
  @IsOptional()
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  defaultPrice?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sólo se acepta junto con `defaultPrice`',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Cuerpo de `POST /admin/catalogs/services/:id/deactivate` y `/reactivate`. */
export class AdminServiceStateChangeDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;
}

/** Un servicio en la vista administrativa. */
export class AdminServiceItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  practiceId!: string;

  /** Tipo de la organización dueña (la dimensión «tipo de usuario» disponible hoy). */
  @ApiProperty({ format: 'uuid' })
  practiceTypeConceptId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  descriptionText?: string;

  @ApiPropertyOptional()
  termsText?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  serviceConceptId?: string;

  @ApiProperty()
  defaultPrice!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  currencyConceptId?: string;

  @ApiPropertyOptional()
  currencyCode?: string;

  @ApiProperty()
  isActive!: boolean;

  /** Versión actual: es el `expectedRowVersion` de la próxima escritura. */
  @ApiProperty()
  rowVersion!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  updatedByUserId?: string;
}

/** Página de `GET /admin/catalogs/services`. */
export class AdminServicePageDto {
  @ApiProperty({ type: [AdminServiceItemDto] })
  items!: AdminServiceItemDto[];

  @ApiProperty()
  count!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

/** Un tipo de organización con el que se filtra el editor de servicios. */
export class AdminServiceScopeTypeDto {
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  display!: string;
}

/** Una práctica activa de la organización del actor. */
export class AdminServiceScopePracticeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  typeConceptId!: string;
}

/** Una moneda admitida en el catálogo de servicios. */
export class AdminServiceScopeCurrencyDto {
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  @ApiProperty()
  code!: string;
}

/** Respuesta de `GET /admin/catalogs/services/scopes`: con qué se arma el editor. */
export class AdminServiceScopesDto {
  @ApiProperty({ type: [AdminServiceScopeTypeDto] })
  types!: AdminServiceScopeTypeDto[];

  @ApiProperty({ type: [AdminServiceScopePracticeDto] })
  practices!: AdminServiceScopePracticeDto[];

  @ApiProperty({ type: [AdminServiceScopeCurrencyDto] })
  currencies!: AdminServiceScopeCurrencyDto[];
}
