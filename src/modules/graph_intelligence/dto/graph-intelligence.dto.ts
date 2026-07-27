import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
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
import {
  DIRECTIONALITIES,
  EVIDENCE_TYPES,
  HIT_STATUSES,
  MAX_CONFIDENCE,
  MAX_HOPS_CEILING,
  MAX_PROJECTION_BATCH,
  MAX_TRAVERSAL_NODES,
  MIN_CONFIDENCE,
  SCOPE_STATES,
} from '../constants';

// ---------------------------------------------------------------------------
// UC-61-01 · Proyectar nodo e identificadores
// ---------------------------------------------------------------------------

export class NodeIdentifierDto {
  @ApiProperty({
    maxLength: 100,
    description: 'Sistema del identificador, p. ej. `DNI`',
  })
  @IsString()
  @MaxLength(100)
  identifierSystem!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Hash del identificador. **Nunca el valor en claro.**',
  })
  @IsString()
  @MaxLength(200)
  identifierValueHash!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identifierType?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/** Cuerpo de `POST /graph/projections/nodes/upsert` (UC-61-01). */
export class UpsertNodeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  nodeType!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Tabla canónica de la que se proyecta',
  })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  @ApiProperty({
    description:
      'Versión canónica del evento; cadena por ser bigint. Un valor menor no se aplica.',
  })
  @IsNumberString({ no_symbols: true })
  sourceVersion!: string;

  @ApiProperty({
    maxLength: 300,
    description: 'Etiqueta ya redactada; nunca el nombre completo',
  })
  @IsString()
  @MaxLength(300)
  displayLabelRedacted!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityLabels?: string[];

  @ApiPropertyOptional({ type: [NodeIdentifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeIdentifierDto)
  identifiers?: NodeIdentifierDto[];
}

export class NodeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nodeType!: string;

  @ApiProperty()
  sourceVersion!: string;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty({
    description: 'Identificadores nuevos añadidos en esta llamada',
  })
  identifiersAdded!: number;

  @ApiProperty({
    description:
      'Verdadero si el evento traía una versión anterior y se descartó',
  })
  stale!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-02 · Proyectar arista con evidencia
// ---------------------------------------------------------------------------

export class EdgeEvidenceDto {
  @ApiProperty({ enum: EVIDENCE_TYPES })
  @IsIn(EVIDENCE_TYPES)
  evidenceType!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceReference?: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Hash de la evidencia; deduplica el reenvío',
  })
  @IsString()
  @MaxLength(200)
  evidenceHash!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;

  @ApiProperty({
    minimum: -1,
    maximum: 1,
    description: 'Cuánto sube o baja la confianza de la arista',
  })
  @IsNumber()
  @Min(-1)
  @Max(1)
  confidenceDelta!: number;
}

/** Cuerpo de `POST /graph/projections/edges/upsert` (UC-61-02). */
export class UpsertEdgeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid', description: 'Nodo origen, ya proyectado' })
  @IsUUID()
  fromNodeId!: string;

  @ApiProperty({ format: 'uuid', description: 'Nodo destino, ya proyectado' })
  @IsUUID()
  toNodeId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  relationshipType!: string;

  @ApiPropertyOptional({ enum: DIRECTIONALITIES, default: 'directed' })
  @IsOptional()
  @IsIn(DIRECTIONALITIES)
  directionality?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [EdgeEvidenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeEvidenceDto)
  evidence?: EdgeEvidenceDto[];
}

export class EdgeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  relationshipType!: string;

  @ApiProperty({ minimum: MIN_CONFIDENCE, maximum: MAX_CONFIDENCE })
  confidenceScore!: number;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty({
    description: 'Evidencias nuevas añadidas; las repetidas se descartan',
  })
  evidenceAdded!: number;
}

// ---------------------------------------------------------------------------
// UC-61-03 · Corrida de proyección
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/projection-definitions/{id}/runs` (UC-61-03). */
export class StartProjectionRunDto {
  @ApiPropertyOptional({
    description: 'Punto desde el que sigue la corrida; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  sourceCheckpoint?: string;
}

/** Cuerpo de `POST /graph/projection-runs/{id}/advance` (UC-61-03). */
export class AdvanceProjectionRunDto {
  @ApiProperty({ description: 'Nuevo punto alcanzado; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  sourceCheckpoint!: string;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: MAX_PROJECTION_BATCH,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PROJECTION_BATCH)
  nodesWritten?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: MAX_PROJECTION_BATCH,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PROJECTION_BATCH)
  edgesWritten?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Si este lote cierra la corrida',
  })
  @IsOptional()
  @IsBoolean()
  finalBatch?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Cierra la corrida como fallida',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;
}

export class ProjectionRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  sourceCheckpoint?: string;

  @ApiProperty()
  nodesWritten!: string;

  @ApiProperty()
  edgesWritten!: string;

  @ApiProperty({
    description: 'Verdadero si ya había una corrida viva y se devuelve ésa',
  })
  alreadyRunning!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-04 · Alcance de acceso
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/access-scopes` (UC-61-04). */
export class DefineAccessScopeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  scopeCode!: string;

  @ApiProperty({ type: [String], description: 'Tipos de nodo visitables' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedNodeTypes!: string[];

  @ApiProperty({ type: [String], description: 'Tipos de relación recorribles' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedRelationshipTypes!: string[];

  @ApiProperty({ type: [String], description: 'Propósitos de uso admitidos' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  purposeOfUseCodes!: string[];

  @ApiProperty({
    minimum: 1,
    maximum: MAX_HOPS_CEILING,
    description: 'Profundidad máxima',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_HOPS_CEILING)
  maxHops!: number;

  @ApiPropertyOptional({
    default: false,
    description:
      'Si el traversal exige declarar el paciente sobre el que se hace',
  })
  @IsOptional()
  @IsBoolean()
  requiresPatientContext?: boolean;
}

/** Cuerpo de `PATCH /graph/access-scopes/{id}` (UC-61-04). */
export class UpdateAccessScopeDto {
  @ApiPropertyOptional({ enum: SCOPE_STATES })
  @IsOptional()
  @IsIn(SCOPE_STATES)
  state?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedNodeTypes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedRelationshipTypes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  purposeOfUseCodes?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_HOPS_CEILING })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_HOPS_CEILING)
  maxHops?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresPatientContext?: boolean;
}

export class AccessScopeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  scopeCode!: string;

  @ApiProperty()
  maxHops!: number;

  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-61-05 · Traversal y rutas
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/traverse` (UC-61-05). */
export class TraverseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Alcance de acceso bajo el que se recorre',
  })
  @IsString()
  @MaxLength(100)
  scopeCode!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  startNodeId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  purposeOfUse!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filtro de tipos de relación',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationshipFilter?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_HOPS_CEILING })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_HOPS_CEILING)
  maxHops?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente del contexto; obligatorio si el alcance lo exige',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

/** Cuerpo de `POST /graph/paths` (UC-61-05). */
export class FindPathDto extends TraverseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  endNodeId!: string;
}

export class VisitedNodeDto {
  @ApiProperty({ format: 'uuid' })
  nodeId!: string;

  @ApiProperty()
  nodeType!: string;

  @ApiProperty()
  displayLabelRedacted!: string;

  @ApiProperty({ description: 'Saltos desde el nodo de partida' })
  depth!: number;
}

export class TraverseResponseDto {
  @ApiProperty({ format: 'uuid' })
  startNodeId!: string;

  @ApiProperty({ type: [VisitedNodeDto] })
  nodes!: VisitedNodeDto[];

  @ApiProperty({ description: 'Aristas recorridas' })
  edgeCount!: number;

  @ApiProperty({ description: 'Profundidad efectiva alcanzada' })
  depthReached!: number;

  @ApiProperty({
    description: 'Verdadero si se alcanzó el tope de nodos y hay más',
  })
  truncated!: boolean;
}

export class PathResponseDto {
  @ApiProperty({ format: 'uuid' })
  startNodeId!: string;

  @ApiProperty({ format: 'uuid' })
  endNodeId!: string;

  @ApiProperty({ description: 'Verdadero si existe camino dentro del alcance' })
  found!: boolean;

  @ApiProperty({ type: [String], format: 'uuid' })
  pathNodes!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  pathEdges!: string[];

  @ApiProperty({ description: 'Verdadero si la ruta salió de la caché' })
  fromCache!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-06 · Detección de comunidades
// ---------------------------------------------------------------------------

export class CommunityInputDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  memberNodeIds!: string[];

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;
}

/** Cuerpo de `POST /graph/analytics/community-detection` (UC-61-06). */
export class DetectCommunitiesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  communityType!: string;

  @ApiProperty({
    maxLength: 50,
    description: 'Versión del algoritmo que produjo el resultado',
  })
  @IsString()
  @MaxLength(50)
  algorithmVersion!: string;

  @ApiProperty({ type: [CommunityInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CommunityInputDto)
  communities!: CommunityInputDto[];
}

export class CommunitiesResponseDto {
  @ApiProperty()
  communityType!: string;

  @ApiProperty()
  algorithmVersion!: string;

  @ApiProperty({ description: 'Comunidades escritas' })
  written!: number;

  @ApiProperty({
    description: 'Comunidades de la misma versión que se reemplazaron',
  })
  replaced!: number;
}

// ---------------------------------------------------------------------------
// UC-61-07 · Puntajes de riesgo
// ---------------------------------------------------------------------------

export class RiskScoreInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  nodeId!: string;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Explicación ya redactada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanationRedacted?: string;
}

/** Cuerpo de `POST /graph/analytics/risk-scoring` (UC-61-07). */
export class ComputeRiskScoresDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  riskType!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  modelVersion!: string;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 1,
    description: 'Por encima de este puntaje se publica alerta',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  alertThreshold?: number;

  @ApiProperty({ type: [RiskScoreInputDto], maxItems: MAX_PROJECTION_BATCH })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PROJECTION_BATCH)
  @ValidateNested({ each: true })
  @Type(() => RiskScoreInputDto)
  scores!: RiskScoreInputDto[];
}

export class RiskScoresResponseDto {
  @ApiProperty()
  riskType!: string;

  @ApiProperty()
  modelVersion!: string;

  @ApiProperty({ description: 'Puntajes creados' })
  created!: number;

  @ApiProperty({
    description: 'Puntajes actualizados sobre uno anterior del mismo modelo',
  })
  updated!: number;

  @ApiProperty({
    description: 'Puntajes que superaron el umbral y generaron alerta',
  })
  alerted!: number;
}

// ---------------------------------------------------------------------------
// UC-61-08 · Evaluar regla y registrar hallazgo
// ---------------------------------------------------------------------------

export class RuleMatchDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Nodo sobre el que se dispara el patrón',
  })
  @IsUUID()
  primaryNodeId!: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  relatedNodeIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Aristas que sustentan el patrón',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidenceEdgeIds?: string[];
}

/** Cuerpo de `POST /graph/rules/{id}/evaluate` (UC-61-08). */
export class EvaluateRuleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Alcance bajo el que se evaluó el traversal',
  })
  @IsString()
  @MaxLength(100)
  scopeCode!: string;

  @ApiProperty({ type: [RuleMatchDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RuleMatchDto)
  matches!: RuleMatchDto[];
}

export class EvaluateRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  graphRuleDefinitionId!: string;

  @ApiProperty()
  severity!: string;

  @ApiProperty({ description: 'Hallazgos nuevos abiertos' })
  hitsOpened!: number;

  @ApiProperty({
    description: 'Coincidencias descartadas por tener ya un hallazgo vivo',
  })
  duplicatesSkipped!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  hitIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-61-09 · Triage del hallazgo
// ---------------------------------------------------------------------------

/** Cuerpo de `PATCH /graph/rule-hits/{id}` (UC-61-09). */
export class TriageRuleHitDto {
  @ApiProperty({ enum: HIT_STATUSES })
  @IsIn(HIT_STATUSES)
  status!: string;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Desenlace; queda en el evento publicado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}

export class RuleHitResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  resolvedAt?: string;

  @ApiProperty({
    description: 'Verdadero si el hallazgo ya estaba en ese estado',
  })
  unchanged!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-10 · Expirar arista
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/edges/{id}/expire` (UC-61-10). */
export class ExpireEdgeDto {
  @ApiProperty({
    maxLength: 200,
    description: 'Hash del evento de cierre; deduplica el reenvío',
  })
  @IsString()
  @MaxLength(200)
  evidenceHash!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceReference?: string;

  @ApiPropertyOptional({
    minimum: -1,
    maximum: 0,
    default: -0.5,
    description: 'Cuánto baja la confianza al cerrar; nunca positivo',
  })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(0)
  confidenceDelta?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Si la arista se retira en vez de expirar naturalmente',
  })
  @IsOptional()
  @IsBoolean()
  retired?: boolean;
}

export class ExpireEdgeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty()
  confidenceScore!: number;

  @ApiProperty({ description: 'Entradas de caché de rutas invalidadas' })
  invalidatedPaths!: number;

  @ApiProperty({ description: 'Verdadero si la arista ya estaba cerrada' })
  alreadyClosed!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-11 · Borrado / derecho al olvido
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/deletion-jobs` (UC-61-11). */
export class RequestGraphDeletionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;
}

export class GraphDeletionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  nodesDeleted!: number;

  @ApiProperty()
  edgesDeleted!: number;

  @ApiProperty({ description: 'Identificadores hasheados purgados' })
  identifiersDeleted!: number;

  @ApiProperty({ description: 'Puntajes de riesgo purgados' })
  riskScoresDeleted!: number;

  @ApiProperty({ description: 'Comunidades de las que se depuró el nodo' })
  communitiesUpdated!: number;

  @ApiProperty({ description: 'Entradas de caché invalidadas' })
  invalidatedPaths!: number;

  @ApiProperty({
    description: 'Verdadero si ya había un job vivo para esa entidad',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-12 · Reconciliar versión fuente
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/projections/reconcile` (UC-61-12). */
export class ReconcileSourceVersionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  @ApiProperty({
    description: 'Versión canónica entrante; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  sourceVersion!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si el evento es un borrado; crea el job de purga',
  })
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayLabelRedacted?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityLabels?: string[];
}

export class ReconcileResponseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  nodeId?: string;

  @ApiProperty({
    description: 'Verdadero si la versión entrante era anterior y se descartó',
  })
  stale!: boolean;

  @ApiProperty({ description: 'Entradas de caché de rutas invalidadas' })
  invalidatedPaths!: number;

  @ApiProperty({
    description: 'Puntajes de riesgo caducados para forzar su recálculo',
  })
  expiredRiskScores!: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job de borrado creado si el evento lo era',
  })
  deletionJobId?: string;
}

/** Tope de nodos que devuelve un traversal; reexportado para el `@ApiProperty`. */
export const TRAVERSAL_NODE_LIMIT = MAX_TRAVERSAL_NODES;
