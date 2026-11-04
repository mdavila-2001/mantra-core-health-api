import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { LabPortalRepository, LabReceptionRepository } from '../repositories';
import type {
  LabActivityEntryDto,
  LabSummaryDto,
} from '../dto/lab-portal-summary.dto';
import { categoryBuckets } from './lab-portal-category-buckets';
import { readableSize } from './lab-portal.projection';
import {
  LabPortalSnapshotService,
  type LabFileView,
} from './lab-portal-snapshot.service';

const RECENT_ACTIVITY = 8;

/** The newest entries only, so a long scan keeps a bounded list. */
const recent = (entries: LabActivityEntryDto[]): LabActivityEntryDto[] =>
  entries
    .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id))
    .slice(0, RECENT_ACTIVITY);

/** Upload entry of a result file, plus its withdrawal when it has one. */
function fileActivity(file: LabFileView): LabActivityEntryDto[] {
  const entries: LabActivityEntryDto[] = [
    {
      id: `upload-${file.fileId}`,
      at: file.uploadedAt.toISOString(),
      kind: 'RESULT_UPLOADED',
      text: `Se subió ${file.meta.fileName} (${readableSize(file.meta.sizeBytes)}).`,
    },
  ];
  if (file.withdrawnAt) {
    entries.push({
      id: `withdrawal-${file.fileId}`,
      at: file.withdrawnAt.toISOString(),
      kind: 'RESULT_WITHDRAWN',
      text: `Retiró ${file.meta.fileName}: ${file.withdrawnReason ?? 'sin motivo'}`,
    });
  }
  return entries;
}

/**
 * Summary of the laboratory portal, all from real rows: the study offerings of
 * the tenant's diagnostic unit (read-only), the routed orders and the result
 * files of their reports.
 *
 * `unavailable` counts the current (not withdrawn) services switched off for
 * today, and `byCategory` groups the current services by the lab's categories
 * (the ones without one fall in «Sin categoría»).
 */
@Injectable()
export class LabPortalSummaryService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LabPortalRepository,
    private readonly labels: LabReceptionRepository,
    private readonly snapshot: LabPortalSnapshotService,
  ) {}

  async summary(tenantId: string): Promise<LabSummaryDto> {
    const em = this.em.fork();
    const [offerings, categories, names] = await Promise.all([
      this.repo.findOfferings(em, tenantId),
      this.repo.findCategories(em, tenantId),
      this.labels.findTenantNames(em, [tenantId]),
    ]);
    // Every order of the lab, in batches: totals never depend on a page cap.
    let ordersWithoutResults = 0;
    let resultFiles = 0;
    let resultBytes = 0;
    let activity: LabActivityEntryDto[] = [];
    for await (const snap of this.snapshot.loadAll(this.em.fork(), tenantId)) {
      ordersWithoutResults += snap.orders.filter(
        (o) =>
          o.status !== 'CANCELLED' &&
          o.status !== 'REJECTED' &&
          o.status !== 'UPLOADED',
      ).length;
      for (const file of snap.files) {
        if (file.status === 'AVAILABLE') {
          resultFiles += 1;
          resultBytes += file.meta.sizeBytes;
        }
        activity.push(...fileActivity(file));
      }
      activity = recent(activity);
    }
    const count = (status: string) =>
      offerings.filter((o) => o.statusConceptId === status).length;

    // Any state that is neither published nor retired reads as a draft.
    const published = count(DUNIT.OFFERING_ACTIVE);
    const withdrawn = count(DUNIT.OFFERING_RETIRED);
    const drafts = offerings.length - published - withdrawn;
    const unavailable = offerings.filter(
      (o) =>
        o.statusConceptId !== DUNIT.OFFERING_RETIRED && o.available === false,
    ).length;
    for (const offering of offerings) {
      const retired = offering.statusConceptId === DUNIT.OFFERING_RETIRED;
      const created =
        offering.updatedAt.getTime() === offering.createdAt.getTime();
      activity.push({
        id: `service-${offering.id}`,
        at: offering.updatedAt.toISOString(),
        kind: retired
          ? 'SERVICE_WITHDRAWN'
          : created
            ? 'SERVICE_CREATED'
            : 'SERVICE_UPDATED',
        text: `${retired ? 'Retiró' : created ? 'Agregó' : 'Editó'} ${offering.displayName}.`,
      });
    }

    return {
      labName: names.get(tenantId) ?? 'Su laboratorio',
      published,
      drafts,
      withdrawn,
      unavailable,
      ordersWithoutResults,
      resultFiles,
      resultBytes,
      byCategory: categoryBuckets(offerings, categories),
      recentActivity: recent(activity),
    };
  }
}
