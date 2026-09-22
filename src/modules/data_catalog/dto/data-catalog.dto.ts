import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  COLUMN_ONLY_FIELDS,
  COMMON_FIELDS,
  EVIDENCE_KINDS,
  OBJECT_KINDS,
  OBJECT_ONLY_FIELDS,
  OBSERVATION_STATUSES,
  REVIEW_DECISIONS,
  REVIEW_STATUSES,
  SENSITIVITIES,
  type AnnotationField,
  type EvidenceKind,
  type ReviewDecision,
  type Sensitivity,
} from '../domain';

const ANNOTATION_FIELDS = [
  ...COMMON_FIELDS,
  ...OBJECT_ONLY_FIELDS,
  ...COLUMN_ONLY_FIELDS,
] as const;

/** Tope de un campo narrativo: una justificación, no un documento. */
const NARRATIVE_MAX = 4000;

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export class CursorQueryDto {
  @ApiPropertyOptional({ description: 'Cursor opaco devuelto como nextCursor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export const MISSING_FILTERS = [
  'purpose',
  'existenceRationale',
  'rowGrain',
  'businessOwner',
] as const;

export class ListObjectsQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({ maxLength: 63 })
  @IsOptional()
  @IsString()
  @MaxLength(63)
  schema?: string;

  @ApiPropertyOptional({ enum: OBJECT_KINDS })
  @IsOptional()
  @IsIn(OBJECT_KINDS)
  kind?: string;

  @ApiPropertyOptional({ enum: OBSERVATION_STATUSES })
  @IsOptional()
  @IsIn(OBSERVATION_STATUSES)
  observationStatus?: string;

  @ApiPropertyOptional({
    enum: [...REVIEW_STATUSES, 'NONE'],
    description: 'NONE = sin ficha',
  })
  @IsOptional()
  @IsIn([...REVIEW_STATUSES, 'NONE'])
  reviewStatus?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Nombre técnico o de negocio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: MISSING_FILTERS })
  @IsOptional()
  @IsIn(MISSING_FILTERS)
  missing?: (typeof MISSING_FILTERS)[number];
}

export class CoverageQueryDto {
  @ApiPropertyOptional({ maxLength: 63 })
  @IsOptional()
  @IsString()
  @MaxLength(63)
  schema?: string;
}

export class ImpactQueryDto {
  @ApiPropertyOptional({
    enum: ['downstream', 'upstream', 'both'],
    default: 'both',
  })
  @IsOptional()
  @IsIn(['downstream', 'upstream', 'both'])
  direction?: 'downstream' | 'upstream' | 'both';

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  depth?: number;
}

// ---------------------------------------------------------------------------
// Ficha
// ---------------------------------------------------------------------------

export class OpenQuestionDto {
  @ApiPropertyOptional({
    enum: ANNOTATION_FIELDS,
    description: 'Campo que queda sin responder',
  })
  @IsOptional()
  @IsIn(ANNOTATION_FIELDS)
  field?: AnnotationField;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  question!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  owner?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;
}

/**
 * Edición de una ficha. Todos los campos son opcionales: se envía lo que
 * cambia; `null` borra un valor. `expectedVersion` es obligatorio (0 para
 * crear la ficha) y protege contra el segundo escritor.
 */
export class UpsertAnnotationDto {
  @ApiProperty({
    minimum: 0,
    description: 'rowVersion leída; 0 si la ficha no existe',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @ApiPropertyOptional({
    default: false,
    description: 'true envía a revisión (NEEDS_REVIEW); false guarda borrador',
  })
  @IsOptional()
  @IsBoolean()
  submit?: boolean;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;

  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string | null;

  @ApiPropertyOptional({ maxLength: NARRATIVE_MAX, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  definition?: string | null;

  @ApiPropertyOptional({ maxLength: NARRATIVE_MAX, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  purpose?: string | null;

  @ApiPropertyOptional({
    maxLength: NARRATIVE_MAX,
    nullable: true,
    description: 'Por qué hace falta persistencia propia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  existenceRationale?: string | null;

  @ApiPropertyOptional({
    maxLength: NARRATIVE_MAX,
    nullable: true,
    description: 'Qué representa una fila (sólo tablas)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  rowGrain?: string | null;

  @ApiPropertyOptional({ maxLength: NARRATIVE_MAX, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  alternativesRationale?: string | null;

  @ApiPropertyOptional({ maxLength: NARRATIVE_MAX, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  processSupported?: string | null;

  @ApiPropertyOptional({ maxLength: NARRATIVE_MAX, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  sourceOfTruth?: string | null;

  @ApiPropertyOptional({ type: [String], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  producers?: string[];

  @ApiPropertyOptional({ type: [String], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  consumers?: string[];

  @ApiPropertyOptional({ maxLength: NARRATIVE_MAX, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  deletionImpact?: string | null;

  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessOwner?: string | null;

  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  dataSteward?: string | null;

  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  technicalOwner?: string | null;

  @ApiPropertyOptional({
    maxLength: 50,
    nullable: true,
    description: 'Sólo columnas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string | null;

  @ApiPropertyOptional({
    maxLength: NARRATIVE_MAX,
    nullable: true,
    description: 'Sólo columnas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  valueDomain?: string | null;

  @ApiPropertyOptional({
    maxLength: NARRATIVE_MAX,
    nullable: true,
    description: 'Sólo columnas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(NARRATIVE_MAX)
  nullSemantics?: string | null;

  @ApiPropertyOptional({ enum: SENSITIVITIES })
  @IsOptional()
  @IsIn(SENSITIVITIES)
  sensitivity?: Sensitivity;

  @ApiPropertyOptional({ type: [OpenQuestionDto], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OpenQuestionDto)
  openQuestions?: OpenQuestionDto[];
}

export class ReviewAnnotationDto {
  @ApiProperty({ enum: REVIEW_DECISIONS })
  @IsIn(REVIEW_DECISIONS)
  decision!: ReviewDecision;

  @ApiProperty({ minimum: 1, description: 'Revisión que se está decidiendo' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedRevisionNo!: number;

  @ApiPropertyOptional({
    maxLength: 2000,
    description: 'Obligatorio al rechazar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class AddEvidenceDto {
  @ApiProperty({ enum: EVIDENCE_KINDS })
  @IsIn(EVIDENCE_KINDS)
  kind!: EvidenceKind;

  @ApiProperty({
    maxLength: 1000,
    description: 'Ruta, URL o identificador verificable. Nunca un secreto.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reference!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Commit o hash de la fuente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceRevision?: string;
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

export class ScanAcceptedDto {
  @ApiProperty() scanId!: string;
  @ApiProperty({
    enum: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
  })
  status!: string;
  @ApiProperty() acceptedAt!: string;
  @ApiProperty({ description: 'Ruta relativa para consultar el estado' })
  statusUrl!: string;
  @ApiProperty({
    description:
      'false si la clave de idempotencia devolvió una corrida existente',
  })
  created!: boolean;
}

export class ScanViewDto {
  @ApiProperty() id!: string;
  @ApiProperty() sourceCode!: string;
  @ApiProperty() mode!: string;
  @ApiProperty() status!: string;
  @ApiProperty() requestedAt!: string;
  @ApiPropertyOptional({ nullable: true }) requestedByUserId!: string | null;
  @ApiPropertyOptional({ nullable: true }) startedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) finishedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) cancelRequestedAt!: string | null;
  @ApiProperty() attempt!: number;
  @ApiProperty() connectorVersion!: string;
  @ApiPropertyOptional({ nullable: true }) engineVersion!: string | null;
  @ApiPropertyOptional({ nullable: true }) snapshotHash!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'null mientras no termina',
  })
  counters!: Record<string, number> | null;
  @ApiProperty({ type: [String] }) excludedSchemas!: string[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  limitations!: unknown[];
  @ApiPropertyOptional({ nullable: true }) error!: {
    code: string;
    message: string;
  } | null;
}

export class RunNextResultDto {
  @ApiProperty() claimed!: number;
  @ApiPropertyOptional() scanId?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() fenced?: boolean;
}

export class PageDto<T> {
  items!: T[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}
