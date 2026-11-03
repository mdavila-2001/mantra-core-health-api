import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FIT_CHECK_STATUSES,
  FIT_DIMENSIONS,
  FIT_SEVERITIES,
  FIT_VERDICTS,
} from '../../application/fit/fit.types';

const RUN_STATUSES = ['EN_CURSO', 'COMPLETADA', 'FALLIDA'] as const;
const RUN_TRIGGERS = ['TICK', 'MANUAL'] as const;

export class FitFindingDto {
  @ApiProperty({
    description: 'Qué está desajustado: una ruta, una tabla, una columna',
  })
  subject!: string;
  @ApiProperty() detail!: string;
}

export class FitCheckResultDto {
  @ApiProperty({
    example: 'FIT-RUT-001',
    description: 'Id estable: no se reutiliza ni se renombra',
  })
  id!: string;
  @ApiProperty({ enum: FIT_DIMENSIONS }) dimension!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: FIT_SEVERITIES, description: 'Severidad si FALLA' })
  severity!: string;
  @ApiProperty({
    enum: FIT_CHECK_STATUSES,
    description:
      '`SIN_DATO` y `NO_DECLARADO` no son `OK`: no se pudo comprobar o aún no hay dónde declararlo',
  })
  status!: string;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Ítems que cumplen; `null` si no se midió (nunca 0)',
  })
  covered!: number | null;
  @ApiProperty({ type: Number, nullable: true }) denominator!: number | null;
  @ApiProperty() summary!: string;
  @ApiProperty({ type: String, nullable: true }) reason!: string | null;
  @ApiProperty({ description: 'Cómo corregirlo' }) remediation!: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  evidence!: Record<string, string | number | boolean | null>;
  @ApiProperty({ type: [FitFindingDto] }) findings!: FitFindingDto[];
  @ApiProperty({
    description: 'Total real de hallazgos; `findings` se recorta',
  })
  findingsTotal!: number;
  @ApiProperty() findingsTruncated!: boolean;
}

export class FitDimensionScoreDto {
  @ApiProperty({ enum: FIT_DIMENSIONS }) dimension!: string;
  @ApiProperty({ enum: ['MEDIDA', 'SIN_DATO', 'NO_DECLARADO', 'NO_APLICA'] })
  status!: string;
  @ApiProperty({ type: Number, nullable: true }) covered!: number | null;
  @ApiProperty({ type: Number, nullable: true }) denominator!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      '`covered / denominator`; `null` sin base. Nunca un 0 % ni un 100 % inventado',
  })
  ratio!: number | null;
  @ApiProperty() checksMeasured!: number;
  @ApiProperty({
    description: 'Comprobaciones sin dato o sin dónde declararse',
  })
  checksUnmeasured!: number;
  @ApiProperty() checksFailed!: number;
}

export class FitFingerprintsDto {
  @ApiProperty({ type: String, nullable: true }) routesInCode!: string | null;
  @ApiProperty({ type: String, nullable: true }) routesInInventory!:
    string | null;
  @ApiProperty({ type: String, nullable: true }) routesImported!: string | null;
}

export class FitDeploymentDto {
  @ApiProperty() commit!: string;
  @ApiProperty() builtAt!: string;
}

export class FitThresholdsDto {
  @ApiProperty({
    description: 'Un escaneo exitoso más viejo que esto se declara vencido',
  })
  scanStaleAfterMs!: number;
}

export class FitReportDto {
  @ApiProperty({ example: 'catalog-fit/v1' }) modelVersion!: string;
  @ApiProperty({ type: String, format: 'date-time' }) evaluatedAt!: string;
  @ApiProperty({ enum: FIT_VERDICTS }) verdict!: string;
  @ApiProperty({ type: [FitDimensionScoreDto] })
  dimensions!: FitDimensionScoreDto[];
  @ApiProperty({ type: [FitCheckResultDto] }) checks!: FitCheckResultDto[];
  @ApiProperty({
    type: [String],
    description: 'Ids de las comprobaciones que no pudieron medir',
  })
  blindSpots!: string[];
  @ApiProperty({ type: FitFingerprintsDto }) fingerprints!: FitFingerprintsDto;
  @ApiProperty({ type: FitDeploymentDto }) deployment!: FitDeploymentDto;
  @ApiProperty({ type: FitThresholdsDto }) thresholds!: FitThresholdsDto;
}

export class FitRunViewDto {
  @ApiProperty({ format: 'uuid' }) runId!: string;
  @ApiProperty({ enum: RUN_STATUSES }) status!: string;
  @ApiProperty({ enum: RUN_TRIGGERS }) trigger!: string;
  @ApiProperty({ type: String, format: 'date-time' }) requestedAt!: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  finishedAt!: string | null;
  @ApiProperty({ type: Number, nullable: true }) durationMs!: number | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Clase del error si la corrida falló',
  })
  errorCode!: string | null;
}

export class FitHistoryDimensionDto {
  @ApiProperty({ enum: FIT_DIMENSIONS }) dimension!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: Number, nullable: true }) covered!: number | null;
  @ApiProperty({ type: Number, nullable: true }) denominator!: number | null;
  @ApiProperty({ type: Number, nullable: true }) ratio!: number | null;
}

export class FitHistoryEntryDto {
  @ApiProperty({ format: 'uuid' }) runId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) evaluatedAt!: string;
  @ApiProperty({ enum: RUN_TRIGGERS }) trigger!: string;
  @ApiProperty({ enum: FIT_VERDICTS }) verdict!: string;
  @ApiProperty({ type: [FitHistoryDimensionDto] })
  dimensions!: FitHistoryDimensionDto[];
  @ApiProperty({ type: [String] }) failedChecks!: string[];
  @ApiProperty({ type: [String] }) blindSpots!: string[];
}

export class FitPersistenceStatusDto {
  @ApiProperty({
    enum: ['GUARDADA', 'CLAVE_REPETIDA', 'NO_GUARDADA', 'SIN_INTENTO'],
    description:
      'Desenlace de la última escritura en data_catalog.catalog_fit_runs intentada por este proceso',
  })
  state!: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  runId!: string | null;
  @ApiProperty({ nullable: true, type: String }) at!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Clase del error, nunca el mensaje',
  })
  errorCode!: string | null;
}

export class FitRetentionDto {
  @ApiProperty({
    enum: ['BASE_DE_DATOS', 'MEMORIA_DEL_PROCESO'],
    description:
      '`BASE_DE_DATOS`: leído de data_catalog.catalog_fit_runs. `MEMORIA_DEL_PROCESO`: sin repositorio o con la base caída (ver `fallbackReason`)',
  })
  kind!: string;
  @ApiProperty({
    nullable: true,
    type: String,
    example: 'BD_NO_DISPONIBLE:Error',
  })
  fallbackReason!: string | null;
  @ApiProperty({ nullable: true, type: Number })
  storedForSeconds!: number | null;
  @ApiProperty({ type: FitPersistenceStatusDto })
  lastWrite!: FitPersistenceStatusDto;
  @ApiProperty() ttlSeconds!: number;
  @ApiProperty() historySize!: number;
  @ApiProperty() tickIntervalSeconds!: number;
  @ApiProperty({
    description: 'Pasado esto el resultado se sirve como ATRASADO',
  })
  staleAfterSeconds!: number;
  @ApiProperty() note!: string;
}

export class CatalogFitDto {
  @ApiProperty({ example: 'catalog-fit/v1' }) modelVersion!: string;
  @ApiProperty({
    enum: ['SIN_RESULTADO', 'VIGENTE', 'ATRASADO'],
    description: '`ATRASADO`: se sirve, pero es más viejo que el umbral (S7)',
  })
  state!: string;
  @ApiProperty({
    enum: ['NUNCA_EJECUTADA', 'EXPIRADO'],
    nullable: true,
    type: String,
  })
  noResultReason!: string | null;
  @ApiProperty({ type: Number, nullable: true }) ageSeconds!: number | null;
  @ApiProperty({ type: FitRunViewDto, nullable: true })
  running!: FitRunViewDto | null;
  @ApiProperty({ type: FitRunViewDto, nullable: true })
  lastRun!: FitRunViewDto | null;
  @ApiProperty({ type: FitRunViewDto, nullable: true })
  lastFailure!: FitRunViewDto | null;
  @ApiProperty({ type: FitReportDto, nullable: true })
  report!: FitReportDto | null;
  @ApiProperty({ type: [FitHistoryEntryDto] }) history!: FitHistoryEntryDto[];
  @ApiProperty({ type: FitRetentionDto }) retention!: FitRetentionDto;
}

export class FitRunAcceptedDto {
  @ApiProperty({ format: 'uuid' }) runId!: string;
  @ApiProperty({ enum: RUN_STATUSES }) status!: string;
  @ApiProperty({
    description:
      '`false` si la petición repetía una `Idempotency-Key` ya aceptada o se unió a la corrida en vuelo',
  })
  created!: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) acceptedAt!: string;
  @ApiProperty({ example: '/admin/catalog/fit' }) statusUrl!: string;
}

/** Respuesta de la corrida síncrona que pide el worker (`POST /internal/catalog/fit/run`). */
export class FitRunResultDto {
  @ApiProperty({ format: 'uuid' }) runId!: string;
  @ApiProperty({ enum: RUN_STATUSES }) status!: string;
  @ApiProperty() created!: boolean;
  @ApiPropertyOptional({ enum: FIT_VERDICTS }) verdict?: string;
  @ApiPropertyOptional({ description: 'Comprobaciones que fallaron' })
  failedChecks?: number;
  @ApiPropertyOptional({ description: 'Comprobaciones que no pudieron medir' })
  blindSpots?: number;
  @ApiPropertyOptional({ nullable: true, type: String }) errorCode?:
    string | null;
  @ApiPropertyOptional({
    description: 'Si el desenlace quedó en data_catalog.catalog_fit_runs',
  })
  persisted?: boolean;
}
