import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  REVIEW_STATUSES,
  SENSITIVITIES,
  type ReviewStatus,
  type Sensitivity,
} from '../../domain/catalog/catalog.constants';
import {
  PII_MIN_SENSITIVITIES,
  PII_RECONCILIATION_KINDS,
  type PiiReconciliationKind,
  PII_SORTS,
  QUALITY_RULE_CODES,
  QUALITY_SEVERITIES,
  type PiiSort,
  type QualitySeverity,
} from '../../domain/catalog/governance-insights';
import { PaginacionQueryDto } from './portal-query.dto';

const recortar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Un schema de PostgreSQL: letras, dígitos y guion bajo. */
const SCHEMA = /^[A-Za-z0-9_]{1,63}$/;

// ---- datos personales ----------------------------------------------------------------------

/** Filtros de `GET /admin/catalog/pii/columns`. */
export class PiiColumnsQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @Matches(SCHEMA)
  schema?: string;

  @ApiPropertyOptional({
    enum: PII_MIN_SENSITIVITIES,
    default: 'PERSONAL',
    description:
      'Nivel mínimo de sensibilidad (escala de menos a más sensible). Por omisión `PERSONAL`; `PSEUDONYMIZED` incluye lo seudonimizado',
  })
  @IsOptional()
  @IsIn(PII_MIN_SENSITIVITIES)
  minSensitivity?: Sensitivity;

  @ApiPropertyOptional({
    enum: SENSITIVITIES,
    description: 'Un nivel exacto (se combina con `minSensitivity`)',
  })
  @IsOptional()
  @IsIn(SENSITIVITIES)
  sensitivity?: Sensitivity;

  @ApiPropertyOptional({ enum: REVIEW_STATUSES })
  @IsOptional()
  @IsIn(REVIEW_STATUSES)
  reviewStatus?: ReviewStatus;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Busca en `schema.objeto.columna`, sin mayúsculas',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({
    enum: PII_SORTS,
    default: 'name',
    description:
      '`name`: schema, objeto, columna. `sensitivity`: de más a menos sensible, luego por nombre',
  })
  @IsOptional()
  @IsIn(PII_SORTS)
  sort?: PiiSort;
}

/** Filtros de `GET /admin/catalog/pii/reconciliation`. */
export class PiiReconciliationQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    enum: PII_RECONCILIATION_KINDS,
    description:
      '`MISSING_IN_REGISTRY`: personal aprobada sin declarar. `REGISTRY_DISAGREES`: declarada sin marca PII/PHI. `ORPHAN_IN_REGISTRY`: declarada pero no observada',
  })
  @IsOptional()
  @IsIn(PII_RECONCILIATION_KINDS)
  kind?: PiiReconciliationKind;

  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @Matches(SCHEMA)
  schema?: string;
}

export class PiiColumnDto {
  @ApiProperty({ format: 'uuid' }) columnId!: string;
  @ApiProperty({ format: 'uuid' }) objectId!: string;
  @ApiProperty() schemaName!: string;
  @ApiProperty() objectName!: string;
  @ApiProperty() columnName!: string;
  @ApiProperty() nativeType!: string;
  @ApiProperty({ enum: SENSITIVITIES }) sensitivity!: string;
  @ApiProperty({ enum: REVIEW_STATUSES }) reviewStatus!: string;
  @ApiProperty({ enum: ['MANUAL', 'AUTO_CLASSIFIER'] }) origin!: string;
  @ApiProperty({
    description: 'La ficha está aprobada con su revisión vigente',
  })
  approved!: boolean;
  @ApiProperty({
    nullable: true,
    type: Boolean,
    description:
      '`system_ops.field_registry` marca la columna como PII/PHI (`true`/`false`); `null` si el registro no la declara',
  })
  registryMarksPersonal!: boolean | null;
}

export class PiiColumnsPageDto {
  @ApiProperty({ type: [PiiColumnDto] }) items!: PiiColumnDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ enum: PII_SORTS }) sort!: string;
}

export class PiiLevelDto {
  @ApiProperty({ enum: SENSITIVITIES }) sensitivity!: string;
  @ApiProperty() columns!: number;
  @ApiProperty() approved!: number;
  @ApiProperty() needsReview!: number;
  @ApiProperty() autoDetected!: number;
  @ApiProperty({ description: 'Borrador, rechazada u otro estado sin aprobar' })
  other!: number;
}

export class NotMeasuredDto {
  @ApiProperty() field!: string;
  @ApiProperty() reason!: string;
}

export class PiiRegistryDto {
  @ApiProperty() entities!: number;
  @ApiProperty() entitiesPersonal!: number;
  @ApiProperty() fields!: number;
  @ApiProperty() fieldsPersonal!: number;
}

export class PiiSummaryDto {
  @ApiProperty({ description: 'De dónde sale cada cifra' }) source!: string;
  @ApiProperty() observedColumns!: number;
  @ApiProperty({
    description: 'Columnas con una sensibilidad distinta de UNKNOWN',
  })
  classifiedColumns!: number;
  @ApiProperty({ description: 'Columnas de nivel PERSONAL o superior' })
  personalColumns!: number;
  @ApiProperty() objectsWithPersonalColumns!: number;
  @ApiProperty({ type: [PiiLevelDto] }) bySensitivity!: PiiLevelDto[];
  @ApiProperty({ type: PiiRegistryDto }) declaredRegistry!: PiiRegistryDto;
  @ApiProperty({ type: [NotMeasuredDto] }) notMeasured!: NotMeasuredDto[];
}

// ---- calidad del catálogo ------------------------------------------------------------------

/** Filtros de `GET /admin/catalog/quality/issues`. */
export class QualityIssuesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ enum: QUALITY_RULE_CODES })
  @IsOptional()
  @IsIn(QUALITY_RULE_CODES)
  rule?: string;

  @ApiPropertyOptional({ enum: QUALITY_SEVERITIES })
  @IsOptional()
  @IsIn(QUALITY_SEVERITIES)
  severity?: QualitySeverity;

  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @Matches(SCHEMA)
  schema?: string;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Busca en `schema.objeto.columna`, sin mayúsculas',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class QualityRuleDto {
  @ApiProperty({ example: 'CAT-PII-UNREVIEWED' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: QUALITY_SEVERITIES }) severity!: string;
  @ApiProperty({ enum: ['COLUMN', 'OBJECT'] }) target!: string;
  @ApiProperty() resolution!: string;
  @ApiProperty({ description: 'Incidencias abiertas ahora de esta regla' })
  openIssues!: number;
}

export class QualityRulesDto {
  @ApiProperty({ type: [QualityRuleDto] }) rules!: QualityRuleDto[];
  @ApiProperty({ type: [NotMeasuredDto] }) notMeasured!: NotMeasuredDto[];
}

export class QualityIssueDto {
  @ApiProperty() ruleCode!: string;
  @ApiProperty({ enum: QUALITY_SEVERITIES }) severity!: string;
  @ApiProperty() schemaName!: string;
  @ApiProperty() objectName!: string;
  @ApiPropertyOptional({ nullable: true }) columnName!: string | null;
  @ApiProperty({ format: 'uuid' }) objectId!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) columnId!:
    string | null;
  @ApiPropertyOptional({ nullable: true, enum: SENSITIVITIES })
  sensitivity!: string | null;
  @ApiPropertyOptional({ nullable: true, enum: REVIEW_STATUSES })
  reviewStatus!: string | null;
  @ApiProperty({
    description: 'Columnas afectadas (0 en las reglas de objeto sin columnas)',
  })
  affected!: number;
}

export class QualitySummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty({ description: 'Incidencias por severidad' })
  bySeverity!: Record<string, number>;
  @ApiProperty({ description: 'Incidencias por código de regla' })
  byRule!: Record<string, number>;
}

export class QualityIssuesPageDto {
  @ApiProperty({ type: [QualityIssueDto] }) items!: QualityIssueDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ type: QualitySummaryDto }) summary!: QualitySummaryDto;
  @ApiProperty({
    description:
      'Las incidencias se derivan al leer: no tienen estado propio ni acción de cierre; desaparecen al corregir la ficha',
  })
  derived!: true;
  @ApiProperty({ type: [NotMeasuredDto] }) notMeasured!: NotMeasuredDto[];
}
