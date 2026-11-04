import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { LabPortalRepository, LabReceptionRepository } from '../repositories';
import type {
  LabActivityEntryDto,
  LabSummaryDto,
} from '../dto/lab-portal-summary.dto';
import { readableSize } from './lab-portal.projection';
import { LabPortalSnapshotService } from './lab-portal-snapshot.service';

const RECENT_ACTIVITY = 8;

/**
 * Summary of the laboratory portal, all from real rows: the study offerings of
 * the tenant's diagnostic unit (read-only), the routed orders and the result
 * files of their reports.
 *
 * A study offering has no "available today" flag nor a category column, so
 * (like the services catalog) every service reads as available and
 * uncategorized: `unavailable` is 0 and `byCategory` has one «Sin categoría»
 * bucket with the non-withdrawn services.
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
    const [orders, offerings, names] = await Promise.all([
      this.repo.findOrders(em, tenantId),
      this.repo.findOfferings(em, tenantId),
      this.labels.findTenantNames(em, [tenantId]),
    ]);
    const snap = await this.snapshot.load(em, tenantId, orders);
    const available = snap.files.filter((file) => file.status === 'AVAILABLE');
    const pending = snap.orders.filter(
      (o) =>
        o.status !== 'CANCELLED' &&
        o.status !== 'REJECTED' &&
        o.status !== 'UPLOADED',
    );
    const count = (status: string) =>
      offerings.filter((o) => o.statusConceptId === status).length;

    // Any state that is neither published nor retired reads as a draft.
    const published = count(DUNIT.OFFERING_ACTIVE);
    const withdrawn = count(DUNIT.OFFERING_RETIRED);
    const drafts = offerings.length - published - withdrawn;
    const current = published + drafts;
    const activity: LabActivityEntryDto[] = [];
    for (const file of snap.files) {
      activity.push({
        id: `upload-${file.fileId}`,
        at: file.uploadedAt.toISOString(),
        kind: 'RESULT_UPLOADED',
        text: `Se subió ${file.meta.fileName} (${readableSize(file.meta.sizeBytes)}).`,
      });
      if (file.withdrawnAt) {
        activity.push({
          id: `withdrawal-${file.fileId}`,
          at: file.withdrawnAt.toISOString(),
          kind: 'RESULT_WITHDRAWN',
          text: `Retiró ${file.meta.fileName}: ${file.withdrawnReason ?? 'sin motivo'}`,
        });
      }
    }
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
      unavailable: 0,
      ordersWithoutResults: pending.length,
      resultFiles: available.length,
      resultBytes: available.reduce((sum, f) => sum + f.meta.sizeBytes, 0),
      byCategory:
        current > 0 ? [{ category: 'Sin categoría', count: current }] : [],
      recentActivity: activity
        .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id))
        .slice(0, RECENT_ACTIVITY),
    };
  }
}
