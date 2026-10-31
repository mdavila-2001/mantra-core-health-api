import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { GovernancePageQueryDto } from '../../dto/governance-read.dto';
import {
  DISPOSITIONS,
  EVIDENCE_LEVELS,
  LEGAL_HOLD_STATES,
  WRITE_MODES,
  type Disposition,
  type EvidenceLevel,
  type LegalHoldState,
  type MutabilityEvidence,
  type MutabilityFinding,
  type WriteMode,
} from '../mutability.types';

const sinEspacios = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Filtro por hallazgo: tipo, ninguno, cualquiera o un código concreto. */
export const FINDING_FILTERS = ['ANY', 'NONE', 'CONTRADICTION', 'GAP'] as const;
export type FindingFilter = (typeof FINDING_FILTERS)[number];

/** Filtros de `GET /admin/governance/mutability`. */
export class ListMutabilityQueryDto extends GovernancePageQueryDto {
  /** Schema de la tabla. */
  @ApiPropertyOptional({ maxLength: 63 })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  @MaxLength(63)
  schema?: string;

  /** Modo de escritura. */
  @ApiPropertyOptional({ enum: WRITE_MODES })
  @IsOptional()
  @IsIn(WRITE_MODES)
  writeMode?: WriteMode;

  /** Nivel de evidencia del modo de escritura. */
  @ApiPropertyOptional({ enum: EVIDENCE_LEVELS })
  @IsOptional()
  @IsIn(EVIDENCE_LEVELS)
  evidence?: EvidenceLevel;

  /** Hallazgos: `ANY`, `NONE`, `CONTRADICTION` o `GAP`. */
  @ApiPropertyOptional({ enum: FINDING_FILTERS })
  @IsOptional()
  @IsIn(FINDING_FILTERS)
  finding?: FindingFilter;

  /** Disposición al vencer la retención. */
  @ApiPropertyOptional({ enum: DISPOSITIONS })
  @IsOptional()
  @IsIn(DISPOSITIONS)
  disposition?: Disposition;

  /** Estado frente al legal hold. */
  @ApiPropertyOptional({ enum: LEGAL_HOLD_STATES })
  @IsOptional()
  @IsIn(LEGAL_HOLD_STATES)
  legalHold?: LegalHoldState;

  /** Base de datos: la principal o las `pay_*`. */
  @ApiPropertyOptional({ enum: ['main', 'pay'] })
  @IsOptional()
  @IsIn(['main', 'pay'])
  database?: 'main' | 'pay';

  /** Busca (sin tildes ni mayúsculas) en schema y tabla. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;
}

/** Retención declarada, con lo que falta para que sea una política vigente. */
export class MutabilityRetentionDto {
  @ApiProperty({ nullable: true, type: Number })
  days!: number | null;
  @ApiProperty({ nullable: true, type: String })
  source!: string | null;
  @ApiProperty({ enum: ['PENDIENTE_DE_CUMPLIMIENTO'] })
  status!: 'PENDIENTE_DE_CUMPLIMIENTO';
}

/** Fila del listado. */
export class MutabilityItemDto {
  @ApiProperty() schema!: string;
  @ApiProperty() table!: string;
  @ApiProperty({ enum: ['main', 'pay'] }) database!: 'main' | 'pay';
  @ApiProperty({ enum: WRITE_MODES }) writeMode!: WriteMode;
  @ApiProperty({ enum: EVIDENCE_LEVELS }) writeModeLevel!: EvidenceLevel;
  @ApiProperty({ enum: DISPOSITIONS }) disposition!: Disposition;
  @ApiProperty({ enum: EVIDENCE_LEVELS }) dispositionLevel!: EvidenceLevel;
  @ApiProperty({ type: MutabilityRetentionDto, nullable: true })
  retention!: MutabilityRetentionDto | null;
  @ApiProperty({ enum: LEGAL_HOLD_STATES }) legalHold!: LegalHoldState;
  @ApiProperty({ enum: EVIDENCE_LEVELS }) legalHoldLevel!: EvidenceLevel;
  @ApiProperty({ description: 'Contradicciones registradas (no resueltas)' })
  contradictions!: number;
  @ApiProperty({ description: 'Brechas: declarado sin imponer' }) gaps!: number;
  @ApiProperty({
    nullable: true,
    type: Boolean,
    description:
      '¿Está en system_ops.entity_registry? `null` si no se pudo consultar',
  })
  registered!: boolean | null;
}

/** Cuenta con numerador y denominador (nunca un porcentaje suelto). */
export class MutabilityRatioDto {
  @ApiProperty() numerator!: number;
  @ApiProperty() denominator!: number;
}

export class MutabilityModeCountDto extends MutabilityRatioDto {
  @ApiProperty({ enum: WRITE_MODES }) writeMode!: WriteMode;
  /** Cuántas de ellas con cada nivel de evidencia. */
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byEvidence!: Record<string, number>;
}

export class MutabilityLevelCountDto extends MutabilityRatioDto {
  @ApiProperty({ enum: EVIDENCE_LEVELS }) level!: EvidenceLevel;
}

export class MutabilityFindingCodeDto {
  @ApiProperty() code!: string;
  @ApiProperty({ enum: ['CONTRADICTION', 'GAP'] }) kind!:
    'CONTRADICTION' | 'GAP';
  @ApiProperty({ description: 'Hallazgos con ese código' }) findings!: number;
  @ApiProperty({ description: 'Tablas afectadas' }) tables!: number;
}

/** Resumen global de mutabilidad. */
export class MutabilitySummaryDto {
  @ApiProperty() totalTables!: number;
  @ApiProperty({ type: [MutabilityModeCountDto] })
  byWriteMode!: MutabilityModeCountDto[];
  @ApiProperty({ type: [MutabilityLevelCountDto] })
  byEvidence!: MutabilityLevelCountDto[];
  @ApiProperty({
    type: MutabilityRatioDto,
    description: 'Tablas con modo distinto de UNKNOWN',
  })
  decided!: MutabilityRatioDto;
  @ApiProperty({
    type: MutabilityRatioDto,
    description: 'Tablas con el modo impuesto por la base de datos',
  })
  enforcedByDatabase!: MutabilityRatioDto;
  @ApiProperty({ type: MutabilityRatioDto })
  withContradictions!: MutabilityRatioDto;
  @ApiProperty({ type: MutabilityRatioDto }) withGaps!: MutabilityRatioDto;
  @ApiProperty({ type: [MutabilityFindingCodeDto] })
  findingCodes!: MutabilityFindingCodeDto[];
  @ApiProperty({ type: [MutabilityRatioDto] })
  disposition!: (MutabilityRatioDto & { disposition: Disposition })[];
  @ApiProperty({ type: [MutabilityRatioDto] })
  legalHold!: (MutabilityRatioDto & { legalHold: LegalHoldState })[];
  @ApiProperty({ description: 'Tablas con plazo declarado por una fuente' })
  withDeclaredPeriod!: number;
  @ApiProperty({
    description: 'Tablas con retención aún PENDIENTE_DE_CUMPLIMIENTO',
  })
  pendingCompliance!: number;
  @ApiProperty({ type: MutabilityRatioDto, nullable: true })
  registered!: MutabilityRatioDto | null;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  sources!: Record<string, number>;
  @ApiProperty({ description: 'Desde qué fuentes se generó el catálogo' })
  generatedFrom!: { modelRoot: string; inventoryRoot: string; note: string };
}

/** Página del listado. */
export class MutabilityPageDto {
  @ApiProperty({ type: [MutabilityItemDto] }) items!: MutabilityItemDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}

/** Detalle de una tabla: todo lo anterior más la evidencia y los hallazgos con ambas caras. */
export class MutabilityDetailDto extends MutabilityItemDto {
  @ApiProperty({ description: 'Toda la evidencia, con su fuente exacta' })
  evidence!: MutabilityEvidence[];
  @ApiProperty({ description: 'Contradicciones (no resueltas) y brechas' })
  findings!: MutabilityFinding[];
}
