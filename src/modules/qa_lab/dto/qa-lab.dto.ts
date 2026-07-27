import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Método HTTP que ejercita el caso. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

// ---------------------------------------------------------------------------
// UC-36-01 · Entorno
// ---------------------------------------------------------------------------

/** Entorno contra el que se ejecutan las pruebas. */
export type EnvironmentKind = 'DEV' | 'STAGING' | 'PRODUCTION';

/** Cuerpo de `POST /qa/environments` (UC-36-01). */
export class CreateEnvironmentDto {
  @ApiProperty({ description: 'Código del entorno, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['DEV', 'STAGING', 'PRODUCTION'] })
  @IsIn(['DEV', 'STAGING', 'PRODUCTION'])
  environment!: EnvironmentKind;

  @ApiPropertyOptional({
    description: 'URL base contra la que apuntan los casos',
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Configuración del entorno' })
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    default: false,
    description:
      'Si es false, los payloads capturados se enmascaran: el entorno puede contener datos reales.',
  })
  @IsOptional()
  @IsBoolean()
  isProductionSafe?: boolean;
}

export class EnvironmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty()
  isProductionSafe!: boolean;
}

// ---------------------------------------------------------------------------
// UC-36-02 · Caso y aserciones
// ---------------------------------------------------------------------------

/** Naturaleza del caso. */
export type CaseType = 'HAPPY_PATH' | 'EDGE' | 'NEGATIVE';
const CASE_TYPES = ['HAPPY_PATH', 'EDGE', 'NEGATIVE'] as const;

/** Qué comprueba la aserción. */
export type AssertionType = 'STATUS_CODE' | 'JSON_PATH' | 'HEADER' | 'LATENCY';
const ASSERTION_TYPES = [
  'STATUS_CODE',
  'JSON_PATH',
  'HEADER',
  'LATENCY',
] as const;

/** Cómo se compara el valor. */
export type AssertionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'EXISTS'
  | 'LESS_THAN'
  | 'GREATER_THAN';
const ASSERTION_OPERATORS = [
  'EQUALS',
  'NOT_EQUALS',
  'CONTAINS',
  'EXISTS',
  'LESS_THAN',
  'GREATER_THAN',
] as const;

export class TestAssertionDto {
  @ApiProperty({ enum: ASSERTION_TYPES })
  @IsIn(ASSERTION_TYPES)
  assertionType!: AssertionType;

  @ApiPropertyOptional({
    description: 'Ruta dentro del cuerpo; obligatoria si el tipo es JSON_PATH',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  jsonPath?: string;

  @ApiPropertyOptional({ enum: ASSERTION_OPERATORS, default: 'EQUALS' })
  @IsOptional()
  @IsIn(ASSERTION_OPERATORS)
  operator?: AssertionOperator;

  @ApiPropertyOptional({
    description: 'Valor esperado; no aplica al operador EXISTS',
  })
  @IsOptional()
  @IsString()
  expectedValue?: string;

  @ApiPropertyOptional({ description: 'Tolerancia en comparaciones numéricas' })
  @IsOptional()
  @IsNumberString()
  tolerance?: string;
}

/** Cuerpo de `POST /qa/suites/{suiteId}/cases` (UC-36-02). */
export class CreateTestCaseDto {
  @ApiProperty({
    description: 'Código del caso, único en la suite',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ enum: CASE_TYPES })
  @IsOptional()
  @IsIn(CASE_TYPES)
  caseType?: CaseType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Endpoint del catálogo que se ejercita',
  })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  @ApiPropertyOptional({ enum: HTTP_METHODS })
  @IsOptional()
  @IsIn(HTTP_METHODS)
  httpMethod?: HttpMethod;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestPath?: string;

  @ApiPropertyOptional({ minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  expectedHttpStatus?: number;

  @ApiPropertyOptional({ description: 'Preparación previa al caso' })
  @IsOptional()
  @IsObject()
  setupJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Limpieza posterior al caso' })
  @IsOptional()
  @IsObject()
  teardownJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    default: false,
    description: 'Un caso crítico que falla tumba la corrida entera',
  })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiProperty({
    type: [TestAssertionDto],
    description: 'Aserciones del caso, al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TestAssertionDto)
  assertions!: TestAssertionDto[];
}

export class TestCaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid', description: 'El caso nace en borrador' })
  stateConceptId!: string;

  @ApiProperty()
  ordinal!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  assertionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-36-03 · Publicación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/suites/{suiteId}/publish` (UC-36-03). */
export class PublishSuiteDto {
  @ApiPropertyOptional({
    description: 'Qué cambió en esta versión de la suite',
  })
  @IsOptional()
  @IsString()
  changeNote?: string;
}

export class PublishSuiteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ description: 'Casos que pasaron de borrador a activos' })
  casesActivated!: number;
}

// ---------------------------------------------------------------------------
// UC-36-04 · Corrida
// ---------------------------------------------------------------------------

/** Qué disparó la corrida. */
export type RunTrigger =
  'MANUAL' | 'SCHEDULED' | 'CI_PUSH' | 'CI_PR' | 'WEBHOOK';
const RUN_TRIGGERS = [
  'MANUAL',
  'SCHEDULED',
  'CI_PUSH',
  'CI_PR',
  'WEBHOOK',
] as const;

/** Cuerpo de `POST /qa/runs` (UC-36-04). */
export class CreateRunDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  suiteId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  environmentId!: string;

  @ApiProperty({ enum: RUN_TRIGGERS })
  @IsIn(RUN_TRIGGERS)
  trigger!: RunTrigger;

  @ApiPropertyOptional({
    description: 'Referencia de git que se está probando',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gitRef?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Política ante corridas solapadas de la misma suite',
    enum: ['ALLOW', 'FORBID', 'QUEUE'],
    default: 'ALLOW',
  })
  @IsOptional()
  @IsIn(['ALLOW', 'FORBID', 'QUEUE'])
  concurrencyPolicy?: 'ALLOW' | 'FORBID' | 'QUEUE';
}

export class RunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Número secuencial de la corrida' })
  runNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Casos activos que la corrida ejercitará' })
  totalCases!: number;
}

// ---------------------------------------------------------------------------
// UC-36-05 · Ejecución del caso
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/runs/{runId}/cases/{caseId}/execute` (UC-36-05). */
export class ExecuteCaseDto {
  @ApiProperty({ description: 'Cuerpo de la petición tal como se envió' })
  @IsObject()
  requestBodyJson!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Cabeceras de la petición' })
  @IsOptional()
  @IsObject()
  requestHeadersJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'URL a la que se llamó' })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiProperty({ description: 'Cuerpo de la respuesta tal como llegó' })
  @IsObject()
  responseBodyJson!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Cabeceras de la respuesta' })
  @IsOptional()
  @IsObject()
  responseHeadersJson?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  @ApiPropertyOptional({
    description: 'Latencia de la llamada, en milisegundos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @ApiPropertyOptional({
    description: 'Error de transporte si la llamada no llegó a completarse',
  })
  @IsOptional()
  @IsString()
  errorText?: string;
}

export class ExecuteCaseResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Resultado del caso creado' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  requestPayloadId!: string;

  @ApiProperty({ format: 'uuid' })
  responsePayloadId!: string;

  @ApiProperty({
    description: 'Hash del cuerpo de la respuesta, para detectar manipulación',
  })
  responseBodyHash!: string;

  @ApiProperty({
    description:
      'true si el entorno no es seguro y los payloads se guardaron enmascarados',
  })
  masked!: boolean;
}

// ---------------------------------------------------------------------------
// UC-36-06 · Evaluación
// ---------------------------------------------------------------------------

export class EvaluateResultResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  assertionsTotal!: number;

  @ApiProperty()
  assertionsPassed!: number;

  @ApiProperty()
  assertionsFailed!: number;

  @ApiPropertyOptional({
    description: 'Firma del fallo, con la que se deduplican defectos',
  })
  failureSignatureHash?: string;
}

// ---------------------------------------------------------------------------
// UC-36-07 · Cierre de corrida
// ---------------------------------------------------------------------------

export class FinalizeRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  totalCases!: number;

  @ApiProperty()
  totalPassed!: number;

  @ApiProperty()
  totalFailed!: number;

  @ApiProperty()
  totalSkipped!: number;

  @ApiPropertyOptional({
    description: 'Duración de la corrida, en milisegundos',
  })
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// UC-36-08 · Artefactos
// ---------------------------------------------------------------------------

/** Naturaleza del artefacto de evidencia. */
export type ArtifactType = 'LOG' | 'HAR' | 'SCREENSHOT' | 'JUNIT';
const ARTIFACT_TYPES = ['LOG', 'HAR', 'SCREENSHOT', 'JUNIT'] as const;

/** Cuerpo de `POST /qa/runs/{runId}/artifacts` (UC-36-08). */
export class AttachArtifactDto {
  @ApiProperty({ enum: ARTIFACT_TYPES })
  @IsIn(ARTIFACT_TYPES)
  artifactType!: ArtifactType;

  @ApiProperty({ format: 'uuid', description: 'Archivo en `common.files`' })
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Resultado de caso al que pertenece',
  })
  @IsOptional()
  @IsUUID()
  testCaseResultId?: string;
}

export class ArtifactResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  testRunId!: string;

  @ApiProperty({ format: 'uuid' })
  artifactTypeConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-36-09 · Defecto
// ---------------------------------------------------------------------------

/** Naturaleza del defecto. */
export type DefectType = 'BUG' | 'REGRESSION' | 'FLAKY';
const DEFECT_TYPES = ['BUG', 'REGRESSION', 'FLAKY'] as const;

/** Gravedad del defecto. */
export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
const DEFECT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

/** Cuerpo de `POST /qa/defects` (UC-36-09). */
export class RegisterDefectDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  testCaseId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Resultado en el que se detectó',
  })
  @IsOptional()
  @IsUUID()
  testCaseResultId?: string;

  @ApiProperty({
    description:
      'Firma del fallo; dos fallos con la misma firma son el mismo defecto',
    maxLength: 128,
  })
  @IsString()
  @MaxLength(128)
  failureSignatureHash!: string;

  @ApiProperty({ enum: DEFECT_TYPES })
  @IsIn(DEFECT_TYPES)
  defectType!: DefectType;

  @ApiProperty({ enum: DEFECT_SEVERITIES })
  @IsIn(DEFECT_SEVERITIES)
  severity!: DefectSeverity;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class DefectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  defectNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Veces que se ha visto este mismo fallo' })
  occurrencesCount!: number;

  @ApiProperty({
    description: 'true si el defecto ya existía y sólo subió su contador',
  })
  deduplicated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-36-10 · Triage
// ---------------------------------------------------------------------------

/** Estado del defecto en el flujo de triage. */
export type DefectStatus =
  'OPEN' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
const DEFECT_STATUSES = [
  'OPEN',
  'TRIAGED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
] as const;

/** Cuerpo de `PATCH /qa/defects/{defectId}` (UC-36-10). */
export class TriageDefectDto {
  @ApiProperty({ enum: DEFECT_STATUSES })
  @IsIn(DEFECT_STATUSES)
  status!: DefectStatus;

  @ApiPropertyOptional({
    enum: DEFECT_SEVERITIES,
    description: 'Reclasificar la gravedad',
  })
  @IsOptional()
  @IsIn(DEFECT_SEVERITIES)
  severity?: DefectSeverity;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Persona a la que se asigna',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Marcarlo como intermitente' })
  @IsOptional()
  @IsBoolean()
  isFlaky?: boolean;

  @ApiPropertyOptional({
    description: 'Referencia en el gestor externo',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalIssueRef?: string;
}

export class TriageDefectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  assignedToUserId?: string;
}

// ---------------------------------------------------------------------------
// UC-36-11 · Programación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/schedules` (UC-36-11). */
export class CreateTestScheduleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  suiteId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  environmentId!: string;

  @ApiProperty({
    description: 'Código, único por suite y entorno',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Expresión cron de cinco campos',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  cronExpression!: string;

  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    default: 'UTC',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({
    enum: ['ALLOW', 'FORBID', 'QUEUE'],
    default: 'FORBID',
    description: 'Qué hacer si la suite ya tiene una corrida en marcha',
  })
  @IsOptional()
  @IsIn(['ALLOW', 'FORBID', 'QUEUE'])
  concurrencyPolicy?: 'ALLOW' | 'FORBID' | 'QUEUE';

  @ApiProperty({
    format: 'date-time',
    description:
      'Primera corrida. El cliente resuelve el cron; aquí se guarda el instante.',
  })
  @IsISO8601()
  firstRunAt!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class TestScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'date-time' })
  nextRunAt!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-36-12 · Enlace a release
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/runs/{runId}/link-release` (UC-36-12). */
export class LinkReleaseDto {
  @ApiProperty({
    description: 'Referencia de git confirmada del release',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  gitRef!: string;

  @ApiPropertyOptional({
    description: 'Identificador del release en el módulo de despliegue',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  releaseRef?: string;
}

export class LinkReleaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  gitRef!: string;

  @ApiProperty({
    description: 'Artefactos que componen el paquete de evidencia',
  })
  artifactCount!: number;

  @ApiProperty({
    description: 'Sello del paquete: hash de los artefactos enlazados',
  })
  evidenceHash!: string;
}
