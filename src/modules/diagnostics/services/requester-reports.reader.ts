import { Injectable } from '@nestjs/common';
import type { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { readWithSystemRls } from '../../../common/tenant/rls-transaction';
import { DiagnosticReports, ServiceRequests } from '../../clinical/entities';
import {
  visibleWhere,
  type ScopeFilter,
} from '../../clinical/domain/clinical-scope-visibility';
import { DIAG } from '../diagnostics.concepts';
import type { ReportPatientVisibility } from '../dto/report-draft.dto';
import { ReportsRepository } from '../repositories';

/** Under a SPECIALTIES scope an order is visible by its requester, else its encounter. */
const ORDER_SCOPE_COLUMNS = {
  profile: 'requesterProfileId',
  encounter: 'encounterId',
} as const;

/** Reports of the requester tenant's orders that another tenant custodies. */
export interface IssuedOrderReports {
  readonly rows: DiagnosticReports[];
  /** Such reports whose order the scope keeps out. */
  readonly hidden: number;
}

/**
 * The requester's side of a result: the report of an order this tenant issued
 * is custodied by the performing laboratory, so the custodian filter (and RLS)
 * of the chart read hides it from the doctor who asked for it.
 */
@Injectable()
export class RequesterReportsReader {
  constructor(
    private readonly em: EntityManager,
    private readonly reports: ReportsRepository,
  ) {}

  /**
   * Reports custodied by another tenant that hang from orders of this tenant.
   * Bounded system read: every report is reached through an order whose
   * custodian is the verified caller tenant, and must be custodied by that
   * order's performer and released; never by a client-chosen id.
   * Under a SPECIALTIES scope a report follows its order's visibility: its
   * author belongs to the laboratory, never to the authorised specialties.
   */
  ofIssuedOrders(
    tenantId: string,
    patientProfileId: string,
    limit: number,
    filter: ScopeFilter | null,
  ): Promise<IssuedOrderReports> {
    return readWithSystemRls(this.em, async (em) => {
      const base = { custodianTenantId: tenantId, patientProfileId };
      // Each order with the tenant it was addressed to: only that performer's report counts.
      const ordersOf = (where: FilterQuery<ServiceRequests>) =>
        em.find(ServiceRequests, where, {
          fields: ['id', 'performerTenantId'],
        });
      const ofOrders = (
        orders: readonly Pick<ServiceRequests, 'id' | 'performerTenantId'>[],
      ) => {
        const pairs = orders
          .filter(
            (o) => o.performerTenantId && o.performerTenantId !== tenantId,
          )
          .map((o) => ({
            serviceRequestId: o.id,
            custodianTenantId: o.performerTenantId as string,
          }));
        // Released reports only: a draft or a held-back header is not the requester's to see.
        return pairs.length
          ? {
              patientProfileId,
              currentReleasedVersionId: { $ne: null },
              $or: pairs,
            }
          : null;
      };
      const visible = ofOrders(
        await ordersOf(
          filter
            ? { ...base, ...visibleWhere(filter, ORDER_SCOPE_COLUMNS) }
            : base,
        ),
      );
      const rows = visible
        ? await em.find(DiagnosticReports, visible, {
            orderBy: { createdAt: 'DESC' },
            limit,
          })
        : [];
      if (!filter) return { rows, hidden: 0 };
      const all = ofOrders(await ordersOf(base));
      const [total, shown] = await Promise.all([
        all ? em.count(DiagnosticReports, all) : 0,
        visible ? em.count(DiagnosticReports, visible) : 0,
      ]);
      return { rows, hidden: Math.max(total - shown, 0) };
    });
  }

  /**
   * Patient visibility of each released version, from its latest release
   * event: HELD means the requester still has to release it to the patient.
   */
  async visibilityOf(
    versionIds: readonly string[],
  ): Promise<Map<string, ReportPatientVisibility | null>> {
    const events = await this.reports.findReleaseEventsByVersions(
      this.em.fork(),
      versionIds,
    );
    const out = new Map<string, ReportPatientVisibility | null>();
    // Newest first: the first event seen per version is its current state.
    for (const event of events) {
      const versionId = event.diagnosticReportVersionId;
      if (!versionId || out.has(versionId)) continue;
      const concept = event.patientVisibilityConceptId;
      out.set(
        versionId,
        concept === DIAG.VISIBILITY_PATIENT_VISIBLE
          ? 'VISIBLE'
          : concept === DIAG.VISIBILITY_PATIENT_HIDDEN
            ? 'HELD'
            : null,
      );
    }
    return out;
  }
}
