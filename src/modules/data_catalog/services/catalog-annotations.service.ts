import { HttpStatus, Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  type AuthenticatedUser,
} from '../../../common';
import {
  contentHash,
  mergeContent,
  misplacedFields,
  reviewViolations,
  submissionViolations,
  type PolicyViolation,
  type ReviewStatus,
  type TargetKind,
} from '../domain';
import {
  AddEvidenceDto,
  ReviewAnnotationDto,
  UpsertAnnotationDto,
} from '../dto';
import {
  CatalogAnnotationRevisions,
  CatalogAnnotations,
  CatalogColumns,
  CatalogEvidenceItems,
  CatalogObjects,
  CatalogReviewDecisions,
} from '../entities';
import {
  annotationView,
  applyContent,
  evidenceView,
  toContent,
  type AnnotationView,
} from './catalog.views';

/** A qué apunta una ficha: una tabla, o una columna de una tabla. */
export interface AnnotationTarget {
  kind: TargetKind;
  objectId: string;
  columnId: string | null;
  technicalName: string;
}

/** 422 con la lista de reglas incumplidas, para que el portal marque cada campo. */
export class CatalogValidationException extends DomainException {
  constructor(message: string, violations: PolicyViolation[]) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_FAILED,
      message,
      {
        violations,
      },
    );
  }
}

/**
 * Fichas de negocio: edición con concurrencia optimista, revisiones
 * inmutables, decisión de revisión con segregación de funciones y evidencia.
 *
 * Invariante central: una aprobación se liga a un número de revisión. Editar
 * una ficha aprobada crea una revisión nueva que vuelve a necesitar revisión;
 * lo aprobado sigue consultable en el historial, pero ya no es lo vigente.
 */
@Injectable()
export class CatalogAnnotationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogAnnotationsService.name);
  }

  /** Resuelve el destino y falla con 404 si no existe. */
  async resolveObjectTarget(
    tx: EntityManager,
    objectId: string,
  ): Promise<AnnotationTarget> {
    const object = await tx.findOne(CatalogObjects, { id: objectId });
    if (!object)
      throw new ResourceNotFoundException('Objeto de catálogo no encontrado', {
        objectId,
      });
    return {
      kind: 'OBJECT',
      objectId,
      columnId: null,
      technicalName: object.objectName,
    };
  }

  async resolveColumnTarget(
    tx: EntityManager,
    columnId: string,
  ): Promise<AnnotationTarget> {
    const column = await tx.findOne(CatalogColumns, { id: columnId });
    if (!column)
      throw new ResourceNotFoundException('Columna de catálogo no encontrada', {
        columnId,
      });
    return {
      kind: 'COLUMN',
      objectId: column.objectId,
      columnId,
      technicalName: column.columnName,
    };
  }

  private findAnnotation(
    tx: EntityManager,
    target: AnnotationTarget,
    lock = false,
  ) {
    const where =
      target.kind === 'OBJECT'
        ? { objectId: target.objectId, targetKind: 'OBJECT' }
        : { columnId: target.columnId! };
    return tx.findOne(
      CatalogAnnotations,
      where,
      lock ? { lockMode: LockMode.PESSIMISTIC_WRITE } : {},
    );
  }

  upsertForObject(
    objectId: string,
    dto: UpsertAnnotationDto,
    actor: AuthenticatedUser,
  ) {
    return this.em.transactional(async (tx) =>
      this.upsert(tx, await this.resolveObjectTarget(tx, objectId), dto, actor),
    );
  }

  upsertForColumn(
    columnId: string,
    dto: UpsertAnnotationDto,
    actor: AuthenticatedUser,
  ) {
    return this.em.transactional(async (tx) =>
      this.upsert(tx, await this.resolveColumnTarget(tx, columnId), dto, actor),
    );
  }

  private async upsert(
    tx: EntityManager,
    target: AnnotationTarget,
    dto: UpsertAnnotationDto,
    actor: AuthenticatedUser,
  ): Promise<AnnotationView> {
    const { expectedVersion, submit = false, changeReason, ...patch } = dto;
    const misplaced = misplacedFields(target.kind, patch);
    if (misplaced.length > 0) {
      throw new CatalogValidationException(
        'La ficha tiene campos que no aplican',
        misplaced,
      );
    }

    const annotation = await this.findAnnotation(tx, target, true);
    const currentVersion = annotation?.rowVersion ?? 0;
    if (expectedVersion !== currentVersion) {
      // El segundo escritor no pisa: recibe la versión vigente y conserva su borrador.
      throw new ConcurrencyConflictException(
        'La ficha cambió desde que se leyó',
        {
          expectedVersion,
          latestVersion: currentVersion,
        },
      );
    }

    const next = mergeContent(annotation ? toContent(annotation) : null, patch);
    const status: ReviewStatus = submit ? 'NEEDS_REVIEW' : 'DRAFT';
    if (submit) {
      const violations = submissionViolations(
        target.kind,
        next,
        target.technicalName,
      );
      if (violations.length > 0) {
        throw new CatalogValidationException(
          'La ficha no puede enviarse a revisión todavía',
          violations,
        );
      }
    }

    const hash = contentHash(next);
    if (annotation) {
      const last = await tx.findOne(CatalogAnnotationRevisions, {
        annotationId: annotation.id,
        revisionNo: annotation.currentRevisionNo,
      });
      const resubmission =
        submit && ['DRAFT', 'REJECTED'].includes(annotation.reviewStatus);
      if (last?.contentHash === hash && !resubmission) {
        // Idempotente: el mismo contenido no crea revisión ni reinicia la revisión.
        return annotationView(annotation);
      }
    }

    const now = new Date();
    const entity =
      annotation ??
      tx.create(
        CatalogAnnotations,
        {
          targetKind: target.kind,
          objectId: target.objectId,
          columnId: target.columnId ?? undefined,
          sensitivity: 'UNKNOWN',
          reviewStatus: status,
          origin: 'MANUAL',
          currentRevisionNo: 0,
          ...createdBy(actor.id, now),
        },
        { partial: true },
      );
    applyContent(entity, next);
    entity.reviewStatus = status;
    entity.origin = 'MANUAL';
    entity.currentRevisionNo += 1;
    entity.updatedAt = now;
    entity.updatedByUserId = actor.id;
    // Las FK son uuid planos: el ORM no sabe que la revisión depende de la
    // ficha, así que la ficha tiene que existir antes (mismo transaction).
    await tx.flush();

    tx.create(CatalogAnnotationRevisions, {
      annotationId: entity.id,
      revisionNo: entity.currentRevisionNo,
      contentJson: next,
      contentHash: hash,
      origin: 'MANUAL',
      submittedStatus: status,
      changeReason,
      authorUserId: actor.id,
      createdAt: now,
    });
    await tx.flush();
    this.logger.info(
      {
        operation: 'catalog.annotation.upsert',
        annotationId: entity.id,
        targetKind: target.kind,
        revisionNo: entity.currentRevisionNo,
        status,
      },
      'Catalog annotation revised',
    );
    return annotationView(entity);
  }

  /**
   * Decide sobre la revisión vigente. La segregación se comprueba contra el
   * autor de esa revisión concreta, no contra el rol: SUPERADMIN tampoco se
   * aprueba a sí mismo.
   */
  async review(
    annotationId: string,
    dto: ReviewAnnotationDto,
    actor: AuthenticatedUser,
  ): Promise<AnnotationView> {
    return this.em.transactional(async (tx) => {
      const annotation = await tx.findOne(
        CatalogAnnotations,
        { id: annotationId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!annotation)
        throw new ResourceNotFoundException('Ficha no encontrada', {
          annotationId,
        });
      if (dto.expectedRevisionNo !== annotation.currentRevisionNo) {
        throw new ConcurrencyConflictException(
          'La ficha tiene una revisión más reciente que la revisada',
          {
            expectedRevisionNo: dto.expectedRevisionNo,
            currentRevisionNo: annotation.currentRevisionNo,
          },
        );
      }
      const revision = await tx.findOne(CatalogAnnotationRevisions, {
        annotationId,
        revisionNo: annotation.currentRevisionNo,
      });
      const evidenceCount = await tx.count(CatalogEvidenceItems, {
        objectId: annotation.objectId,
        columnId: annotation.columnId ?? null,
      });
      const violations = reviewViolations({
        status: annotation.reviewStatus as ReviewStatus,
        currentRevisionNo: annotation.currentRevisionNo,
        expectedRevisionNo: dto.expectedRevisionNo,
        revisionAuthorId: revision?.authorUserId ?? null,
        reviewerId: actor.id,
        decision: dto.decision,
        comment: dto.comment,
        evidenceCount,
      });
      if (violations.some((violation) => violation.reason === 'SELF_REVIEW')) {
        throw new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'Quien escribió la revisión no puede decidir sobre ella',
          { violations },
        );
      }
      if (
        violations.some(
          (violation) => violation.reason === 'REJECTION_NEEDS_COMMENT',
        )
      ) {
        throw new CatalogValidationException(
          'El rechazo necesita un comentario',
          violations,
        );
      }
      if (violations.length > 0) {
        throw new PreconditionFailedException(violations[0].message, {
          violations,
        });
      }

      const now = new Date();
      tx.create(CatalogReviewDecisions, {
        annotationId,
        revisionNo: annotation.currentRevisionNo,
        decision: dto.decision,
        comment: dto.comment?.trim() || undefined,
        reviewerUserId: actor.id,
        decidedAt: now,
      });
      annotation.reviewStatus = dto.decision;
      if (dto.decision === 'APPROVED') {
        annotation.approvedRevisionNo = annotation.currentRevisionNo;
        annotation.approvedByUserId = actor.id;
        annotation.approvedAt = now;
      }
      annotation.updatedAt = now;
      annotation.updatedByUserId = actor.id;
      await tx.flush();
      this.logger.info(
        {
          operation: 'catalog.annotation.review',
          annotationId,
          revisionNo: annotation.currentRevisionNo,
          decision: dto.decision,
        },
        'Catalog annotation reviewed',
      );
      return annotationView(annotation);
    });
  }

  addEvidenceToObject(
    objectId: string,
    dto: AddEvidenceDto,
    actor: AuthenticatedUser,
  ) {
    return this.em.transactional(async (tx) =>
      this.addEvidence(
        tx,
        await this.resolveObjectTarget(tx, objectId),
        dto,
        actor,
      ),
    );
  }

  addEvidenceToColumn(
    columnId: string,
    dto: AddEvidenceDto,
    actor: AuthenticatedUser,
  ) {
    return this.em.transactional(async (tx) =>
      this.addEvidence(
        tx,
        await this.resolveColumnTarget(tx, columnId),
        dto,
        actor,
      ),
    );
  }

  private async addEvidence(
    tx: EntityManager,
    target: AnnotationTarget,
    dto: AddEvidenceDto,
    actor: AuthenticatedUser,
  ) {
    const item = tx.create(CatalogEvidenceItems, {
      objectId: target.objectId,
      columnId: target.columnId ?? undefined,
      kind: dto.kind,
      reference: dto.reference.trim(),
      excerpt: dto.excerpt?.trim() || undefined,
      sourceRevision: dto.sourceRevision?.trim() || undefined,
      addedByUserId: actor.id,
      createdAt: new Date(),
    });
    await tx.flush();
    return evidenceView(item);
  }

  async listEvidenceForObject(objectId: string) {
    const target = await this.resolveObjectTarget(this.em, objectId);
    return this.listEvidence(target);
  }

  async listEvidenceForColumn(columnId: string) {
    const target = await this.resolveColumnTarget(this.em, columnId);
    return this.listEvidence(target);
  }

  private async listEvidence(target: AnnotationTarget) {
    const items = await this.em.find(
      CatalogEvidenceItems,
      { objectId: target.objectId, columnId: target.columnId ?? null },
      { orderBy: { createdAt: 'desc', id: 'desc' }, limit: 200 },
    );
    return items.map(evidenceView);
  }

  async historyForObject(objectId: string) {
    return this.history(await this.resolveObjectTarget(this.em, objectId));
  }

  async historyForColumn(columnId: string) {
    return this.history(await this.resolveColumnTarget(this.em, columnId));
  }

  /** Historial de la ficha: revisiones y decisiones, de la más reciente a la más antigua. */
  private async history(target: AnnotationTarget) {
    const annotation = await this.findAnnotation(this.em, target);
    if (!annotation) return { annotation: null, revisions: [], decisions: [] };
    const [revisions, decisions] = await Promise.all([
      this.em.find(
        CatalogAnnotationRevisions,
        { annotationId: annotation.id },
        { orderBy: { revisionNo: 'desc' }, limit: 100 },
      ),
      this.em.find(
        CatalogReviewDecisions,
        { annotationId: annotation.id },
        { orderBy: { decidedAt: 'desc', id: 'desc' }, limit: 100 },
      ),
    ]);
    return {
      annotation: annotationView(annotation),
      revisions: revisions.map((revision) => ({
        revisionNo: revision.revisionNo,
        origin: revision.origin,
        submittedStatus: revision.submittedStatus,
        changeReason: revision.changeReason ?? null,
        authorUserId: revision.authorUserId ?? null,
        createdAt: revision.createdAt.toISOString(),
        contentHash: revision.contentHash,
        content: revision.contentJson,
      })),
      decisions: decisions.map((decision) => ({
        revisionNo: decision.revisionNo,
        decision: decision.decision,
        comment: decision.comment ?? null,
        reviewerUserId: decision.reviewerUserId,
        decidedAt: decision.decidedAt.toISOString(),
      })),
    };
  }
}
