import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../common';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { ReportDraftsRepository } from '../repositories/report-drafts.repository';

/** 409 of any write on a report that was published through the draft flow. */
export const reportAlreadyPublished = (): ConflictException =>
  new ConflictException(
    'El informe ya fue publicado y no se puede modificar',
    undefined,
    DiagnosticsErrorReason.REPORT_ALREADY_PUBLISHED,
  );

/**
 * D16 · published = immutable. The single check every later write of a
 * `clinical.diagnostic_reports` row goes through: a new version, a portal
 * attach or a withdrawal on a report with a `PUBLISHED` draft answers 409.
 */
@Injectable()
export class ReportImmutabilityService {
  constructor(
    private readonly em: EntityManager,
    private readonly drafts: ReportDraftsRepository,
  ) {}

  /**
   * @param reportId - Report about to be written.
   * @param em - Transaction of the write, when there is one.
   * @throws ConflictException `REPORT_ALREADY_PUBLISHED`.
   */
  async assertWritable(
    reportId: string,
    em: EntityManager = this.em,
  ): Promise<void> {
    const published = await this.drafts.findPublishedByReport(em, reportId);
    if (published) throw reportAlreadyPublished();
  }
}
