import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { COMM } from '../../community/community.concepts';
import { FaqEntriesRepository, type FaqEntryRow } from '../repositories';
import type {
  CreateFaqDto,
  FaqEntryDto,
  FaqListResponseDto,
  PublicFaqListResponseDto,
  ReorderFaqsDto,
  UpdateFaqDto,
} from '../dto';
import { FormsErrorReason } from '../forms.error-reasons';
import { requirePractitionerOwner } from './practitioner-owner';
import { toIso } from './question-scripts.service';

/**
 * The FAQ a practitioner publishes for patients. The owner side is scoped to
 * the session's practitioner profile (another's entry is a 404); the public
 * side serves only published entries behind a visible practitioner profile.
 */
@Injectable()
export class FaqsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: FaqEntriesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FaqsService.name);
  }

  /** The practitioner's entries, published or not, in display order. */
  async list(actor: AuthenticatedUser): Promise<FaqListResponseDto> {
    const ownerId = requirePractitionerOwner(actor);
    return toList(await this.repo.listOwned(this.em.fork(), ownerId));
  }

  /** Adds an entry after the last one. */
  async create(
    dto: CreateFaqDto,
    actor: AuthenticatedUser,
  ): Promise<FaqEntryDto> {
    const ownerId = requirePractitionerOwner(actor);
    return this.em.transactional(async (tx) => {
      const id = await this.repo.insertLast(
        tx,
        ownerId,
        {
          question: dto.question,
          answer: dto.answer,
          category: dto.category ?? null,
          isPublished: dto.isPublished ?? false,
        },
        actor.id,
      );
      this.logger.info(
        { operation: 'forms.faq.create', faqId: id },
        'FAQ entry created',
      );
      return this.mustFind(tx, id, ownerId);
    });
  }

  /** Changes only the fields sent. */
  async update(
    id: string,
    dto: UpdateFaqDto,
    actor: AuthenticatedUser,
  ): Promise<FaqEntryDto> {
    const ownerId = requirePractitionerOwner(actor);
    return this.em.transactional(async (tx) => {
      const found = await this.repo.updateOwned(
        tx,
        id,
        ownerId,
        {
          question: dto.question,
          answer: dto.answer,
          category: dto.category,
          isPublished: dto.isPublished,
        },
        actor.id,
      );
      if (!found) throw notFound(id);
      return this.mustFind(tx, id, ownerId);
    });
  }

  /** Deletes an entry. The remaining positions keep their relative order. */
  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const ownerId = requirePractitionerOwner(actor);
    const found = await this.repo.deleteOwned(this.em.fork(), id, ownerId);
    if (!found) throw notFound(id);
    this.logger.info(
      { operation: 'forms.faq.delete', faqId: id },
      'FAQ entry deleted',
    );
  }

  /** Reorders; `ids` must be exactly the practitioner's entries. */
  async reorder(
    dto: ReorderFaqsDto,
    actor: AuthenticatedUser,
  ): Promise<FaqListResponseDto> {
    const ownerId = requirePractitionerOwner(actor);
    return this.em.transactional(async (tx) => {
      const owned = new Set(await this.repo.lockOwnedIds(tx, ownerId));
      const exact =
        owned.size === dto.ids.length && dto.ids.every((id) => owned.has(id));
      if (!exact) {
        throw new PreconditionFailedException(
          'La lista debe contener exactamente las preguntas frecuentes propias',
          { expected: owned.size, received: dto.ids.length },
          FormsErrorReason.FAQ_ORDER_MISMATCH,
        );
      }
      await this.repo.applyOrder(tx, ownerId, dto.ids, actor.id);
      return toList(await this.repo.listOwned(tx, ownerId));
    });
  }

  /** Published entries behind a visible practitioner profile slug. */
  async listPublic(slug: string): Promise<PublicFaqListResponseDto> {
    const rows = await this.repo.listPublishedBySlug(
      this.em.fork(),
      slug,
      COMM.PROFILE_TARGET_PRACTITIONER,
      COMM.PROFILE_VISIBILITY_PUBLIC,
      CONCEPTS.STATE_ACTIVE,
    );
    if (rows === null) {
      throw new ResourceNotFoundException(
        'No encontrado',
        { slug },
        FormsErrorReason.PUBLIC_PRACTITIONER_PROFILE_NOT_FOUND,
      );
    }
    return {
      items: rows.map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        category: row.category,
      })),
    };
  }

  private async mustFind(
    em: EntityManager,
    id: string,
    ownerId: string,
  ): Promise<FaqEntryDto> {
    const row = await this.repo.findOwned(em, id, ownerId);
    if (!row) throw notFound(id);
    return toEntry(row);
  }
}

function notFound(id: string): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Pregunta frecuente no encontrada',
    { faqId: id },
    FormsErrorReason.FAQ_ENTRY_OUT_OF_SCOPE,
  );
}

function toEntry(row: FaqEntryRow): FaqEntryDto {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    position: row.position,
    isPublished: row.isPublished,
    updatedAt: toIso(row.updatedAt),
  };
}

function toList(rows: FaqEntryRow[]): FaqListResponseDto {
  return { items: rows.map(toEntry) };
}
