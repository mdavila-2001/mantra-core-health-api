import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import { DiagnosticServiceCategories } from '../entities';
import type {
  LabCategoryDto,
  LabCategoryPageDto,
} from '../dto/lab-portal-responses.dto';
import {
  LabPortalContextService,
  type LabPortalContext,
} from './lab-portal-context.service';
import { statusOf } from './lab-portal.mapping';

const NAME_TAKEN = DiagnosticUnitsErrorReason.DIAGNOSTIC_CATEGORY_NAME_TAKEN;
const IN_USE = DiagnosticUnitsErrorReason.DIAGNOSTIC_CATEGORY_IN_USE;

/**
 * Service categories of the active tenant's lab (`/diagnostics/lab/categories`).
 *
 * Every read and write goes through the context of the tenant's own unit, so
 * another lab's category id answers 404 like an unknown one. Names are unique
 * per unit ignoring case (`ux_diagnostic_service_categories_unit_name`).
 *
 * Delete rule: a category that still groups services which are not withdrawn
 * answers 409 and is kept; withdrawn services are invisible in the portal, so
 * they are detached (`service_category_id = NULL`) and the category is deleted.
 */
@Injectable()
export class LabPortalCategoriesService {
  /**
   * @param em - Persistence context.
   * @param context - Catalog loading of the active tenant.
   * @param logger - Structured logger (identifiers only).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: LabPortalContextService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalCategoriesService.name);
  }

  /** `GET /diagnostics/lab/categories`: by name, with the live service count. */
  async list(): Promise<LabCategoryPageDto> {
    const ctx = await this.context.load(this.em.fork());
    const items = [...ctx.categories]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((c) => this.view(ctx, c));
    return { items, count: items.length };
  }

  /** `POST /diagnostics/lab/categories`. */
  async create(
    name: string,
    actor: AuthenticatedUser,
  ): Promise<LabCategoryDto> {
    return this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const clean = this.checkName(ctx, name);
      const now = new Date();
      const category = tx.create(
        DiagnosticServiceCategories,
        {
          diagnosticUnitId: ctx.unit.id,
          name: clean,
          createdAt: now,
          updatedAt: now,
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        },
        { partial: true },
      );
      await this.flushUnique(tx, clean);
      ctx.categories.push(category);
      this.logger.info(
        {
          operation: 'diagnostic_units.lab_portal.category.create',
          categoryId: category.id,
        },
        'Lab category created',
      );
      return this.view(ctx, category);
    });
  }

  /** `PATCH /diagnostics/lab/categories/:id`. */
  async rename(
    id: string,
    name: string,
    actor: AuthenticatedUser,
  ): Promise<LabCategoryDto> {
    return this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const category = this.context.category(ctx, id);
      category.name = this.checkName(ctx, name, id);
      touch(category, actor.id);
      await this.flushUnique(tx, category.name);
      return this.view(ctx, category);
    });
  }

  /** `DELETE /diagnostics/lab/categories/:id`: 409 while it groups live services. */
  async remove(id: string): Promise<{ ok: true }> {
    return this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const category = this.context.category(ctx, id);
      const own = ctx.offerings.filter((o) => o.serviceCategoryId === id);
      const live = own.filter(
        (o) => statusOf(o.statusConceptId) !== 'WITHDRAWN',
      );
      if (live.length > 0) {
        throw new ConflictException(
          `«${category.name}» tiene ${live.length} servicios. Muévalos a otra categoría antes de borrarla.`,
          { serviceCount: live.length },
          IN_USE,
        );
      }
      for (const offering of own) offering.serviceCategoryId = undefined;
      await tx.flush();
      tx.remove(category);
      await tx.flush();
      this.logger.info(
        {
          operation: 'diagnostic_units.lab_portal.category.delete',
          categoryId: id,
        },
        'Lab category deleted',
      );
      return { ok: true };
    });
  }

  /** Flush that turns the unique-name index (a concurrent twin) into the same 409. */
  private async flushUnique(tx: EntityManager, name: string): Promise<void> {
    try {
      await tx.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw this.taken(name);
      }
      throw error;
    }
  }

  private taken(name: string): ConflictException {
    return new ConflictException(
      `Ya existe la categoría «${name}».`,
      undefined,
      NAME_TAKEN,
    );
  }

  /** Trimmed name; 409 when another category of the unit has it (any case). */
  private checkName(ctx: LabPortalContext, name: string, ownId?: string) {
    const clean = name.trim();
    const wanted = clean.toLowerCase();
    if (
      ctx.categories.some(
        (c) => c.id !== ownId && c.name.toLowerCase() === wanted,
      )
    ) {
      throw this.taken(clean);
    }
    return clean;
  }

  private view(
    ctx: LabPortalContext,
    category: DiagnosticServiceCategories,
  ): LabCategoryDto {
    const serviceCount = ctx.offerings.filter(
      (o) =>
        o.serviceCategoryId === category.id &&
        statusOf(o.statusConceptId) !== 'WITHDRAWN',
    ).length;
    return { id: category.id, name: category.name, serviceCount };
  }
}
