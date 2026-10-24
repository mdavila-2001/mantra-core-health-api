import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ErrorCode } from '../../../common/errors/error-codes';
import {
  ConcurrencyConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common/errors/domain.exception';
import {
  applyPatch,
  contentHash,
  EMPTY_CONTENT,
  reviewVerdict,
  submissionViolations,
  type ContentPatch,
} from '../catalog/annotation.rules';
import { TEXT_FIELDS } from '../catalog/catalog.constants';
import type {
  AnnotationPatchDto,
  EvidenceInputDto,
  ReviewInputDto,
} from '../dto/catalog-request.dto';
import { CatalogRepository } from '../repositories/catalog.repository';
import { presentarEvidencia, presentarFicha } from './catalog-read.service';

/** `true` si el error es la violación de unicidad de Postgres (la ficha ya la creó otra petición). */
function esUnicidad(error: unknown): boolean {
  const e = error as { code?: string; message?: string };
  return (
    e?.code === '23505' ||
    /duplicate key|unique constraint/i.test(e?.message ?? '')
  );
}

/**
 * Escrituras del catálogo vivo: edición de fichas con versión, evidencia y revisión.
 *
 * Reglas: la edición exige la versión leída (`expectedVersion`, 409 si cambió); enviar a revisión
 * exige respuestas que expliquen; quien escribió la revisión vigente no la decide; un rechazo se
 * explica y una aprobación tiene evidencia. Cada edición deja una revisión inmutable. La API es la
 * autoridad: el frontend sólo refleja estas reglas.
 */
@Injectable()
export class CatalogGovernanceService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogRepository,
  ) {}

  /** Crea (`expectedVersion` 0) o edita la ficha del objeto. Devuelve la ficha resultante. */
  async saveAnnotation(
    userId: string,
    objectId: string,
    dto: AnnotationPatchDto,
  ) {
    return this.em.fork().transactional(async (tx) => {
      if (!(await this.repo.objectById(tx, objectId)))
        throw new ResourceNotFoundException(
          'Objeto del catálogo no encontrado',
        );
      const ficha = await this.repo.annotationOfObject(tx, objectId);
      const version = ficha?.row_version ?? 0;
      if (dto.expectedVersion !== version)
        throw new ConcurrencyConflictException(
          'La ficha cambió desde que se leyó',
          {
            expectedVersion: dto.expectedVersion,
            latestVersion: version,
          },
        );

      const proximo = applyPatch(ficha?.content ?? EMPTY_CONTENT, parche(dto));
      if (dto.submit) {
        const violations = submissionViolations(proximo);
        if (violations.length)
          throw new DomainException(
            422,
            ErrorCode.VALIDATION_FAILED,
            'La ficha no puede enviarse a revisión todavía',
            { violations },
          );
      }
      const estado = dto.submit ? 'NEEDS_REVIEW' : 'DRAFT';
      const revisionNo = (ficha?.current_revision_no ?? 0) + 1;
      let id: string;
      if (!ficha) {
        try {
          id = (
            await this.repo.insertAnnotation(tx, {
              objectId,
              content: proximo,
              reviewStatus: estado,
              userId,
            })
          ).id;
        } catch (error) {
          if (esUnicidad(error))
            throw new ConcurrencyConflictException(
              'La ficha cambió desde que se leyó',
              {
                expectedVersion: 0,
              },
            );
          throw error;
        }
      } else {
        id = ficha.id;
        const ok = await this.repo.updateAnnotation(tx, id, version, {
          content: proximo,
          reviewStatus: estado,
          revisionNo,
          userId,
        });
        if (!ok)
          throw new ConcurrencyConflictException(
            'La ficha cambió desde que se leyó',
            {
              expectedVersion: version,
            },
          );
      }
      await this.repo.insertRevision(tx, {
        annotationId: id,
        revisionNo,
        content: proximo,
        contentHash: contentHash(proximo),
        submittedStatus: estado,
        changeReason: dto.changeReason?.trim() || null,
        authorId: userId,
      });
      return presentarFicha(await this.repo.annotationById(tx, id));
    });
  }

  async addEvidence(userId: string, objectId: string, dto: EvidenceInputDto) {
    return this.em.fork().transactional(async (tx) => {
      if (!(await this.repo.objectById(tx, objectId)))
        throw new ResourceNotFoundException(
          'Objeto del catálogo no encontrado',
        );
      const fila = await this.repo.addEvidence(tx, {
        objectId,
        kind: dto.kind,
        reference: dto.reference.trim(),
        excerpt: dto.excerpt?.trim() || null,
        sourceRevision: dto.sourceRevision?.trim() || null,
        userId,
      });
      return presentarEvidencia(fila);
    });
  }

  /** Decide sobre la revisión vigente de una ficha. */
  async review(userId: string, annotationId: string, dto: ReviewInputDto) {
    return this.em.fork().transactional(async (tx) => {
      const ficha = await this.repo.annotationById(tx, annotationId);
      if (!ficha) throw new ResourceNotFoundException('Ficha no encontrada');
      const veredicto = reviewVerdict(
        {
          reviewStatus: ficha.review_status,
          currentRevisionNo: ficha.current_revision_no,
          revisionAuthorId: await this.repo.revisionAuthor(
            tx,
            ficha.id,
            ficha.current_revision_no,
          ),
          evidenceCount: await this.repo.evidenceCount(tx, ficha.object_id),
        },
        dto,
        userId,
      );
      if (!veredicto.ok) {
        const { kind, message } = veredicto;
        switch (kind) {
          case 'STALE_REVISION':
            throw new ConcurrencyConflictException(message, {
              expectedRevisionNo: dto.expectedRevisionNo,
              latestRevisionNo: ficha.current_revision_no,
            });
          case 'SELF_REVIEW':
            throw new DomainException(403, ErrorCode.FORBIDDEN, message, {
              violations: [
                { field: 'reviewer', reason: 'SELF_REVIEW', message },
              ],
            });
          case 'REJECTION_NEEDS_REASON':
            throw new DomainException(
              422,
              ErrorCode.VALIDATION_FAILED,
              message,
              {
                violations: [{ field: 'comment', reason: kind, message }],
              },
            );
          default:
            throw new PreconditionFailedException(message, { reason: kind });
        }
      }
      const decidida = await this.repo.decide(tx, {
        annotationId: ficha.id,
        revisionNo: ficha.current_revision_no,
        decision: dto.decision,
        comment: dto.comment?.trim() || null,
        reviewerId: userId,
      });
      if (!decidida)
        throw new ConcurrencyConflictException(
          'La ficha cambió mientras se revisaba',
        );
      return presentarFicha(await this.repo.annotationById(tx, ficha.id));
    });
  }
}

/** Sólo lo que vino: `undefined` es «no tocar», `null` es «borrar». */
function parche(dto: AnnotationPatchDto): ContentPatch {
  const p: ContentPatch = {};
  for (const campo of TEXT_FIELDS) {
    const valor = (
      dto as Partial<Record<(typeof TEXT_FIELDS)[number], string | null>>
    )[campo];
    if (valor !== undefined) p[campo] = valor;
  }
  if (dto.consumers !== undefined) p.consumers = dto.consumers;
  if (dto.sensitivity !== undefined) p.sensitivity = dto.sensitivity;
  if (dto.openQuestions !== undefined) p.openQuestions = dto.openQuestions;
  return p;
}
