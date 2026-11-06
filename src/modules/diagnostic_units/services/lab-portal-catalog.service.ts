import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { normalizeSearchText } from '../../../common/text/normalize-search-text';
import { DUNIT } from '../diagnostic_units.concepts';
import type { DiagnosticStudyOfferings } from '../entities';
import type { LabServiceQueryDto } from '../dto/lab-portal-requests.dto';
import type {
  LabServiceDto,
  LabServicePageDto,
} from '../dto/lab-portal-responses.dto';
import type {
  LabServiceChangesDto,
  LabServiceDraftDto,
} from '../dto/lab-portal-service.dto';
import { DiagnosticStudiesService } from './diagnostic-studies.service';
import {
  LabPortalContextService,
  type LabPortalContext,
} from './lab-portal-context.service';
import {
  LabPortalWriterService,
  type LabServiceProblem,
} from './lab-portal-writer.service';
import { parentOf, statusOf, toLabService } from './lab-portal.mapping';

/**
 * The lab portal catalog ("Precios" screen): the active tenant's offerings,
 * with their current public price and AloVida discount.
 */
@Injectable()
export class LabPortalCatalogService {
  /**
   * @param em - Persistence context.
   * @param context - Catalog loading of the active tenant.
   * @param writer - Draft/change application.
   * @param studies - UC-23-08 retirement, reused for withdrawal.
   * @param logger - Structured logger (identifiers only).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: LabPortalContextService,
    private readonly writer: LabPortalWriterService,
    private readonly studies: DiagnosticStudiesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalCatalogService.name);
  }

  /** `GET /diagnostics/lab/services`: withdrawn ones only when asked by status. */
  async list(query: LabServiceQueryDto): Promise<LabServicePageDto> {
    const ctx = await this.context.load(this.em.fork());
    const q = query.q ? normalizeSearchText(query.q) : '';
    const shown = (o: DiagnosticStudyOfferings) =>
      query.status
        ? statusOf(o.statusConceptId) === query.status
        : statusOf(o.statusConceptId) !== 'WITHDRAWN';
    const items = ctx.offerings
      .filter(shown)
      .filter(
        (o) =>
          q === '' ||
          normalizeSearchText(o.displayName).includes(q) ||
          normalizeSearchText(o.studyCode).includes(q),
      )
      .filter(
        (o) =>
          query.categoryId === undefined ||
          o.serviceCategoryId === query.categoryId,
      )
      .filter(
        (o) => query.available === undefined || o.available === query.available,
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
      .map((o) => this.view(ctx, o));
    return { items, count: items.length };
  }

  /** `POST /diagnostics/lab/services`. */
  async create(
    draft: LabServiceDraftDto,
    actor: AuthenticatedUser,
  ): Promise<LabServiceDto> {
    return this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      this.raise(this.writer.problemOf(ctx, draft));
      const offering = await this.writer.create(tx, ctx, draft, actor.id);
      this.logger.info(
        {
          operation: 'diagnostic_units.lab_portal.service.create',
          unitId: ctx.unit.id,
          offeringId: offering.id,
        },
        'Lab service created',
      );
      return this.view(ctx, offering);
    });
  }

  /** `PATCH /diagnostics/lab/services/:id`. */
  async update(
    id: string,
    changes: LabServiceChangesDto,
    actor: AuthenticatedUser,
  ): Promise<LabServiceDto> {
    return this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const offering = this.context.offering(ctx, id);
      this.raise(this.writer.problemOf(ctx, changes, offering.id));
      const outcome = await this.writer.update(
        tx,
        ctx,
        offering,
        changes,
        actor.id,
      );
      this.logger.info(
        {
          operation: 'diagnostic_units.lab_portal.service.update',
          offeringId: id,
          outcome,
        },
        'Lab service updated',
      );
      return this.view(ctx, offering);
    });
  }

  /** `DELETE /diagnostics/lab/services/:id`: soft withdrawal (UC-23-08), never a DELETE. */
  async withdraw(id: string, actor: AuthenticatedUser): Promise<LabServiceDto> {
    // Resolve inside the tenant's own unit first: another lab's id is a 404.
    this.context.offering(await this.context.load(this.em.fork()), id);
    await this.studies.retireOffering(id, actor);
    await this.retireParts(id, actor.id);
    const ctx = await this.context.load(this.em.fork());
    return this.view(ctx, this.context.offering(ctx, id));
  }

  /**
   * A withdrawn panel takes along the components that belong to it alone, so
   * none stays published (directory, search) while the lab no longer sees it.
   */
  private async retireParts(
    panelId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const parentsOf = (id: string) =>
        ctx.links.filter((l) => l.componentOfferingId === id);
      for (const link of ctx.links.filter(
        (l) => l.parentOfferingId === panelId,
      )) {
        const part = ctx.offerings.find(
          (o) => o.id === link.componentOfferingId,
        );
        if (!part || part.statusConceptId === DUNIT.OFFERING_RETIRED) continue;
        if (parentsOf(part.id).length > 1) continue;
        part.statusConceptId = DUNIT.OFFERING_RETIRED;
        touch(part, actorUserId);
      }
    });
  }

  /** Response of one offering with its current price. */
  view(
    ctx: LabPortalContext,
    offering: DiagnosticStudyOfferings,
  ): LabServiceDto {
    const sample = offering.specimenTypeConceptId
      ? (ctx.specimens.get(offering.specimenTypeConceptId) ?? null)
      : null;
    const category = ctx.categories.find(
      (c) => c.id === offering.serviceCategoryId,
    );
    return toLabService(
      offering,
      ctx.prices.get(offering.id),
      sample,
      category?.name ?? null,
      parentOf(ctx, offering.id),
    );
  }

  /** Throws the HTTP form of a business problem. */
  private raise(problem: LabServiceProblem | null): void {
    if (problem === null) return;
    if (problem.kind === 'CONFLICT')
      throw new ConflictException(problem.message);
    throw new PreconditionFailedException(problem.message);
  }
}
