import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  UI_DESCRIPTION_MAX,
  UI_ELEMENT_KEY_MAX,
  UI_ELEMENT_KEY_PATTERN,
  UI_ELEMENT_KINDS,
  UI_ELEMENT_STATUSES,
  UI_LABEL_MAX,
  UI_MAX_PAGE_SIZE,
  UI_MODULE_CODE_MAX,
  UI_REASON_MAX,
  UI_REASON_MIN,
  UI_RULE_EFFECTS,
  UI_RULE_SUBJECT_TYPES,
  UI_SUBJECT_ID_MAX,
  UI_SYNC_MAX_ELEMENTS,
  type UiElementKind,
  type UiElementStatus,
  type UiRuleEffect,
  type UiRuleSubjectType,
} from '../ui-visibility.constants';

/** Recorta espacios exteriores de un texto; lo demás pasa tal cual. */
const trimmed = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : (value as unknown);

/** `true`/`1` y `false`/`0` de la query; con la conversión implícita `'false'` sería `true`. */
const toBoolean = ({ obj, key }: TransformFnParams): unknown => {
  const value = (obj as Record<string, unknown>)[key];
  if (value === 'true' || value === '1' || value === true) return true;
  if (value === 'false' || value === '0' || value === false) return false;
  return value;
};

/** El valor tal como llegó: la conversión implícita del pipe volvería `true` a cualquier texto en un booleano. */
const raw = ({ obj, key }: TransformFnParams): unknown =>
  (obj as Record<string, unknown>)[key];

const KEY_MESSAGE =
  'La clave debe ir en minúsculas, con puntos entre niveles: <modulo>.<pantalla>.<elemento>';

export class UiPageQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor opaco (`nextCursor`)',
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: UI_MAX_PAGE_SIZE, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(UI_MAX_PAGE_SIZE)
  limit?: number;
}

export class ElementsQueryDto extends UiPageQueryDto {
  @ApiPropertyOptional({
    description: 'Código del módulo',
    maxLength: UI_MODULE_CODE_MAX,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_MODULE_CODE_MAX)
  module?: string;

  @ApiPropertyOptional({ enum: UI_ELEMENT_KINDS })
  @IsOptional()
  @IsIn(UI_ELEMENT_KINDS)
  kind?: UiElementKind;

  @ApiPropertyOptional({
    description: 'Busca en la clave y la etiqueta',
    maxLength: 120,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: UI_ELEMENT_STATUSES })
  @IsOptional()
  @IsIn(UI_ELEMENT_STATUSES)
  status?: UiElementStatus;
}

/** Un elemento tal como lo declara el registro del front (`UiElementDraft`). */
export class UiElementDraftDto {
  @ApiProperty({
    example: 'pharmacy.orders.export-button',
    maxLength: UI_ELEMENT_KEY_MAX,
  })
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_ELEMENT_KEY_MAX)
  @Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })
  key!: string;

  @ApiProperty({ enum: UI_ELEMENT_KINDS })
  @IsIn(UI_ELEMENT_KINDS)
  kind!: UiElementKind;

  @ApiProperty({ maxLength: UI_MODULE_CODE_MAX })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(UI_MODULE_CODE_MAX)
  moduleCode!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: UI_ELEMENT_KEY_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_ELEMENT_KEY_MAX)
  @Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })
  parentKey!: string | null;

  @ApiProperty({ maxLength: UI_LABEL_MAX })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(UI_LABEL_MAX)
  label!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: UI_DESCRIPTION_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_DESCRIPTION_MAX)
  description!: string | null;

  @ApiProperty()
  @Transform(raw)
  @IsBoolean()
  defaultVisible!: boolean;
}

/** Alta manual (source ADMIN). */
export class CreateElementDto {
  @ApiProperty({
    example: 'pharmacy.orders.export-button',
    maxLength: UI_ELEMENT_KEY_MAX,
  })
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_ELEMENT_KEY_MAX)
  @Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })
  key!: string;

  @ApiProperty({ enum: UI_ELEMENT_KINDS })
  @IsIn(UI_ELEMENT_KINDS)
  kind!: UiElementKind;

  @ApiProperty({ maxLength: UI_MODULE_CODE_MAX })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(UI_MODULE_CODE_MAX)
  moduleCode!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: UI_ELEMENT_KEY_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_ELEMENT_KEY_MAX)
  @Matches(UI_ELEMENT_KEY_PATTERN, { message: KEY_MESSAGE })
  parentKey?: string | null;

  @ApiProperty({ maxLength: UI_LABEL_MAX })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(UI_LABEL_MAX)
  label!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: UI_DESCRIPTION_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_DESCRIPTION_MAX)
  description?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(raw)
  @IsBoolean()
  defaultVisible?: boolean;
}

export class SyncElementsDto {
  @ApiProperty({ type: [UiElementDraftDto], maxItems: UI_SYNC_MAX_ELEMENTS })
  @IsArray()
  @ArrayMaxSize(UI_SYNC_MAX_ELEMENTS)
  @ValidateNested({ each: true })
  @Type(() => UiElementDraftDto)
  elements!: UiElementDraftDto[];
}

export class RulesQueryDto extends UiPageQueryDto {
  @ApiPropertyOptional({ maxLength: UI_ELEMENT_KEY_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_ELEMENT_KEY_MAX)
  elementKey?: string;

  @ApiPropertyOptional({ enum: UI_RULE_SUBJECT_TYPES })
  @IsOptional()
  @IsIn(UI_RULE_SUBJECT_TYPES)
  subjectType?: UiRuleSubjectType;

  @ApiPropertyOptional({ maxLength: UI_SUBJECT_ID_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_SUBJECT_ID_MAX)
  subjectId?: string;

  @ApiPropertyOptional({
    description:
      'true: sólo reglas en vigor ahora; false: terminadas, vencidas o futuras',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;
}

export class CreateRuleDto {
  @ApiProperty({ maxLength: UI_ELEMENT_KEY_MAX })
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_ELEMENT_KEY_MAX)
  elementKey!: string;

  @ApiProperty({ enum: UI_RULE_EFFECTS })
  @IsIn(UI_RULE_EFFECTS)
  effect!: UiRuleEffect;

  @ApiProperty({ enum: UI_RULE_SUBJECT_TYPES })
  @IsIn(UI_RULE_SUBJECT_TYPES)
  subjectType!: UiRuleSubjectType;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: UI_SUBJECT_ID_MAX,
    description:
      'USER: id de usuario · TENANT: id de organización · ROLE: código de rol · ORG_TYPE: código del tipo de organización · ALL: null',
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_SUBJECT_ID_MAX)
  subjectId!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  validFrom?: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  validTo?: string | null;

  @ApiProperty({ minLength: UI_REASON_MIN, maxLength: UI_REASON_MAX })
  @Transform(trimmed)
  @IsString()
  @MinLength(UI_REASON_MIN)
  @MaxLength(UI_REASON_MAX)
  reason!: string;
}

export class UpdateRuleDto {
  @ApiPropertyOptional({ enum: UI_RULE_EFFECTS })
  @IsOptional()
  @IsIn(UI_RULE_EFFECTS)
  effect?: UiRuleEffect;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  validFrom?: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  validTo?: string | null;

  @ApiPropertyOptional({ minLength: UI_REASON_MIN, maxLength: UI_REASON_MAX })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(UI_REASON_MIN)
  @MaxLength(UI_REASON_MAX)
  reason?: string;
}

export class PreviewQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: '«Ver como» este usuario',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: '«Ver como» este rol',
    maxLength: UI_SUBJECT_ID_MAX,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(UI_SUBJECT_ID_MAX)
  roleCode?: string;
}

export class UuidParamDto {
  @IsUUID()
  id!: string;
}
