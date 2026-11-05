import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { normalizeSearchText } from '../../../common/text/normalize-search-text';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import type { DiagnosticStudyOfferings } from '../entities';
import type { LabServiceQueryDto } from '../dto/lab-portal-requests.dto';
import type {
  LabCategoryDto,
  LabCategoryPageDto,
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
import { statusOf, toLabService } from './lab-portal.mapping';

const REASON = DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE;

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
    const items = ctx.offerings
      .filter((o) =>
        query.status
          ? statusOf(o.statusConceptId) === query.status
          : statusOf(o.statusConceptId) !== 'WITHDRAWN',
      )
      .filter(
        (o) =>
          q === '' ||
          normalizeSearchText(o.displayName).includes(q) ||
          normalizeSearchText(o.studyCode).includes(q),
      )
      // No category is ever assigned and every service reads as available.
      .filter(() => query.categoryId === undefined)
      .filter(() => query.available !== false)
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
    const ctx = await this.context.load(this.em.fork());
    return this.view(ctx, this.context.offering(ctx, id));
  }

  /** `GET /diagnostics/lab/categories`: always empty (no categories table). */
  async listCategories(): Promise<LabCategoryPageDto> {
    await this.context.unitOfTenant(this.em.fork());
    return { items: [], count: 0 };
  }

  /** `POST /diagnostics/lab/categories`: refused, there is nowhere to store it. */
  async createCategory(): Promise<LabCategoryDto> {
    await this.context.unitOfTenant(this.em.fork());
    throw new PreconditionFailedException(
      'Las categorías del laboratorio no se pueden guardar: el modelo no tiene dónde registrarlas.',
    );
  }

  /** `PATCH`/`DELETE /diagnostics/lab/categories/:id`: no category exists. */
  async categoryNotFound(): Promise<never> {
    await this.context.unitOfTenant(this.em.fork());
    throw new ResourceNotFoundException(
      'Categoría no encontrada',
      undefined,
      REASON,
    );
  }

  /** Response of one offering with its current price. */
  view(
    ctx: LabPortalContext,
    offering: DiagnosticStudyOfferings,
  ): LabServiceDto {
    const sample = offering.specimenTypeConceptId
      ? (ctx.specimens.get(offering.specimenTypeConceptId) ?? null)
      : null;
    return toLabService(offering, ctx.prices.get(offering.id), sample);
  }

  /** Throws the HTTP form of a business problem. */
  private raise(problem: LabServiceProblem | null): void {
    if (problem === null) return;
    if (problem.kind === 'CONFLICT')
      throw new ConflictException(problem.message);
    throw new PreconditionFailedException(problem.message);
  }
}
