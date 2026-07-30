import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DraftRepository } from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import { CreateDraftDto, DraftResponseDto, PublishDraftDto } from '../dto';

/**
 * UC-11-15: guarda y publica un draft record genérico.
 *
 * El borrador se materializa contra su tabla destino al publicar (dentro de la
 * misma tx) y deja una revisión append-only en `record_revisions`. Solo el dueño
 * (owner_user_id) puede publicar, y solo desde estado DRAFT; `publish_reference`
 * da idempotencia frente a doble materialización.
 */
@Injectable()
export class DraftService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: DraftRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DraftService.name);
  }

  /** UC-11-15: guarda un borrador (DRAFT) del que el actor es dueño. */
  async createDraft(
    dto: CreateDraftDto,
    actor: AuthenticatedUser,
  ): Promise<DraftResponseDto> {
    return this.em.transactional(async (tx) => {
      const draft = this.repo.create(tx, {
        schemaName: dto.schemaName,
        tableName: dto.tableName,
        targetRecordId: dto.targetRecordId,
        ownerUserId: actor.id,
        tenantId: dto.tenantId,
        draftLabel: dto.draftLabel,
        payloadJson: dto.payloadJson,
        statusConceptId: SYSOPS.DRAFT,
        schemaVersion: dto.schemaVersion,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: draft.id,
        statusConceptId: draft.statusConceptId,
        publishedRecordId: undefined,
      };
    });
  }

  /** UC-11-15: publica un borrador DRAFT -> PUBLISHED y materializa el registro. */
  async publishDraft(
    id: string,
    dto: PublishDraftDto,
    actor: AuthenticatedUser,
  ): Promise<DraftResponseDto> {
    return this.em.transactional(async (tx) => {
      const draft = await this.repo.findById(tx, id);
      if (!draft)
        throw new ResourceNotFoundException('Borrador no encontrado', { id });
      if (draft.ownerUserId !== actor.id) {
        throw new PreconditionFailedException(
          'Solo el dueño del borrador puede publicarlo',
          { id },
        );
      }
      if (draft.statusConceptId !== SYSOPS.DRAFT) {
        throw new PreconditionFailedException(
          'El borrador no está en estado DRAFT',
          { id },
        );
      }

      const publishedRecordId = draft.targetRecordId ?? randomUUID();
      const operationConceptId = draft.targetRecordId
        ? SYSOPS.OP_UPDATE
        : SYSOPS.OP_INSERT;

      draft.statusConceptId = SYSOPS.PUBLISHED;
      draft.publishedRecordId = publishedRecordId;
      touch(draft, actor.id);

      // Revisión append-only del registro materializado (idempotencia por reference).
      this.repo.createRevision(tx, {
        schemaName: draft.schemaName,
        tableName: draft.tableName,
        recordId: publishedRecordId,
        operationConceptId,
        dataSnapshot: {
          payload: draft.payloadJson,
          publishReference: dto.publishReference,
        },
        changedByUserId: actor.id,
      });

      this.logger.info(
        { operation: 'sysops.draft.publish', draftId: draft.id },
        'Draft published',
      );
      return {
        id: draft.id,
        statusConceptId: draft.statusConceptId,
        publishedRecordId,
      };
    });
  }
}
