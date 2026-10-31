import { ApiProperty } from '@nestjs/swagger';
import {
  TOOL_CHECK_TYPES,
  TOOL_KINDS,
  TOOL_STATUSES,
  type ToolCheckType,
  type ToolKind,
  type ToolStatus,
} from '../tools/tool-catalog';
import type { RunOutcome, ToolHealthState } from '../tools/tool-health';

const HEALTH_STATES = ['OK', 'FAIL', 'NOT_PROBED'] as const;
const RUN_OUTCOMES = ['PASS', 'WARN', 'FAIL', 'TIMEOUT', 'ERROR'] as const;

/** Salud de una herramienta: nunca `OK` por defecto, nunca valores de variables. */
export class ToolHealthDto {
  @ApiProperty({ enum: HEALTH_STATES })
  state!: ToolHealthState;

  @ApiProperty({ enum: TOOL_CHECK_TYPES })
  checkType!: ToolCheckType;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  observedAt!: string | null;

  @ApiProperty({
    type: [String],
    description: 'Solo NOMBRES de las variables de entorno ausentes.',
  })
  missingEnvVars!: string[];
}

/** Herramienta del catálogo con su salud. */
export class ToolItemDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: TOOL_KINDS })
  kind!: ToolKind;

  @ApiProperty()
  isCritical!: boolean;

  @ApiProperty({ enum: TOOL_STATUSES })
  status!: ToolStatus;

  @ApiProperty({ type: [String], description: 'Solo nombres, nunca valores.' })
  requiredEnvVars!: string[];

  @ApiProperty({ type: ToolHealthDto })
  health!: ToolHealthDto;
}

/** Lo que nadie midió, con el motivo. */
export class ToolNotMeasuredDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  reason!: string;
}

/** `GET /admin/ops/tools`. */
export class ToolListResponseDto {
  @ApiProperty({ format: 'date-time' })
  evaluatedAt!: string;

  @ApiProperty({ type: [ToolItemDto] })
  items!: ToolItemDto[];

  @ApiProperty({ type: [ToolNotMeasuredDto] })
  notMeasured!: ToolNotMeasuredDto[];
}

/** Una comprobación registrada en `health_check_runs`. */
export class ToolCheckRunDto {
  @ApiProperty({ format: 'date-time' })
  observedAt!: string;

  @ApiProperty({ enum: RUN_OUTCOMES })
  outcome!: RunOutcome;

  @ApiProperty({ type: Number, nullable: true })
  latencyMs!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  httpStatus!: number | null;
}

/** `GET /admin/ops/tools/:code`: el ítem más su historial corto (últimas 20). */
export class ToolDetailResponseDto extends ToolItemDto {
  @ApiProperty({ format: 'date-time' })
  evaluatedAt!: string;

  @ApiProperty({ type: [ToolCheckRunDto] })
  history!: ToolCheckRunDto[];
}
