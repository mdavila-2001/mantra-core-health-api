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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del entorno, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de environment mantenido por la instancia.
   */
  @ApiProperty({ enum: ['DEV', 'STAGING', 'PRODUCTION'] })
  @IsIn(['DEV', 'STAGING', 'PRODUCTION'])
  environment!: EnvironmentKind;

  /**
   * Valor de base url mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'URL base contra la que apuntan los casos',
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de config json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Configuración del entorno' })
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  /**
   * Valor de is production safe mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Si es false, los payloads capturados se enmascaran: el entorno puede contener datos reales.',
  })
  @IsOptional()
  @IsBoolean()
  isProductionSafe?: boolean;
}

/**
 * Define el contrato validado para environment response.
 */
export class EnvironmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Valor de is production safe mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para test assertion.
 */
export class TestAssertionDto {
  /**
   * Valor de assertion type mantenido por la instancia.
   */
  @ApiProperty({ enum: ASSERTION_TYPES })
  @IsIn(ASSERTION_TYPES)
  assertionType!: AssertionType;

  /**
   * Valor de json path mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ruta dentro del cuerpo; obligatoria si el tipo es JSON_PATH',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  jsonPath?: string;

  /**
   * Valor de operator mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ASSERTION_OPERATORS, default: 'EQUALS' })
  @IsOptional()
  @IsIn(ASSERTION_OPERATORS)
  operator?: AssertionOperator;

  /**
   * Valor de expected value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor esperado; no aplica al operador EXISTS',
  })
  @IsOptional()
  @IsString()
  expectedValue?: string;

  /**
   * Valor de tolerance mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tolerancia en comparaciones numéricas' })
  @IsOptional()
  @IsNumberString()
  tolerance?: string;
}

/** Cuerpo de `POST /qa/suites/{suiteId}/cases` (UC-36-02). */
export class CreateTestCaseDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del caso, único en la suite',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de case type mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CASE_TYPES })
  @IsOptional()
  @IsIn(CASE_TYPES)
  caseType?: CaseType;

  /**
   * Identificador asociado a endpoint.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Endpoint del catálogo que se ejercita',
  })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: HTTP_METHODS })
  @IsOptional()
  @IsIn(HTTP_METHODS)
  httpMethod?: HttpMethod;

  /**
   * Valor de request path mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestPath?: string;

  /**
   * Valor de expected http status mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  expectedHttpStatus?: number;

  /**
   * Valor de setup json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Preparación previa al caso' })
  @IsOptional()
  @IsObject()
  setupJson?: Record<string, unknown>;

  /**
   * Valor de teardown json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Limpieza posterior al caso' })
  @IsOptional()
  @IsObject()
  teardownJson?: Record<string, unknown>;

  /**
   * Valor de is critical mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Un caso crítico que falla tumba la corrida entera',
  })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  /**
   * Valor de assertions mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para test case response.
 */
export class TestCaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid', description: 'El caso nace en borrador' })
  stateConceptId!: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty()
  ordinal!: number;

  /**
   * Valor de assertion ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  assertionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-36-03 · Publicación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/suites/{suiteId}/publish` (UC-36-03). */
export class PublishSuiteDto {
  /**
   * Valor de change note mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué cambió en esta versión de la suite',
  })
  @IsOptional()
  @IsString()
  changeNote?: string;
}

/**
 * Define el contrato validado para publish suite response.
 */
export class PublishSuiteResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: number;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Valor de cases activated mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a suite.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  suiteId!: string;

  /**
   * Identificador asociado a environment.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  environmentId!: string;

  /**
   * Valor de trigger mantenido por la instancia.
   */
  @ApiProperty({ enum: RUN_TRIGGERS })
  @IsIn(RUN_TRIGGERS)
  trigger!: RunTrigger;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia de git que se está probando',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gitRef?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de concurrency policy mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Política ante corridas solapadas de la misma suite',
    enum: ['ALLOW', 'FORBID', 'QUEUE'],
    default: 'ALLOW',
  })
  @IsOptional()
  @IsIn(['ALLOW', 'FORBID', 'QUEUE'])
  concurrencyPolicy?: 'ALLOW' | 'FORBID' | 'QUEUE';
}

/**
 * Define el contrato validado para run response.
 */
export class RunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de run number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número secuencial de la corrida' })
  runNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de total cases mantenido por la instancia.
   */
  @ApiProperty({ description: 'Casos activos que la corrida ejercitará' })
  totalCases!: number;
}

// ---------------------------------------------------------------------------
// UC-36-05 · Ejecución del caso
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/runs/{runId}/cases/{caseId}/execute` (UC-36-05). */
export class ExecuteCaseDto {
  /**
   * Valor de request body json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cuerpo de la petición tal como se envió' })
  @IsObject()
  requestBodyJson!: Record<string, unknown>;

  /**
   * Valor de request headers json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cabeceras de la petición' })
  @IsOptional()
  @IsObject()
  requestHeadersJson?: Record<string, unknown>;

  /**
   * Valor de target url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URL a la que se llamó' })
  @IsOptional()
  @IsString()
  targetUrl?: string;

  /**
   * Valor de response body json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cuerpo de la respuesta tal como llegó' })
  @IsObject()
  responseBodyJson!: Record<string, unknown>;

  /**
   * Valor de response headers json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cabeceras de la respuesta' })
  @IsOptional()
  @IsObject()
  responseHeadersJson?: Record<string, unknown>;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 100, maximum: 599 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  httpStatus?: number;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Latencia de la llamada, en milisegundos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Error de transporte si la llamada no llegó a completarse',
  })
  @IsOptional()
  @IsString()
  errorText?: string;
}

/**
 * Define el contrato validado para execute case response.
 */
export class ExecuteCaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Resultado del caso creado' })
  id!: string;

  /**
   * Identificador asociado a request payload.
   */
  @ApiProperty({ format: 'uuid' })
  requestPayloadId!: string;

  /**
   * Identificador asociado a response payload.
   */
  @ApiProperty({ format: 'uuid' })
  responsePayloadId!: string;

  /**
   * Valor de response body hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del cuerpo de la respuesta, para detectar manipulación',
  })
  responseBodyHash!: string;

  /**
   * Valor de masked mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si el entorno no es seguro y los payloads se guardaron enmascarados',
  })
  masked!: boolean;
}

// ---------------------------------------------------------------------------
// UC-36-06 · Evaluación
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para evaluate result response.
 */
export class EvaluateResultResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de assertions total mantenido por la instancia.
   */
  @ApiProperty()
  assertionsTotal!: number;

  /**
   * Valor de assertions passed mantenido por la instancia.
   */
  @ApiProperty()
  assertionsPassed!: number;

  /**
   * Valor de assertions failed mantenido por la instancia.
   */
  @ApiProperty()
  assertionsFailed!: number;

  /**
   * Valor de failure signature hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Firma del fallo, con la que se deduplican defectos',
  })
  failureSignatureHash?: string;
}

// ---------------------------------------------------------------------------
// UC-36-07 · Cierre de corrida
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para finalize run response.
 */
export class FinalizeRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de total cases mantenido por la instancia.
   */
  @ApiProperty()
  totalCases!: number;

  /**
   * Valor de total passed mantenido por la instancia.
   */
  @ApiProperty()
  totalPassed!: number;

  /**
   * Valor de total failed mantenido por la instancia.
   */
  @ApiProperty()
  totalFailed!: number;

  /**
   * Valor de total skipped mantenido por la instancia.
   */
  @ApiProperty()
  totalSkipped!: number;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
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
  /**
   * Valor de artifact type mantenido por la instancia.
   */
  @ApiProperty({ enum: ARTIFACT_TYPES })
  @IsIn(ARTIFACT_TYPES)
  artifactType!: ArtifactType;

  /**
   * Identificador asociado a file.
   */
  @ApiProperty({ format: 'uuid', description: 'Archivo en `common.files`' })
  @IsUUID()
  fileId!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  /**
   * Identificador asociado a test case result.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Resultado de caso al que pertenece',
  })
  @IsOptional()
  @IsUUID()
  testCaseResultId?: string;
}

/**
 * Define el contrato validado para artifact response.
 */
export class ArtifactResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a test run.
   */
  @ApiProperty({ format: 'uuid' })
  testRunId!: string;

  /**
   * Identificador asociado a artifact type concept.
   */
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
  /**
   * Identificador asociado a test case.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  testCaseId!: string;

  /**
   * Identificador asociado a test case result.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Resultado en el que se detectó',
  })
  @IsOptional()
  @IsUUID()
  testCaseResultId?: string;

  /**
   * Valor de failure signature hash mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Firma del fallo; dos fallos con la misma firma son el mismo defecto',
    maxLength: 128,
  })
  @IsString()
  @MaxLength(128)
  failureSignatureHash!: string;

  /**
   * Valor de defect type mantenido por la instancia.
   */
  @ApiProperty({ enum: DEFECT_TYPES })
  @IsIn(DEFECT_TYPES)
  defectType!: DefectType;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiProperty({ enum: DEFECT_SEVERITIES })
  @IsIn(DEFECT_SEVERITIES)
  severity!: DefectSeverity;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/**
 * Define el contrato validado para defect response.
 */
export class DefectResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de defect number mantenido por la instancia.
   */
  @ApiProperty()
  defectNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de occurrences count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Veces que se ha visto este mismo fallo' })
  occurrencesCount!: number;

  /**
   * Valor de deduplicated mantenido por la instancia.
   */
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
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: DEFECT_STATUSES })
  @IsIn(DEFECT_STATUSES)
  status!: DefectStatus;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: DEFECT_SEVERITIES,
    description: 'Reclasificar la gravedad',
  })
  @IsOptional()
  @IsIn(DEFECT_SEVERITIES)
  severity?: DefectSeverity;

  /**
   * Identificador asociado a assigned to user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Persona a la que se asigna',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  /**
   * Valor de is flaky mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marcarlo como intermitente' })
  @IsOptional()
  @IsBoolean()
  isFlaky?: boolean;

  /**
   * Valor de external issue ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia en el gestor externo',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalIssueRef?: string;
}

/**
 * Define el contrato validado para triage defect response.
 */
export class TriageDefectResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  /**
   * Identificador asociado a assigned to user.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  assignedToUserId?: string;
}

// ---------------------------------------------------------------------------
// UC-36-11 · Programación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/schedules` (UC-36-11). */
export class CreateTestScheduleDto {
  /**
   * Identificador asociado a suite.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  suiteId!: string;

  /**
   * Identificador asociado a environment.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  environmentId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código, único por suite y entorno',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de cron expression mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Expresión cron de cinco campos',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  cronExpression!: string;

  /**
   * Valor de timezone mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    default: 'UTC',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  /**
   * Valor de concurrency policy mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: ['ALLOW', 'FORBID', 'QUEUE'],
    default: 'FORBID',
    description: 'Qué hacer si la suite ya tiene una corrida en marcha',
  })
  @IsOptional()
  @IsIn(['ALLOW', 'FORBID', 'QUEUE'])
  concurrencyPolicy?: 'ALLOW' | 'FORBID' | 'QUEUE';

  /**
   * Valor de first run at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description:
      'Primera corrida. El cliente resuelve el cron; aquí se guarda el instante.',
  })
  @IsISO8601()
  firstRunAt!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/**
 * Define el contrato validado para test schedule response.
 */
export class TestScheduleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  nextRunAt!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-36-12 · Enlace a release
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /qa/runs/{runId}/link-release` (UC-36-12). */
export class LinkReleaseDto {
  /**
   * Valor de git ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia de git confirmada del release',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  gitRef!: string;

  /**
   * Valor de release ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Identificador del release en el módulo de despliegue',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  releaseRef?: string;
}

/**
 * Define el contrato validado para link release response.
 */
export class LinkReleaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @ApiProperty()
  gitRef!: string;

  /**
   * Valor de artifact count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Artefactos que componen el paquete de evidencia',
  })
  artifactCount!: number;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Sello del paquete: hash de los artefactos enlazados',
  })
  evidenceHash!: string;
}
