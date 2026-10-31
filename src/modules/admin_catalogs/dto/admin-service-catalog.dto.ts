import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Importe con hasta dos decimales y sin signo (evita `-1` y `10.123`). */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_MESSAGE =
  'El precio debe ser un número positivo con hasta dos decimales';

/** `true`/`1` y `false`/`0` de la query; con la conversión implícita `'false'` sería `true`. */
const toBoolean = ({ obj, key }: TransformFnParams): unknown => {
  // Se lee el valor original: la conversión implícita del pipe ya habría vuelto `true` a `'false'`.
  const value = (obj as Record<string, unknown>)[key];
  if (value === 'true' || value === '1' || value === true) return true;
  if (value === 'false' || value === '0' || value === false) return false;
  return value;
};

/** El valor tal como llegó, sin la conversión implícita del pipe (un importe no se coacciona de `number`). */
const raw = ({ obj, key }: TransformFnParams): unknown =>
  (obj as Record<string, unknown>)[key];

/** Recorta espacios exteriores de un texto. */
const trimmed = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : (value as unknown);

/** Query de `GET /admin/catalogs/services`. */
export class AdminServiceListQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tipo de organización (concepto PR_TYPE_*)',
  })
  @IsOptional()
  @IsUUID()
  practiceTypeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Práctica de la organización',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({ description: 'true/false/1/0' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Texto sobre código y nombre',
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** Cuerpo de `POST /admin/catalogs/services`. */
export class AdminCreateServiceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ maxLength: 120 })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '100.00', description: 'Decimal exacto como texto' })
  @Transform(raw)
  @IsString()
  @Matches(PRICE_PATTERN, { message: PRICE_MESSAGE })
  defaultPrice!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(2000)
  descriptionText?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Por omisión, BOB' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Cuerpo de `PATCH /admin/catalogs/services/:id`. `code` y `practiceId` no se editan. */
export class AdminUpdateServiceDto {
  @ApiProperty({ minimum: 1, description: 'Versión que la persona leyó' })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    maxLength: 2000,
    nullable: true,
    description: '`null` o vacío limpia el texto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionText?: string | null;

  @ApiPropertyOptional({
    maxLength: 4000,
    nullable: true,
    description: '`null` o vacío limpia el texto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  termsText?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({ example: '120.50' })
  @IsOptional()
  @Transform(raw)
  @IsString()
  @Matches(PRICE_PATTERN, { message: PRICE_MESSAGE })
  defaultPrice?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sólo viaja junto con `defaultPrice`',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Cuerpo de `deactivate` / `reactivate`. */
export class AdminServiceToggleDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;
}

/** Un servicio como lo ve el editor. */
export class AdminServiceItemDto {
  id!: string;
  practiceId!: string;
  practiceTypeConceptId!: string;
  code!: string;
  name!: string;
  descriptionText!: string | null;
  termsText!: string | null;
  serviceConceptId!: string | null;
  /** Decimal exacto como texto (`"100.00"`). */
  defaultPrice!: string;
  currencyConceptId!: string | null;
  currencyCode!: string | null;
  isActive!: boolean;
  rowVersion!: number;
  updatedAt!: string;
  updatedByUserId!: string | null;
}

export class AdminServicePageDto {
  items!: AdminServiceItemDto[];
  count!: number;
  limit!: number;
  nextCursor!: string | null;
}

export class AdminServiceScopesDto {
  types!: { conceptId: string; code: string; display: string }[];
  practices!: { id: string; name: string; typeConceptId: string }[];
  currencies!: { conceptId: string; code: string }[];
}

/** Resultado de un alta: `created=false` es la repetición idéntica (HTTP 200). */
export interface AdminServiceCreateResult {
  item: AdminServiceItemDto;
  created: boolean;
}
