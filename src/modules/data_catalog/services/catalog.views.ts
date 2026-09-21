import type { AnnotationContent, OpenQuestion, Sensitivity } from '../domain';
import type {
  CatalogAnnotations,
  CatalogColumns,
  CatalogEvidenceItems,
  CatalogScanRuns,
} from '../entities';

/**
 * Traducción de entidades a la forma pública del contrato. Aquí se decide qué
 * sale por HTTP; nada de la entidad viaja por accidente.
 */

const iso = (date: Date | null | undefined) =>
  date ? date.toISOString() : null;

export function toContent(annotation: CatalogAnnotations): AnnotationContent {
  return {
    businessName: annotation.businessName ?? null,
    definition: annotation.definition ?? null,
    purpose: annotation.purpose ?? null,
    existenceRationale: annotation.existenceRationale ?? null,
    rowGrain: annotation.rowGrain ?? null,
    alternativesRationale: annotation.alternativesRationale ?? null,
    processSupported: annotation.processSupported ?? null,
    sourceOfTruth: annotation.sourceOfTruth ?? null,
    producers: (annotation.producers as string[] | undefined) ?? [],
    consumers: (annotation.consumers as string[] | undefined) ?? [],
    deletionImpact: annotation.deletionImpact ?? null,
    businessOwner: annotation.businessOwner ?? null,
    dataSteward: annotation.dataSteward ?? null,
    technicalOwner: annotation.technicalOwner ?? null,
    unit: annotation.unit ?? null,
    valueDomain: annotation.valueDomain ?? null,
    nullSemantics: annotation.nullSemantics ?? null,
    sensitivity: (annotation.sensitivity as Sensitivity) ?? 'UNKNOWN',
    openQuestions:
      (annotation.openQuestions as OpenQuestion[] | undefined) ?? [],
  };
}

/** Copia el contenido a la entidad; `null` se guarda como ausencia. */
export function applyContent(
  annotation: CatalogAnnotations,
  content: AnnotationContent,
): void {
  const text = (value: string | null) => value ?? undefined;
  annotation.businessName = text(content.businessName);
  annotation.definition = text(content.definition);
  annotation.purpose = text(content.purpose);
  annotation.existenceRationale = text(content.existenceRationale);
  annotation.rowGrain = text(content.rowGrain);
  annotation.alternativesRationale = text(content.alternativesRationale);
  annotation.processSupported = text(content.processSupported);
  annotation.sourceOfTruth = text(content.sourceOfTruth);
  annotation.producers = content.producers;
  annotation.consumers = content.consumers;
  annotation.deletionImpact = text(content.deletionImpact);
  annotation.businessOwner = text(content.businessOwner);
  annotation.dataSteward = text(content.dataSteward);
  annotation.technicalOwner = text(content.technicalOwner);
  annotation.unit = text(content.unit);
  annotation.valueDomain = text(content.valueDomain);
  annotation.nullSemantics = text(content.nullSemantics);
  annotation.sensitivity = content.sensitivity;
  annotation.openQuestions = content.openQuestions;
}

export function annotationView(annotation: CatalogAnnotations) {
  return {
    id: annotation.id,
    targetKind: annotation.targetKind,
    objectId: annotation.objectId,
    columnId: annotation.columnId ?? null,
    /** Lo que el cliente devuelve como `expectedVersion` al editar. */
    version: annotation.rowVersion,
    reviewStatus: annotation.reviewStatus,
    origin: annotation.origin,
    currentRevisionNo: annotation.currentRevisionNo,
    approvedRevisionNo: annotation.approvedRevisionNo ?? null,
    approvedByUserId: annotation.approvedByUserId ?? null,
    approvedAt: iso(annotation.approvedAt),
    /** true si lo aprobado es exactamente lo vigente. */
    approvalIsCurrent:
      annotation.reviewStatus === 'APPROVED' &&
      annotation.approvedRevisionNo === annotation.currentRevisionNo,
    content: toContent(annotation),
    updatedAt: iso(annotation.updatedAt),
    updatedByUserId: annotation.updatedByUserId ?? null,
  };
}
export type AnnotationView = ReturnType<typeof annotationView>;

export function scanView(scan: CatalogScanRuns) {
  const finished = scan.status === 'SUCCEEDED';
  return {
    id: scan.id,
    sourceCode: scan.sourceCode,
    mode: scan.mode,
    status: scan.status,
    requestedAt: iso(scan.requestedAt)!,
    requestedByUserId: scan.requestedByUserId ?? null,
    startedAt: iso(scan.startedAt),
    finishedAt: iso(scan.finishedAt),
    cancelRequestedAt: iso(scan.cancelRequestedAt),
    attempt: scan.attempt,
    connectorVersion: scan.connectorVersion,
    engineVersion: scan.engineVersion ?? null,
    snapshotHash: scan.snapshotHash ?? null,
    counters: finished
      ? {
          objectsObserved: scan.objectsObserved ?? 0,
          columnsObserved: scan.columnsObserved ?? 0,
          objectsAdded: scan.objectsAdded ?? 0,
          objectsChanged: scan.objectsChanged ?? 0,
          objectsNotObserved: scan.objectsNotObserved ?? 0,
          objectsReappeared: scan.objectsReappeared ?? 0,
          columnsAdded: scan.columnsAdded ?? 0,
          columnsChanged: scan.columnsChanged ?? 0,
          columnsNotObserved: scan.columnsNotObserved ?? 0,
        }
      : null,
    excludedSchemas: (scan.excludedSchemas as string[] | undefined) ?? [],
    limitations: (scan.limitations as unknown[] | undefined) ?? [],
    error: scan.errorCode
      ? { code: scan.errorCode, message: scan.errorMessage ?? '' }
      : null,
  };
}

export function columnView(
  column: CatalogColumns,
  annotation: CatalogAnnotations | undefined,
) {
  return {
    id: column.id,
    columnName: column.columnName,
    ordinal: column.ordinal,
    nativeType: column.nativeType,
    isNullable: column.isNullable,
    defaultExpression: column.defaultExpression ?? null,
    isIdentity: column.isIdentity,
    isGenerated: column.isGenerated,
    isPrimaryKey: column.isPrimaryKey,
    isUnique: column.isUnique,
    foreignKey: column.foreignKey ?? null,
    comment: column.columnComment ?? null,
    observationStatus: column.observationStatus,
    lastSeenAt: iso(column.lastSeenAt),
    annotation: annotation ? annotationView(annotation) : null,
  };
}

export function evidenceView(item: CatalogEvidenceItems) {
  return {
    id: item.id,
    objectId: item.objectId,
    columnId: item.columnId ?? null,
    kind: item.kind,
    reference: item.reference,
    excerpt: item.excerpt ?? null,
    sourceRevision: item.sourceRevision ?? null,
    addedByUserId: item.addedByUserId ?? null,
    createdAt: iso(item.createdAt),
  };
}
