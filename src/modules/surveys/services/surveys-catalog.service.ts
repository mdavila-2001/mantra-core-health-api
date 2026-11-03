import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, type AuthenticatedUser } from '../../../common';
import { SurveyCatalogEntryDto } from '../dto';
import { TemplatesRepository } from '../repositories';
import {
  SYSTEM_BASE_SURVEY_VERSION,
  SYSTEM_SURVEY_KINDS,
} from '../surveys.base-definitions';
import { SurveysSystemTemplatesService } from './surveys-system-templates.service';
import { SurveysTemplatesService } from './surveys-templates.service';

/**
 * The practitioner's whole survey catalog: the system base surveys (one for
 * consultations, one for services) followed by the ones they wrote, each with
 * the services it is associated with.
 *
 * Read-only. The base surveys are materialized lazily on the first read, with
 * the same idempotent call the invitation issuer uses.
 */
@Injectable()
export class SurveysCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly templatesRepo: TemplatesRepository,
    private readonly templates: SurveysTemplatesService,
    private readonly system: SurveysSystemTemplatesService,
  ) {}

  /** System base surveys first, then the practitioner's own. */
  async list(actor: AuthenticatedUser): Promise<SurveyCatalogEntryDto[]> {
    const own = await this.templates.listTemplates(actor);
    const ownEntries = await Promise.all(
      own.map(async (summary) => ({
        ...summary,
        origin: 'PRACTITIONER' as const,
        assignments: await this.templates.listAssignments(summary.id),
      })),
    );
    return [...(await this.systemEntries(actor)), ...ownEntries];
  }

  private async systemEntries(
    actor: AuthenticatedUser,
  ): Promise<SurveyCatalogEntryDto[]> {
    const tenantId = requireTenantId();
    const entries: SurveyCatalogEntryDto[] = [];
    for (const kind of SYSTEM_SURVEY_KINDS) {
      const base = await this.system.ensureSystemTemplate(
        tenantId,
        kind,
        actor.id,
      );
      const template = await this.templatesRepo.findTemplateById(
        this.em,
        base.templateId,
      );
      entries.push({
        id: base.templateId,
        title: template?.title ?? kind,
        description: template?.description,
        status: 'ACTIVE',
        latestVersionNumber: SYSTEM_BASE_SURVEY_VERSION,
        published: true,
        questionCount: await this.templatesRepo.countQuestions(
          this.em,
          base.versionId,
        ),
        origin: 'SYSTEM',
        scope: kind,
        assignments: [],
      });
    }
    return entries;
  }
}
