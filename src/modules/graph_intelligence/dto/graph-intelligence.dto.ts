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

/**
 * Define el contrato validado para node identifier.
 */
export class NodeIdentifierDto {
  /**
   * Valor de identifier system mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Sistema del identificador, p. ej. `DNI`',
  })
  @IsString()
  @MaxLength(100)
  identifierSystem!: string;

  /**
   * Valor de identifier value hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Hash del identificador. **Nunca el valor en claro.**',
  })
  @IsString()
  @MaxLength(200)
  identifierValueHash!: string;

  /**
   * Valor de identifier type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identifierType?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/** Cuerpo de `POST /graph/projections/nodes/upsert` (UC-61-01). */
export class UpsertNodeDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de node type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  nodeType!: string;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Tabla canónica de la que se proyecta',
  })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Versión canónica del evento; cadena por ser bigint. Un valor menor no se aplica.',
  })
  @IsNumberString({ no_symbols: true })
  sourceVersion!: string;

  /**
   * Valor de display label redacted mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 300,
    description: 'Etiqueta ya redactada; nunca el nombre completo',
  })
  @IsString()
  @MaxLength(300)
  displayLabelRedacted!: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  /**
   * Valor de security labels mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityLabels?: string[];

  /**
   * Valor de identifiers mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [NodeIdentifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeIdentifierDto)
  identifiers?: NodeIdentifierDto[];
}

/**
 * Define el contrato validado para node response.
 */
export class NodeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de node type mantenido por la instancia.
   */
  @ApiProperty()
  nodeType!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @ApiProperty()
  sourceVersion!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty()
  lifecycleState!: string;

  /**
   * Valor de identifiers added mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificadores nuevos añadidos en esta llamada',
  })
  identifiersAdded!: number;

  /**
   * Valor de stale mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Verdadero si el evento traía una versión anterior y se descartó',
  })
  stale!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-02 · Proyectar arista con evidencia
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para edge evidence.
 */
export class EdgeEvidenceDto {
  /**
   * Valor de evidence type mantenido por la instancia.
   */
  @ApiProperty({ enum: EVIDENCE_TYPES })
  @IsIn(EVIDENCE_TYPES)
  evidenceType!: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceReference?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Hash de la evidencia; deduplica el reenvío',
  })
  @IsString()
  @MaxLength(200)
  evidenceHash!: string;

  /**
   * Valor de observed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  observedAt?: string;

  /**
   * Valor de confidence delta mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a from node.
   */
  @ApiProperty({ format: 'uuid', description: 'Nodo origen, ya proyectado' })
  @IsUUID()
  fromNodeId!: string;

  /**
   * Identificador asociado a to node.
   */
  @ApiProperty({ format: 'uuid', description: 'Nodo destino, ya proyectado' })
  @IsUUID()
  toNodeId!: string;

  /**
   * Valor de relationship type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  relationshipType!: string;

  /**
   * Valor de directionality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: DIRECTIONALITIES, default: 'directed' })
  @IsOptional()
  @IsIn(DIRECTIONALITIES)
  directionality?: string;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  /**
   * Valor de evidence mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [EdgeEvidenceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeEvidenceDto)
  evidence?: EdgeEvidenceDto[];
}

/**
 * Define el contrato validado para edge response.
 */
export class EdgeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de relationship type mantenido por la instancia.
   */
  @ApiProperty()
  relationshipType!: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiProperty({ minimum: MIN_CONFIDENCE, maximum: MAX_CONFIDENCE })
  confidenceScore!: number;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty()
  lifecycleState!: string;

  /**
   * Valor de evidence added mantenido por la instancia.
   */
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
  /**
   * Valor de source checkpoint mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Punto desde el que sigue la corrida; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  sourceCheckpoint?: string;
}

/** Cuerpo de `POST /graph/projection-runs/{id}/advance` (UC-61-03). */
export class AdvanceProjectionRunDto {
  /**
   * Valor de source checkpoint mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nuevo punto alcanzado; cadena por ser bigint' })
  @IsNumberString({ no_symbols: true })
  sourceCheckpoint!: string;

  /**
   * Valor de nodes written mantenido por la instancia.
   */
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

  /**
   * Valor de edges written mantenido por la instancia.
   */
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

  /**
   * Valor de final batch mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si este lote cierra la corrida',
  })
  @IsOptional()
  @IsBoolean()
  finalBatch?: boolean;

  /**
   * Valor de failed mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Cierra la corrida como fallida',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;
}

/**
 * Define el contrato validado para projection run response.
 */
export class ProjectionRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de source checkpoint mantenido por la instancia.
   */
  @ApiPropertyOptional()
  sourceCheckpoint?: string;

  /**
   * Valor de nodes written mantenido por la instancia.
   */
  @ApiProperty()
  nodesWritten!: string;

  /**
   * Valor de edges written mantenido por la instancia.
   */
  @ApiProperty()
  edgesWritten!: string;

  /**
   * Valor de already running mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de scope code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  scopeCode!: string;

  /**
   * Valor de allowed node types mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Tipos de nodo visitables' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedNodeTypes!: string[];

  /**
   * Valor de allowed relationship types mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Tipos de relación recorribles' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedRelationshipTypes!: string[];

  /**
   * Valor de purpose of use codes mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Propósitos de uso admitidos' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  purposeOfUseCodes!: string[];

  /**
   * Valor de max hops mantenido por la instancia.
   */
  @ApiProperty({
    minimum: 1,
    maximum: MAX_HOPS_CEILING,
    description: 'Profundidad máxima',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_HOPS_CEILING)
  maxHops!: number;

  /**
   * Valor de requires patient context mantenido por la instancia.
   */
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
  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: SCOPE_STATES })
  @IsOptional()
  @IsIn(SCOPE_STATES)
  state?: string;

  /**
   * Valor de allowed node types mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedNodeTypes?: string[];

  /**
   * Valor de allowed relationship types mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedRelationshipTypes?: string[];

  /**
   * Valor de purpose of use codes mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  purposeOfUseCodes?: string[];

  /**
   * Valor de max hops mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_HOPS_CEILING })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_HOPS_CEILING)
  maxHops?: number;

  /**
   * Valor de requires patient context mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresPatientContext?: boolean;
}

/**
 * Define el contrato validado para access scope response.
 */
export class AccessScopeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de scope code mantenido por la instancia.
   */
  @ApiProperty()
  scopeCode!: string;

  /**
   * Valor de max hops mantenido por la instancia.
   */
  @ApiProperty()
  maxHops!: number;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;
}

// ---------------------------------------------------------------------------
// UC-61-05 · Traversal y rutas
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/traverse` (UC-61-05). */
export class TraverseDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de scope code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Alcance de acceso bajo el que se recorre',
  })
  @IsString()
  @MaxLength(100)
  scopeCode!: string;

  /**
   * Identificador asociado a start node.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  startNodeId!: string;

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  purposeOfUse!: string;

  /**
   * Valor de relationship filter mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Filtro de tipos de relación',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationshipFilter?: string[];

  /**
   * Valor de max hops mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_HOPS_CEILING })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_HOPS_CEILING)
  maxHops?: number;

  /**
   * Identificador asociado a patient profile.
   */
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
  /**
   * Identificador asociado a end node.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  endNodeId!: string;
}

/**
 * Define el contrato validado para visited node.
 */
export class VisitedNodeDto {
  /**
   * Identificador asociado a node.
   */
  @ApiProperty({ format: 'uuid' })
  nodeId!: string;

  /**
   * Valor de node type mantenido por la instancia.
   */
  @ApiProperty()
  nodeType!: string;

  /**
   * Valor de display label redacted mantenido por la instancia.
   */
  @ApiProperty()
  displayLabelRedacted!: string;

  /**
   * Valor de depth mantenido por la instancia.
   */
  @ApiProperty({ description: 'Saltos desde el nodo de partida' })
  depth!: number;
}

/**
 * Define el contrato validado para traverse response.
 */
export class TraverseResponseDto {
  /**
   * Identificador asociado a start node.
   */
  @ApiProperty({ format: 'uuid' })
  startNodeId!: string;

  /**
   * Valor de nodes mantenido por la instancia.
   */
  @ApiProperty({ type: [VisitedNodeDto] })
  nodes!: VisitedNodeDto[];

  /**
   * Valor de edge count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Aristas recorridas' })
  edgeCount!: number;

  /**
   * Valor de depth reached mantenido por la instancia.
   */
  @ApiProperty({ description: 'Profundidad efectiva alcanzada' })
  depthReached!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si se alcanzó el tope de nodos y hay más',
  })
  truncated!: boolean;
}

/**
 * Define el contrato validado para path response.
 */
export class PathResponseDto {
  /**
   * Identificador asociado a start node.
   */
  @ApiProperty({ format: 'uuid' })
  startNodeId!: string;

  /**
   * Identificador asociado a end node.
   */
  @ApiProperty({ format: 'uuid' })
  endNodeId!: string;

  /**
   * Valor de found mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si existe camino dentro del alcance' })
  found!: boolean;

  /**
   * Valor de path nodes mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  pathNodes!: string[];

  /**
   * Valor de path edges mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  pathEdges!: string[];

  /**
   * Valor de from cache mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si la ruta salió de la caché' })
  fromCache!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-06 · Detección de comunidades
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para community input.
 */
export class CommunityInputDto {
  /**
   * Valor de member node ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  memberNodeIds!: string[];

  /**
   * Valor de score mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;
}

/** Cuerpo de `POST /graph/analytics/community-detection` (UC-61-06). */
export class DetectCommunitiesDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de community type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  communityType!: string;

  /**
   * Valor de algorithm version mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 50,
    description: 'Versión del algoritmo que produjo el resultado',
  })
  @IsString()
  @MaxLength(50)
  algorithmVersion!: string;

  /**
   * Valor de communities mantenido por la instancia.
   */
  @ApiProperty({ type: [CommunityInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CommunityInputDto)
  communities!: CommunityInputDto[];
}

/**
 * Define el contrato validado para communities response.
 */
export class CommunitiesResponseDto {
  /**
   * Valor de community type mantenido por la instancia.
   */
  @ApiProperty()
  communityType!: string;

  /**
   * Valor de algorithm version mantenido por la instancia.
   */
  @ApiProperty()
  algorithmVersion!: string;

  /**
   * Valor de written mantenido por la instancia.
   */
  @ApiProperty({ description: 'Comunidades escritas' })
  written!: number;

  /**
   * Valor de replaced mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Comunidades de la misma versión que se reemplazaron',
  })
  replaced!: number;
}

// ---------------------------------------------------------------------------
// UC-61-07 · Puntajes de riesgo
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para risk score input.
 */
export class RiskScoreInputDto {
  /**
   * Identificador asociado a node.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  nodeId!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  /**
   * Valor de explanation redacted mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de risk type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  riskType!: string;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  modelVersion!: string;

  /**
   * Valor de alert threshold mantenido por la instancia.
   */
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

  /**
   * Valor de scores mantenido por la instancia.
   */
  @ApiProperty({ type: [RiskScoreInputDto], maxItems: MAX_PROJECTION_BATCH })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PROJECTION_BATCH)
  @ValidateNested({ each: true })
  @Type(() => RiskScoreInputDto)
  scores!: RiskScoreInputDto[];
}

/**
 * Define el contrato validado para risk scores response.
 */
export class RiskScoresResponseDto {
  /**
   * Valor de risk type mantenido por la instancia.
   */
  @ApiProperty()
  riskType!: string;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @ApiProperty()
  modelVersion!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntajes creados' })
  created!: number;

  /**
   * Valor de updated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Puntajes actualizados sobre uno anterior del mismo modelo',
  })
  updated!: number;

  /**
   * Valor de alerted mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Puntajes que superaron el umbral y generaron alerta',
  })
  alerted!: number;
}

// ---------------------------------------------------------------------------
// UC-61-08 · Evaluar regla y registrar hallazgo
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para rule match.
 */
export class RuleMatchDto {
  /**
   * Identificador asociado a primary node.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Nodo sobre el que se dispara el patrón',
  })
  @IsUUID()
  primaryNodeId!: string;

  /**
   * Valor de related node ids mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  relatedNodeIds?: string[];

  /**
   * Valor de evidence edge ids mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de scope code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Alcance bajo el que se evaluó el traversal',
  })
  @IsString()
  @MaxLength(100)
  scopeCode!: string;

  /**
   * Valor de matches mantenido por la instancia.
   */
  @ApiProperty({ type: [RuleMatchDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RuleMatchDto)
  matches!: RuleMatchDto[];
}

/**
 * Define el contrato validado para evaluate rule response.
 */
export class EvaluateRuleResponseDto {
  /**
   * Identificador asociado a graph rule definition.
   */
  @ApiProperty({ format: 'uuid' })
  graphRuleDefinitionId!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiProperty()
  severity!: string;

  /**
   * Valor de hits opened mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hallazgos nuevos abiertos' })
  hitsOpened!: number;

  /**
   * Valor de duplicates skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Coincidencias descartadas por tener ya un hallazgo vivo',
  })
  duplicatesSkipped!: number;

  /**
   * Valor de hit ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  hitIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-61-09 · Triage del hallazgo
// ---------------------------------------------------------------------------

/** Cuerpo de `PATCH /graph/rule-hits/{id}` (UC-61-09). */
export class TriageRuleHitDto {
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ enum: HIT_STATUSES })
  @IsIn(HIT_STATUSES)
  status!: string;

  /**
   * Valor de resolution note mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Desenlace; queda en el evento publicado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}

/**
 * Define el contrato validado para rule hit response.
 */
export class RuleHitResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  resolvedAt?: string;

  /**
   * Valor de unchanged mantenido por la instancia.
   */
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
  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Hash del evento de cierre; deduplica el reenvío',
  })
  @IsString()
  @MaxLength(200)
  evidenceHash!: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sourceReference?: string;

  /**
   * Valor de confidence delta mantenido por la instancia.
   */
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

  /**
   * Valor de retired mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si la arista se retira en vez de expirar naturalmente',
  })
  @IsOptional()
  @IsBoolean()
  retired?: boolean;
}

/**
 * Define el contrato validado para expire edge response.
 */
export class ExpireEdgeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty()
  lifecycleState!: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiProperty()
  confidenceScore!: number;

  /**
   * Valor de invalidated paths mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entradas de caché de rutas invalidadas' })
  invalidatedPaths!: number;

  /**
   * Valor de already closed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si la arista ya estaba cerrada' })
  alreadyClosed!: boolean;
}

// ---------------------------------------------------------------------------
// UC-61-11 · Borrado / derecho al olvido
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /graph/deletion-jobs` (UC-61-11). */
export class RequestGraphDeletionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;
}

/**
 * Define el contrato validado para graph deletion response.
 */
export class GraphDeletionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de nodes deleted mantenido por la instancia.
   */
  @ApiProperty()
  nodesDeleted!: number;

  /**
   * Valor de edges deleted mantenido por la instancia.
   */
  @ApiProperty()
  edgesDeleted!: number;

  /**
   * Valor de identifiers deleted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Identificadores hasheados purgados' })
  identifiersDeleted!: number;

  /**
   * Valor de risk scores deleted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntajes de riesgo purgados' })
  riskScoresDeleted!: number;

  /**
   * Valor de communities updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Comunidades de las que se depuró el nodo' })
  communitiesUpdated!: number;

  /**
   * Valor de invalidated paths mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entradas de caché invalidadas' })
  invalidatedPaths!: number;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceEntityId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Versión canónica entrante; cadena por ser bigint',
  })
  @IsNumberString({ no_symbols: true })
  sourceVersion!: string;

  /**
   * Valor de deleted mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si el evento es un borrado; crea el job de purga',
  })
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

  /**
   * Valor de display label redacted mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayLabelRedacted?: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  /**
   * Valor de security labels mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityLabels?: string[];
}

/**
 * Define el contrato validado para reconcile response.
 */
export class ReconcileResponseDto {
  /**
   * Identificador asociado a node.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  nodeId?: string;

  /**
   * Valor de stale mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si la versión entrante era anterior y se descartó',
  })
  stale!: boolean;

  /**
   * Valor de invalidated paths mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entradas de caché de rutas invalidadas' })
  invalidatedPaths!: number;

  /**
   * Valor de expired risk scores mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Puntajes de riesgo caducados para forzar su recálculo',
  })
  expiredRiskScores!: number;

  /**
   * Identificador asociado a deletion job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job de borrado creado si el evento lo era',
  })
  deletionJobId?: string;
}

/** Tope de nodos que devuelve un traversal; reexportado para el `@ApiProperty`. */
export const TRAVERSAL_NODE_LIMIT = MAX_TRAVERSAL_NODES;
