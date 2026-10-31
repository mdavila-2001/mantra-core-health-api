import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Tipos de usuario con texto propio en el glosario (hoy: lectura llana vs. clínica). */
export const GLOSSARY_ADMIN_AUDIENCES = ['patient', 'professional'] as const;
export type GlossaryAdminAudience = (typeof GLOSSARY_ADMIN_AUDIENCES)[number];

/** Estados visibles en el editor. */
export const GLOSSARY_ADMIN_STATES = ['active', 'retired'] as const;
export type GlossaryAdminState = (typeof GLOSSARY_ADMIN_STATES)[number];

export const ADMIN_GLOSSARY_MAX_LIMIT = 200;
export const ADMIN_GLOSSARY_DEFAULT_LIMIT = 50;

/** Texto bilingüe `{ es, en? }`, igual que se guarda en `concept_properties.value_json`. */
export class AdminGlossaryTextDto {
  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  es!: string;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  en?: string;
}

/** Query de `GET /admin/catalogs/glossary`. Lista blanca: lo demás es 400. */
export class AdminListGlossaryQueryDto {
  @ApiProperty({ enum: GLOSSARY_ADMIN_AUDIENCES })
  @IsIn(GLOSSARY_ADMIN_AUDIENCES)
  audience!: GlossaryAdminAudience;

  @ApiPropertyOptional({ enum: GLOSSARY_ADMIN_STATES })
  @IsOptional()
  @IsIn(GLOSSARY_ADMIN_STATES)
  state?: GlossaryAdminState;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: ADMIN_GLOSSARY_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ADMIN_GLOSSARY_MAX_LIMIT)
  limit?: number;
}

/** Query de `GET /admin/catalogs/glossary/:conceptId`. */
export class AdminGetGlossaryQueryDto {
  @ApiProperty({ enum: GLOSSARY_ADMIN_AUDIENCES })
  @IsIn(GLOSSARY_ADMIN_AUDIENCES)
  audience!: GlossaryAdminAudience;
}

/** Cuerpo de `POST /admin/catalogs/glossary`. */
export class AdminCreateGlossaryTermDto {
  @ApiProperty({ example: 'hipertension-arterial', maxLength: 80 })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug es kebab-case en minúsculas, sin tildes ni espacios',
  })
  slug!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Nombre canónico (`display` del concepto)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  display!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Designación preferida en español',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameEs!: string;

  @ApiProperty({ enum: GLOSSARY_ADMIN_AUDIENCES })
  @IsIn(GLOSSARY_ADMIN_AUDIENCES)
  audience!: GlossaryAdminAudience;

  @ApiProperty({ type: AdminGlossaryTextDto })
  @ValidateNested()
  @Type(() => AdminGlossaryTextDto)
  text!: AdminGlossaryTextDto;
}

/** Cuerpo de `PATCH /admin/catalogs/glossary/:conceptId`. */
export class AdminUpdateGlossaryTermDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;

  @ApiProperty({ enum: GLOSSARY_ADMIN_AUDIENCES })
  @IsIn(GLOSSARY_ADMIN_AUDIENCES)
  audience!: GlossaryAdminAudience;

  @ApiPropertyOptional({ type: AdminGlossaryTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminGlossaryTextDto)
  text?: AdminGlossaryTextDto;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nameEs?: string;
}

/** Cuerpo de `.../deactivate` y `.../reactivate`. */
export class AdminGlossaryStateChangeDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedRowVersion!: number;

  /** Tipo de usuario cuyo texto se devuelve en la respuesta. */
  @ApiProperty({ enum: GLOSSARY_ADMIN_AUDIENCES })
  @IsIn(GLOSSARY_ADMIN_AUDIENCES)
  audience!: GlossaryAdminAudience;
}

/** Un término en la vista del editor. */
export class AdminGlossaryTermDto {
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  display!: string;

  @ApiProperty()
  nameEs!: string;

  @ApiProperty({ enum: GLOSSARY_ADMIN_STATES })
  state!: GlossaryAdminState;

  @ApiProperty({ enum: GLOSSARY_ADMIN_AUDIENCES })
  audience!: GlossaryAdminAudience;

  /** Texto de ese tipo de usuario, o `null` si todavía no tiene. */
  @ApiProperty({ type: AdminGlossaryTextDto, nullable: true })
  text!: { es: string; en?: string } | null;

  @ApiProperty()
  rowVersion!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  updatedByUserId?: string;
}

/** Página de `GET /admin/catalogs/glossary`. */
export class AdminGlossaryPageDto {
  @ApiProperty({ type: [AdminGlossaryTermDto] })
  items!: AdminGlossaryTermDto[];

  @ApiProperty()
  count!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}
