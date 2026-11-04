import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { Topics } from '../entities';
import {
  OWN_TOPICS_CODE,
  TOPIC_CATEGORIES,
  topicCode,
  topicId,
} from '../community-topics.catalog';
import type { TopicListItemDto, TopicPageDto } from '../dto';

/** Max topics returned by the tree listing. */
const TOPICS_LIMIT = 500;

/**
 * Topic tree for groups and forums: the categorized base catalog plus the
 * topics people create themselves («Temas propios»).
 *
 * The base catalog is materialized on first use (idempotent: deterministic
 * ids, only missing rows are inserted), so an empty database never leaves the
 * group form with a single «General» option.
 */
@Injectable()
export class CommunityTopicsService {
  private catalogReady: Promise<void> | null = null;

  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityTopicsService.name);
  }

  /** Active topics, categories included, ordered by name. */
  async listTopics(): Promise<TopicPageDto> {
    await this.ensureCatalog();
    const rows = await this.em
      .fork()
      .find(
        Topics,
        { statusConceptId: CONCEPTS.STATE_ACTIVE },
        { orderBy: { name: 'ASC' }, limit: TOPICS_LIMIT },
      );
    return {
      items: rows.map(toItem),
      count: rows.length,
      limit: TOPICS_LIMIT,
    };
  }

  /**
   * Creates an own topic under «Temas propios». If a topic with the same name
   * already exists (base or own), that one is returned instead of a duplicate.
   */
  async createTopic(
    name: string,
    actor: AuthenticatedUser,
  ): Promise<TopicListItemDto> {
    await this.ensureCatalog();
    const clean = name.trim().replace(/\s+/g, ' ');
    const base = topicCode(clean);
    // A name made only of symbols would yield an empty code and collide.
    if (base.length < 3) {
      throw new BadRequestException(
        'El nombre del tema necesita al menos tres letras o números',
      );
    }
    const code = `PROPIO_${base}`.slice(0, 80);
    const em = this.em.fork();

    const existing = await em.findOne(Topics, {
      code: { $in: [base, code] },
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (existing) return toItem(existing);

    const now = new Date();
    const topic = em.create(
      Topics,
      {
        id: topicId(code),
        code,
        name: clean,
        parentTopicId: topicId(OWN_TOPICS_CODE),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actor.id,
        updatedByUserId: actor.id,
      },
      { partial: true },
    );
    await em.flush();
    return toItem(topic);
  }

  private ensureCatalog(): Promise<void> {
    this.catalogReady ??= this.seedCatalog().catch((error: unknown) => {
      this.catalogReady = null;
      throw error;
    });
    return this.catalogReady;
  }

  private async seedCatalog(): Promise<void> {
    const em = this.em.fork();
    const rows = TOPIC_CATEGORIES.flatMap((category) => [
      { code: category.code, name: category.name, parent: undefined },
      ...category.topics.map((name) => ({
        code: topicCode(name),
        name,
        parent: topicId(category.code),
      })),
    ]);
    const present = await em.find(
      Topics,
      { id: { $in: rows.map((row) => topicId(row.code)) } },
      { fields: ['id'] },
    );
    const seen = new Set(present.map((row) => row.id));
    const now = new Date();
    // Parents first, so the parent FK holds within the same flush.
    for (const row of rows) {
      if (seen.has(topicId(row.code))) continue;
      em.create(
        Topics,
        {
          id: topicId(row.code),
          code: row.code,
          name: row.name,
          parentTopicId: row.parent,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
    }
    await em.flush();
    const inserted = rows.length - seen.size;
    if (inserted > 0) {
      this.logger.info(
        { operation: 'community.topics.seed', inserted },
        'Topic catalog materialized',
      );
    }
  }
}

function toItem(topic: Topics): TopicListItemDto {
  return {
    id: topic.id,
    code: topic.code,
    name: topic.name,
    parentTopicId: topic.parentTopicId ?? null,
    specialtyConceptId: topic.specialtyConceptId ?? null,
  };
}
