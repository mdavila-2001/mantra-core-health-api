import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EVIDENCE_KINDS,
  IMPACT_MAX_DEPTH,
  MISSING_FILTERS,
  OBJECT_KINDS,
  OBSERVATION_STATUSES,
  REVIEW_STATUSES,
  SENSITIVITIES,
  type EvidenceKind,
  type MissingFilter,
  type ObjectKind,
  type ObservationStatus,
  type ReviewStatus,
  type Sensitivity,
} from '../catalog/catalog.constants';
import { PaginacionQueryDto } from './portal-query.dto';

const recortar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ObjectIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

export class ColumnIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

export class AnnotationIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

/** Filtros del listado de objetos del catálogo. */
export class CatalogObjectsQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  schema?: string;

  @ApiPropertyOptional({ enum: OBJECT_KINDS })
  @IsOptional()
  @IsIn(OBJECT_KINDS)
  kind?: ObjectKind;

  @ApiPropertyOptional({ enum: OBSERVATION_STATUSES })
  @IsOptional()
  @IsIn(OBSERVATION_STATUSES)
  observationStatus?: ObservationStatus;

  @ApiPropertyOptional({
    enum: [...REVIEW_STATUSES, 'NONE'],
    description: '`NONE`: objetos sin ficha',
  })
  @IsOptional()
  @IsIn([...REVIEW_STATUSES, 'NONE'])
  reviewStatus?: ReviewStatus | 'NONE';

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Busca en `schema.objeto` y en el nombre de negocio',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({
    enum: MISSING_FILTERS,
    description: 'Sólo los objetos a los que les falta ese dato de la ficha',
  })
  @IsOptional()
  @IsIn(MISSING_FILTERS)
  missing?: MissingFilter;
}

/** Cursor y límite de los listados que ordenan por fecha (cambios, escaneos). */
export class CursorQueryDto extends PaginacionQueryDto {}

export class ImpactQueryDto {
  @ApiPropertyOptional({
    enum: ['downstream', 'upstream', 'both'],
    default: 'both',
    description:
      '`downstream`: quién referencia al objeto; `upstream`: a quién referencia',
  })
  @IsOptional()
  @IsIn(['downstream', 'upstream', 'both'])
  direction?: 'downstream' | 'upstream' | 'both';

  @ApiPropertyOptional({ minimum: 1, maximum: IMPACT_MAX_DEPTH, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(IMPACT_MAX_DEPTH)
  depth?: number;
}

export class CoverageQueryDto {
  @ApiPropertyOptional({ description: 'Limita la cobertura a un schema' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  schema?: string;
}

export class OpenQuestionDto {
  @ApiPropertyOptional({
    description: 'Campo de la ficha sobre el que es la pregunta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  field?: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  owner?: string;

  @ApiPropertyOptional({ description: 'Fecha ISO 8601' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}

const TEXTO = 4000;

/**
 * Edición de la ficha de un objeto. Todo es opcional salvo `expectedVersion`: lo que no viene se
 * conserva y `null` borra. `expectedVersion` 0 crea la ficha.
 */
export class AnnotationPatchDto {
  @ApiProperty({
    minimum: 0,
    description:
      'Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409',
  })
  @IsInt()
  @Min(0)
  expectedVersion!: number;

  @ApiPropertyOptional({
    description:
      'Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas)',
  })
  @IsOptional()
  @IsBoolean()
  submit?: boolean;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  definition?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  purpose?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  existenceRationale?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  rowGrain?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  alternativesRationale?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  deletionImpact?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessOwner?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  dataSteward?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  technicalOwner?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  valueDomain?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: TEXTO })
  @IsOptional()
  @IsString()
  @MaxLength(TEXTO)
  nullSemantics?: string | null;

  @ApiPropertyOptional({ enum: SENSITIVITIES })
  @IsOptional()
  @IsIn(SENSITIVITIES)
  sensitivity?: Sensitivity;

  @ApiPropertyOptional({ type: [String], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  consumers?: string[];

  @ApiPropertyOptional({ type: [OpenQuestionDto], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OpenQuestionDto)
  openQuestions?: OpenQuestionDto[];
}

export class EvidenceInputDto {
  @ApiProperty({ enum: EVIDENCE_KINDS })
  @IsIn(EVIDENCE_KINDS)
  kind!: EvidenceKind;

  @ApiProperty({
    minLength: 3,
    maxLength: 2000,
    description: 'Dónde está la evidencia: ruta, enlace, identificador',
  })
  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reference!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string;

  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Revisión del documento o commit de donde se tomó',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceRevision?: string;
}

export class ReviewInputDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiProperty({
    minimum: 1,
    description:
      'Revisión que se revisó (`currentRevisionNo`); si hay una más reciente, 409',
  })
  @IsInt()
  @Min(1)
  expectedRevisionNo!: number;

  @ApiPropertyOptional({
    maxLength: 2000,
    description: 'Obligatorio, de al menos 10 caracteres, al rechazar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

/** Corrida de la clasificación automática: por omisión, todas las columnas observadas. */
export class ClassificationRunDto {
  @ApiPropertyOptional({ description: 'Limita la corrida a un schema' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  schema?: string;
}
