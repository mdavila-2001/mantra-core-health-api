import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ANNOTATION_ORIGINS,
  EVIDENCE_KINDS,
  OBJECT_KINDS,
  OBSERVATION_STATUSES,
  REVIEW_STATUSES,
  SENSITIVITIES,
  SCAN_STATUSES,
} from '../catalog/catalog.constants';

export class OpenQuestionViewDto {
  @ApiPropertyOptional() field?: string;
  @ApiProperty() question!: string;
  @ApiPropertyOptional() owner?: string;
  @ApiPropertyOptional() dueDate?: string;
}

/** Contenido completo de una ficha. `null` = nadie lo respondió todavía. */
export class AnnotationContentDto {
  @ApiPropertyOptional({ nullable: true }) businessName!: string | null;
  @ApiPropertyOptional({ nullable: true }) definition!: string | null;
  @ApiPropertyOptional({ nullable: true }) purpose!: string | null;
  @ApiPropertyOptional({ nullable: true }) existenceRationale!: string | null;
  @ApiPropertyOptional({ nullable: true }) rowGrain!: string | null;
  @ApiPropertyOptional({ nullable: true }) alternativesRationale!:
    string | null;
  @ApiPropertyOptional({ nullable: true }) processSupported!: string | null;
  @ApiPropertyOptional({ nullable: true }) sourceOfTruth!: string | null;
  @ApiProperty({ type: [String] }) producers!: string[];
  @ApiProperty({ type: [String] }) consumers!: string[];
  @ApiPropertyOptional({ nullable: true }) deletionImpact!: string | null;
  @ApiPropertyOptional({ nullable: true }) businessOwner!: string | null;
  @ApiPropertyOptional({ nullable: true }) dataSteward!: string | null;
  @ApiPropertyOptional({ nullable: true }) technicalOwner!: string | null;
  @ApiPropertyOptional({ nullable: true }) unit!: string | null;
  @ApiPropertyOptional({ nullable: true }) valueDomain!: string | null;
  @ApiPropertyOptional({ nullable: true }) nullSemantics!: string | null;
  @ApiProperty({ enum: SENSITIVITIES }) sensitivity!: string;
  @ApiProperty({ type: [OpenQuestionViewDto] })
  openQuestions!: OpenQuestionViewDto[];
}

export class AnnotationDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['OBJECT', 'COLUMN'] }) targetKind!: string;
  @ApiProperty({
    description: 'Lo que se devuelve como `expectedVersion` al editar',
  })
  version!: number;
  @ApiProperty({ enum: REVIEW_STATUSES }) reviewStatus!: string;
  @ApiProperty({ enum: ANNOTATION_ORIGINS }) origin!: string;
  @ApiProperty() currentRevisionNo!: number;
  @ApiPropertyOptional({ nullable: true }) approvedRevisionNo!: number | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  approvedAt!: string | null;
  @ApiProperty({
    description:
      '`true` si la aprobación es de la revisión vigente: una edición posterior la deja de ser',
  })
  approvalIsCurrent!: boolean;
  @ApiProperty({ type: AnnotationContentDto }) content!: AnnotationContentDto;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class StatisticsDto {
  @ApiPropertyOptional({ nullable: true, description: 'bigint como texto' })
  estimatedRows!: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'bigint como texto' })
  totalBytes!: string | null;
  @ApiProperty({
    description: 'Siempre `true`: salen de pg_class, no de un conteo',
  })
  isEstimate!: boolean;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  observedAt!: string | null;
}

export class AnnotationSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true }) businessName!: string | null;
  @ApiProperty({ enum: REVIEW_STATUSES }) reviewStatus!: string;
  @ApiProperty() hasPurpose!: boolean;
  @ApiProperty() hasExistenceRationale!: boolean;
  @ApiProperty() hasRowGrain!: boolean;
  @ApiPropertyOptional({ nullable: true }) owner!: string | null;
  @ApiProperty({ enum: SENSITIVITIES }) sensitivity!: string;
}

export class CatalogObjectSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() schemaName!: string;
  @ApiProperty() objectName!: string;
  @ApiProperty({ enum: OBJECT_KINDS }) objectKind!: string;
  @ApiProperty({ enum: OBSERVATION_STATUSES }) observationStatus!: string;
  @ApiProperty() columnCount!: number;
  @ApiProperty({ type: StatisticsDto }) statistics!: StatisticsDto;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastSeenAt!: string;
  @ApiPropertyOptional({ type: AnnotationSummaryDto, nullable: true })
  annotation!: AnnotationSummaryDto | null;
}

export class CatalogObjectsPageDto {
  @ApiProperty({ type: [CatalogObjectSummaryDto] })
  items!: CatalogObjectSummaryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class SchemaSummaryDto {
  @ApiProperty() schemaName!: string;
  @ApiProperty({ description: 'Objetos observados' }) objects!: number;
  @ApiProperty() notObserved!: number;
  @ApiProperty({ description: 'Objetos con ficha' }) annotated!: number;
  @ApiProperty({
    description: 'Objetos con la ficha aprobada en su revisión vigente',
  })
  approved!: number;
}

export class GovernanceDto {
  @ApiProperty({ format: 'uuid' }) entityRegistryId!: string;
  @ApiPropertyOptional({ nullable: true }) ownerTeam!: string | null;
  @ApiPropertyOptional({ nullable: true }) containsPii!: boolean | null;
  @ApiPropertyOptional({ nullable: true }) containsPhi!: boolean | null;
  @ApiProperty() isAppendOnly!: boolean;
  @ApiProperty() isSoftDelete!: boolean;
  @ApiProperty() hasHistory!: boolean;
}

export class CoverageOfObjectDto {
  @ApiProperty({ enum: ['COMPLETE', 'INCOMPLETE'] }) technical!: string;
  @ApiProperty({ enum: ['COMPLETE', 'DECLARED_DEBT', 'MISSING'] })
  semantic!: string;
  @ApiProperty({ enum: ['COMPLETE', 'MISSING'] }) ownership!: string;
  @ApiProperty({ enum: ['KNOWN', 'UNKNOWN'] }) sensitivity!: string;
  @ApiProperty({ enum: ['APPROVED_CURRENT', 'NOT_APPROVED'] }) review!: string;
  @ApiProperty({ type: [String] }) missingFields!: string[];
}

export class ObjectTechnicalDto {
  @ApiProperty() sourceCode!: string;
  @ApiProperty() schemaName!: string;
  @ApiProperty() objectName!: string;
  @ApiProperty({ enum: OBJECT_KINDS }) objectKind!: string;
  @ApiPropertyOptional({ nullable: true }) comment!: string | null;
  @ApiProperty() columnCount!: number;
  @ApiProperty({ type: [String] }) primaryKey!: string[];
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Estadísticas con el método con que se obtuvieron',
  })
  statistics!: StatisticsDto & { method: string };
}

export class ObjectObservationDto {
  @ApiProperty({ enum: OBSERVATION_STATUSES }) status!: string;
  @ApiProperty({ type: String, format: 'date-time' }) lastSeenAt!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  notObservedSince!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastScanEngineVersion!:
    string | null;
}

export class CatalogObjectDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: ObjectTechnicalDto }) technical!: ObjectTechnicalDto;
  @ApiProperty({ type: ObjectObservationDto })
  observation!: ObjectObservationDto;
  @ApiPropertyOptional({ type: AnnotationDto, nullable: true })
  annotation!: AnnotationDto | null;
  @ApiProperty({ type: CoverageOfObjectDto }) coverage!: CoverageOfObjectDto;
  @ApiPropertyOptional({
    type: GovernanceDto,
    nullable: true,
    description:
      'Del registro de gobierno (`system_ops.entity_registry`), si el objeto figura',
  })
  governance!: GovernanceDto | null;
  @ApiProperty() evidenceCount!: number;
}

export class ForeignKeyDto {
  @ApiProperty() constraintName!: string;
  @ApiProperty({ type: [String] }) sourceColumns!: string[];
  @ApiProperty() targetSchema!: string;
  @ApiProperty() targetTable!: string;
  @ApiProperty({ type: [String] }) targetColumns!: string[];
}

export class CatalogColumnDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() columnName!: string;
  @ApiProperty() ordinal!: number;
  @ApiProperty() nativeType!: string;
  @ApiProperty() isNullable!: boolean;
  @ApiPropertyOptional({ nullable: true }) defaultExpression!: string | null;
  @ApiProperty() isIdentity!: boolean;
  @ApiProperty() isGenerated!: boolean;
  @ApiProperty() isPrimaryKey!: boolean;
  @ApiProperty({
    description: 'Única por sí sola (PK o restricción única de una columna)',
  })
  isUnique!: boolean;
  @ApiPropertyOptional({
    type: ForeignKeyDto,
    nullable: true,
    description: 'Una FK compuesta figura en su primera columna',
  })
  foreignKey!: ForeignKeyDto | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Comentario de la base (`COMMENT ON COLUMN`)',
  })
  comment!: string | null;
  @ApiProperty({ enum: OBSERVATION_STATUSES }) observationStatus!: string;
  @ApiProperty({ type: String, format: 'date-time' }) lastSeenAt!: string;
  @ApiPropertyOptional({ type: AnnotationDto, nullable: true })
  annotation!: AnnotationDto | null;
}

export class CatalogColumnsDto {
  @ApiProperty({ format: 'uuid' }) objectId!: string;
  @ApiProperty({ type: [CatalogColumnDto] }) items!: CatalogColumnDto[];
}

export class EvidenceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: EVIDENCE_KINDS }) kind!: string;
  @ApiProperty() reference!: string;
  @ApiPropertyOptional({ nullable: true }) excerpt!: string | null;
  @ApiPropertyOptional({ nullable: true }) sourceRevision!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) addedByUserId!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

/** Qué regla clasificó una columna y con cuánta confianza (sólo revisiones de la clasificación automática). */
export class ClassificationRecordDto {
  @ApiProperty({ minimum: 0, maximum: 1 }) confidence!: number;
  @ApiProperty({ description: 'Identidad y versión del clasificador' })
  classifiedBy!: string;
  @ApiProperty() ruleId!: string;
  @ApiProperty({ description: 'Norma o identificador que sustenta la regla' })
  basis!: string;
}

export class RevisionDto {
  @ApiProperty() revisionNo!: number;
  @ApiProperty({ enum: ANNOTATION_ORIGINS }) origin!: string;
  @ApiPropertyOptional({ nullable: true, type: ClassificationRecordDto })
  classification!: ClassificationRecordDto | null;
  @ApiProperty() submittedStatus!: string;
  @ApiPropertyOptional({ nullable: true }) changeReason!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) authorUserId!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class ReviewDecisionDto {
  @ApiProperty() revisionNo!: number;
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] }) decision!: string;
  @ApiPropertyOptional({ nullable: true }) comment!: string | null;
  @ApiProperty({ format: 'uuid' }) reviewerUserId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) decidedAt!: string;
}

export class AnnotationHistoryDto {
  @ApiPropertyOptional({ type: AnnotationDto, nullable: true })
  annotation!: AnnotationDto | null;
  @ApiProperty({
    type: [RevisionDto],
    description: 'De la más reciente a la más antigua',
  })
  revisions!: RevisionDto[];
  @ApiProperty({ type: [ReviewDecisionDto] }) decisions!: ReviewDecisionDto[];
}

export class ChangeEventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) scanRunId!: string;
  @ApiProperty({ format: 'uuid' }) objectId!: string;
  @ApiPropertyOptional({ nullable: true }) object!: string | null;
  @ApiPropertyOptional({ nullable: true }) column!: string | null;
  @ApiProperty({ enum: ['ADDED', 'CHANGED', 'NOT_OBSERVED', 'REAPPEARED'] })
  changeKind!: string;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  before!: Record<string, unknown> | null;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  after!: Record<string, unknown> | null;
  @ApiProperty({ type: String, format: 'date-time' }) detectedAt!: string;
}

export class ChangesPageDto {
  @ApiProperty({ type: [ChangeEventDto] }) items!: ChangeEventDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class ImpactNodeDto {
  @ApiProperty({ format: 'uuid' }) objectId!: string;
  @ApiProperty() depth!: number;
  @ApiPropertyOptional({ nullable: true }) schemaName!: string | null;
  @ApiPropertyOptional({ nullable: true }) objectName!: string | null;
  @ApiPropertyOptional({ nullable: true }) objectKind!: string | null;
  @ApiPropertyOptional({ nullable: true, enum: REVIEW_STATUSES })
  reviewStatus!: string | null;
  @ApiPropertyOptional({ nullable: true }) owner!: string | null;
}

export class ImpactEdgeDto {
  @ApiProperty({ format: 'uuid' }) fromObjectId!: string;
  @ApiProperty({ format: 'uuid' }) toObjectId!: string;
  @ApiProperty() constraintName!: string;
  @ApiProperty({ type: [String] }) fromColumns!: string[];
  @ApiProperty({ type: [String] }) toColumns!: string[];
  @ApiProperty({ example: 'REFERENCES' }) kind!: string;
  @ApiProperty({ example: 'STRUCTURAL_FK_OBSERVED' }) provenance!: string;
}

export class ImpactDto {
  @ApiProperty({ format: 'uuid' }) root!: string;
  @ApiProperty({ enum: ['downstream', 'upstream', 'both'] }) direction!: string;
  @ApiProperty() maxDepth!: number;
  @ApiProperty({ type: [ImpactNodeDto] }) nodes!: ImpactNodeDto[];
  @ApiProperty({ type: [ImpactEdgeDto] }) edges!: ImpactEdgeDto[];
  @ApiProperty() truncated!: boolean;
  @ApiPropertyOptional({ nullable: true, enum: ['MAX_DEPTH', 'MAX_NODES'] })
  truncatedReason!: string | null;
  @ApiProperty({
    description:
      'Lo que este análisis no ve: la ausencia de aristas no prueba ausencia de dependencias',
  })
  scope!: string;
}

export class DimensionSummaryDto {
  @ApiProperty({ enum: ['MEASURED', 'NOT_APPLICABLE', 'UNKNOWN'] })
  status!: string;
  @ApiProperty() covered!: number;
  @ApiProperty() denominator!: number;
  @ApiPropertyOptional({
    nullable: true,
    description:
      '`null` cuando no hay nada que dividir: nunca un 0 % ni un 100 % inventado',
  })
  ratio!: number | null;
}

export class CoverageDimensionsDto {
  @ApiProperty({ type: DimensionSummaryDto }) technical!: DimensionSummaryDto;
  @ApiProperty({ type: DimensionSummaryDto }) semantic!: DimensionSummaryDto;
  @ApiProperty({ type: DimensionSummaryDto }) ownership!: DimensionSummaryDto;
  @ApiProperty({ type: DimensionSummaryDto }) sensitivity!: DimensionSummaryDto;
  @ApiProperty({ type: DimensionSummaryDto }) review!: DimensionSummaryDto;
}

export class CatalogCoverageDto {
  @ApiProperty() modelVersion!: string;
  @ApiProperty({ description: 'Objetos observados del alcance' })
  denominator!: number;
  @ApiProperty({
    description:
      'Objetos cuya semántica falta pero está declarada como pregunta abierta',
  })
  declaredDebt!: number;
  @ApiProperty({ type: CoverageDimensionsDto })
  dimensions!: CoverageDimensionsDto;
  @ApiProperty({ type: 'object', additionalProperties: true }) scope!: {
    sourceCode: string;
    schema: string | null;
  };
  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  lastScan!: { scanId: string; finishedAt: string | null } | null;
}

export class ScanLimitationDto {
  @ApiProperty() code!: string;
  @ApiProperty() detail!: string;
  @ApiPropertyOptional() count?: number;
}

export class ScanDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() sourceCode!: string;
  @ApiProperty({ example: 'FULL' }) mode!: string;
  @ApiProperty({ enum: SCAN_STATUSES }) status!: string;
  @ApiProperty({ type: String, format: 'date-time' }) requestedAt!: string;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  startedAt!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  finishedAt!: string | null;
  @ApiProperty() attempt!: number;
  @ApiProperty() connectorVersion!: string;
  @ApiPropertyOptional({ nullable: true }) engineVersion!: string | null;
  @ApiPropertyOptional({ nullable: true }) snapshotHash!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  counters!: Record<string, number> | null;
  @ApiProperty({ type: [String] }) excludedSchemas!: string[];
  @ApiProperty({
    type: [ScanLimitationDto],
    description: 'Lo que este escaneo no puede decir',
  })
  limitations!: ScanLimitationDto[];
  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  error!: { code: string; message: string } | null;
}

export class ScansPageDto {
  @ApiProperty({ type: [ScanDto] }) items!: ScanDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class ScanAcceptedDto {
  @ApiProperty({ format: 'uuid' }) scanId!: string;
  @ApiProperty({ enum: SCAN_STATUSES }) status!: string;
  @ApiProperty({
    description:
      '`false` si la petición repetía una `Idempotency-Key` ya usada y se devolvió el escaneo de entonces',
  })
  created!: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) acceptedAt!: string;
  @ApiProperty({ example: '/admin/catalog/scans' }) statusUrl!: string;
}

/** Respuesta de la sonda al worker (`POST /internal/catalog/scans/run-next`). */
export class RunNextResultDto {
  @ApiProperty({
    enum: [0, 1],
    description: '1 si este tick tomó un escaneo; 0 si no había nada que hacer',
  })
  claimed!: 0 | 1;
  @ApiPropertyOptional({ format: 'uuid' }) scanId?: string;
  @ApiPropertyOptional({ enum: SCAN_STATUSES }) status?: string;
  @ApiPropertyOptional({
    description:
      '`true` si el escaneo perdió su lease y no se pisó lo que otro proceso cerró',
  })
  fenced?: boolean;
}

/** Huella del inventario que leyó la importación. */
export class InventoryImportSourceDto {
  @ApiProperty({
    description:
      'Huella del inventario (la misma de `GET /admin/portal/version`)',
  })
  hash!: string;
  @ApiProperty() operaciones!: number;
  @ApiProperty() procesos!: number;
}

export class InventoryImportOperationsDto {
  @ApiProperty({ description: 'Operaciones nuevas en la base' }) added!: number;
  @ApiProperty({ description: 'Operaciones cuya huella técnica cambió' })
  changed!: number;
  @ApiProperty({
    description: 'Operaciones `NOT_OBSERVED` que volvieron a aparecer',
  })
  reappeared!: number;
  @ApiProperty({
    description: 'Operaciones que no cambiaron: no se tocó su fila',
  })
  unchanged!: number;
  @ApiProperty({
    description:
      'Operaciones que dejaron de aparecer y pasaron a `NOT_OBSERVED` (no se borran)',
  })
  notObserved!: number;
}

export class InventoryImportImpactsDto {
  @ApiProperty({ description: 'Impactos escritos en esta corrida' })
  written!: number;
  @ApiProperty({
    description:
      'Tablas que el inventario no tiene catalogadas y la sonda tampoco observó (estado actual, no sólo esta corrida)',
  })
  skippedNotCataloged!: number;
  @ApiProperty({
    description:
      'Tablas que el inventario da por catalogadas y la sonda aún no observó: correr un escaneo y volver a importar',
  })
  skippedUnresolved!: number;
}

export class InventoryImportProcessesDto {
  @ApiProperty() added!: number;
  @ApiProperty() changed!: number;
  @ApiProperty() unchanged!: number;
}

export class InventoryImportStepsDto {
  @ApiProperty({ description: 'Etapas escritas en esta corrida' })
  written!: number;
}

export class InventoryImportStepOperationsDto {
  @ApiProperty({ description: 'Enlaces etapa-operación escritos' })
  written!: number;
  @ApiProperty({
    description: 'Enlaces cuya operación no está en el inventario de endpoints',
  })
  skippedUnresolved!: number;
}

/**
 * Respuesta de la importación del inventario (`POST /internal/catalog/inventory/import`). Los
 * contadores de «escritos» son de esta corrida; los de «saltados» describen el estado actual del
 * inventario contra el catálogo.
 */
export class InventoryImportResultDto {
  @ApiProperty({ type: InventoryImportSourceDto })
  inventory!: InventoryImportSourceDto;
  @ApiProperty({ type: InventoryImportOperationsDto })
  operations!: InventoryImportOperationsDto;
  @ApiProperty({ type: InventoryImportImpactsDto })
  impacts!: InventoryImportImpactsDto;
  @ApiProperty({ type: InventoryImportProcessesDto })
  processes!: InventoryImportProcessesDto;
  @ApiProperty({ type: InventoryImportStepsDto })
  steps!: InventoryImportStepsDto;
  @ApiProperty({ type: InventoryImportStepOperationsDto })
  stepOperations!: InventoryImportStepOperationsDto;
}

/** Resultado de una corrida de la clasificación automática. */
export class ClassificationRunResultDto {
  @ApiProperty({ description: 'Columnas observadas que se miraron' })
  examined!: number;
  @ApiProperty({
    description: 'Columnas que ninguna regla reconoció: quedan sin clasificar',
  })
  unclassified!: number;
  @ApiProperty({ description: 'Fichas nuevas' }) created!: number;
  @ApiProperty({
    description: 'Fichas de la máquina subidas a un nivel más alto',
  })
  raised!: number;
  @ApiProperty({
    description:
      'De las creadas o subidas, las que quedaron en NEEDS_REVIEW por duda',
  })
  sentToReview!: number;
  @ApiProperty({ description: 'No tocadas: las escribió una persona' })
  skippedManual!: number;
  @ApiProperty({ description: 'No tocadas: ya salieron de AUTO_DETECTED' })
  skippedReviewed!: number;
  @ApiProperty({
    description: 'No tocadas: la propuesta no era más alta (nunca baja)',
  })
  skippedNotHigher!: number;
  @ApiProperty({
    description: 'No escritas: otra petición cambió la ficha antes',
  })
  conflicts!: number;
}

export class DriftRouteRefDto {
  @ApiProperty({ example: 'GET' }) method!: string;
  @ApiProperty({ example: '/admin/catalog/objects/:id' }) template!: string;
  @ApiProperty() controller!: string;
  @ApiProperty() handler!: string;
}

export class RoutesSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() public!: number;
  @ApiProperty() withRoles!: number;
  @ApiProperty({
    description: 'Autenticadas sin `@Roles`: las pasa cualquier sesión',
  })
  withoutRoles!: number;
}

export class UsedNotSeededDto {
  @ApiProperty() role!: string;
  @ApiProperty({ description: 'Cuántas rutas lo exigen' }) routeCount!: number;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Si hay fila en `authz.roles`; `null` si no se consultó',
  })
  inDatabase!: boolean | null;
  @ApiProperty({ type: [DriftRouteRefDto] }) sample!: DriftRouteRefDto[];
}

/** Rutas contra roles: qué se exige que nadie siembra, qué se siembra que nadie exige. */
export class PermissionDriftDto {
  @ApiProperty({ type: String, format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ type: RoutesSummaryDto }) routes!: RoutesSummaryDto;
  @ApiProperty({
    type: [UsedNotSeededDto],
    description:
      'Roles que una ruta exige y la API no siembra: sólo `SUPERADMIN` (por comodín) ejerce esas rutas hasta que exista el rol',
  })
  usedNotSeeded!: UsedNotSeededDto[];
  @ApiProperty({
    type: [String],
    description: 'Roles sembrados que ninguna ruta exige',
  })
  seededNotUsed!: string[];
  @ApiProperty({
    type: [DriftRouteRefDto],
    description: 'Rutas autenticadas sin `@Roles` ni `@Public` (recortada)',
  })
  routesWithoutRoles!: DriftRouteRefDto[];
  @ApiProperty({
    description:
      '`true` si `routesWithoutRoles` se recortó; el total está en `routes.withoutRoles`',
  })
  routesWithoutRolesTruncated!: boolean;
}
