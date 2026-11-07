import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  QuestionScriptsRepository,
  type QuestionScriptItemData,
  type QuestionScriptRow,
} from '../repositories';
import type {
  CreateQuestionScriptDto,
  QuestionScriptDto,
  QuestionScriptListResponseDto,
  UpdateQuestionScriptDto,
} from '../dto';
import { FormsErrorReason } from '../forms.error-reasons';
import { requirePractitionerOwner } from './practitioner-owner';

/**
 * The practitioner's question scripts: ordered questions used during a visit.
 *
 * Ownership is the session's practitioner profile. A script of another
 * practitioner, a missing one and an archived one all answer the same 404, so
 * the route cannot be used to learn whether an id exists.
 */
@Injectable()
export class QuestionScriptsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: QuestionScriptsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QuestionScriptsService.name);
  }

  /** The practitioner's active scripts. Archived ones are not listed. */
  async list(actor: AuthenticatedUser): Promise<QuestionScriptListResponseDto> {
    const ownerId = requirePractitionerOwner(actor);
    const rows = await this.repo.listActive(this.em.fork(), ownerId);
    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        specialtyCode: row.specialtyCode,
        status: row.status,
        itemCount: row.itemCount,
        updatedAt: toIso(row.updatedAt),
      })),
    };
  }

  /** One active script of the practitioner, with its questions. */
  async get(id: string, actor: AuthenticatedUser): Promise<QuestionScriptDto> {
    const ownerId = requirePractitionerOwner(actor);
    const em = this.em.fork();
    const script = await this.repo.findActiveOwned(em, id, ownerId);
    if (!script) throw notFound(id);
    return this.toDto(em, script);
  }

  /** Creates a script with its questions, in the order received. */
  async create(
    dto: CreateQuestionScriptDto,
    actor: AuthenticatedUser,
  ): Promise<QuestionScriptDto> {
    const ownerId = requirePractitionerOwner(actor);
    return this.em.transactional(async (tx) => {
      const id = await this.repo.insertScript(
        tx,
        ownerId,
        {
          title: dto.title,
          description: dto.description ?? null,
          specialtyCode: dto.specialtyCode ?? null,
        },
        actor.id,
      );
      await this.repo.replaceItems(tx, id, toItems(dto.items), actor.id);
      this.logger.info(
        { operation: 'forms.question-script.create', scriptId: id },
        'Question script created',
      );
      return this.reload(tx, id, ownerId);
    });
  }

  /**
   * Patches the header and, when `items` is sent, replaces the whole list.
   * The row is locked before the version check, so two concurrent PATCHes
   * with the same version cannot both pass.
   */
  async update(
    id: string,
    dto: UpdateQuestionScriptDto,
    actor: AuthenticatedUser,
  ): Promise<QuestionScriptDto> {
    const ownerId = requirePractitionerOwner(actor);
    return this.em.transactional(async (tx) => {
      const current = await this.repo.findActiveOwned(tx, id, ownerId, true);
      if (!current) throw notFound(id);
      if (current.version !== dto.version) {
        throw new ConcurrencyConflictException(
          'El guion cambió desde la última lectura',
          { expected: dto.version, actual: current.version },
          FormsErrorReason.QUESTION_SCRIPT_VERSION_MISMATCH,
        );
      }
      await this.repo.touchScript(
        tx,
        id,
        {
          title: dto.title,
          description: dto.description,
          specialtyCode: dto.specialtyCode,
        },
        actor.id,
      );
      if (dto.items)
        await this.repo.replaceItems(tx, id, toItems(dto.items), actor.id);
      this.logger.info(
        { operation: 'forms.question-script.update', scriptId: id },
        'Question script updated',
      );
      return this.reload(tx, id, ownerId);
    });
  }

  /** Archives the script; it leaves the list and reads as missing. */
  async archive(id: string, actor: AuthenticatedUser): Promise<void> {
    const ownerId = requirePractitionerOwner(actor);
    await this.em.transactional(async (tx) => {
      const current = await this.repo.findActiveOwned(tx, id, ownerId, true);
      if (!current) throw notFound(id);
      await this.repo.archive(tx, id, actor.id);
    });
    this.logger.info(
      { operation: 'forms.question-script.archive', scriptId: id },
      'Question script archived',
    );
  }

  private async reload(
    em: EntityManager,
    id: string,
    ownerId: string,
  ): Promise<QuestionScriptDto> {
    const script = await this.repo.findActiveOwned(em, id, ownerId);
    if (!script) throw notFound(id);
    return this.toDto(em, script);
  }

  private async toDto(
    em: EntityManager,
    script: QuestionScriptRow,
  ): Promise<QuestionScriptDto> {
    const items = await this.repo.listItems(em, script.id);
    return {
      id: script.id,
      title: script.title,
      description: script.description,
      specialtyCode: script.specialtyCode,
      status: script.status,
      version: script.version,
      updatedAt: toIso(script.updatedAt),
      items: items.map((item) => ({
        id: item.id,
        position: item.position,
        questionText: item.questionText,
        helpText: item.helpText,
        answerType: item.answerType,
        options: item.options,
        required: item.required,
      })),
    };
  }
}

function notFound(id: string): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Guion de preguntas no encontrado',
    { scriptId: id },
    FormsErrorReason.QUESTION_SCRIPT_OUT_OF_SCOPE,
  );
}

function toItems(
  items: CreateQuestionScriptDto['items'],
): QuestionScriptItemData[] {
  return items.map((item) => ({
    questionText: item.questionText.trim(),
    helpText: item.helpText ?? null,
    answerType: item.answerType,
    options: item.options ? item.options.map((option) => option.trim()) : null,
    required: item.required,
  }));
}

/** `timestamptz` comes back as a `Date`; the contract carries ISO strings. */
export function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
