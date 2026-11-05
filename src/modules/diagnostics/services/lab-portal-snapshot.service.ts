import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type {
  DiagnosticReports,
  ServiceRequests,
} from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import type { LaboratoryAccessions } from '../entities';
import {
  LAB_PORTAL_PAGE_MAX,
  LabPortalRepository,
  LabReceptionRepository,
  ReportsRepository,
  type LabFileMeta,
  type LabOrderKey,
} from '../repositories';
import {
  deriveLabOrderStatus,
  fileHistory,
  resultKindOf,
  type LabFileHistory,
  type LabOrderStatus,
  type LabResultKind,
} from './lab-portal.projection';

/** One order of the portal with everything its row and its transitions need. */
export interface LabOrderView {
  readonly order: ServiceRequests;
  readonly status: LabOrderStatus;
  readonly reason: string | null;
  readonly studyName: string;
  readonly patientName: string;
  readonly requesterName: string;
  /** Latest performer accession, if the order was received. */
  readonly accession: LaboratoryAccessions | null;
  /** Specimens of that accession that are not rejected yet. */
  readonly openSpecimenIds: readonly string[];
  readonly reports: readonly DiagnosticReports[];
  readonly files: readonly LabFileView[];
}

/** One result file as the portal shows it. */
export interface LabFileView extends LabFileHistory {
  readonly orderId: string;
  readonly meta: LabFileMeta;
  readonly kind: LabResultKind;
  readonly uploadedBy: string;
  readonly orderLabel: string;
  readonly patientName: string;
}

export interface LabPortalSnapshot {
  readonly orders: readonly LabOrderView[];
  /** Every file ever attached (available and withdrawn). */
  readonly files: readonly LabFileView[];
}

const REVOKED: readonly string[] = [
  CLIN.SERVICE_REQUEST_REVOKED,
  CLIN.SERVICE_REQUEST_SATISFIED_BY_PRIOR,
];

/**
 * Builds the portal state of a set of orders from real rows: accessions,
 * work orders, specimen rejections and released report versions with their
 * files. Nothing is cached and no state is stored apart from those rows.
 */
@Injectable()
export class LabPortalSnapshotService {
  constructor(
    private readonly repo: LabPortalRepository,
    private readonly reports: ReportsRepository,
    private readonly labels: LabReceptionRepository,
  ) {}

  /**
   * Every order of the tenant, newest first, as snapshots of at most
   * `LAB_PORTAL_PAGE_MAX` orders: totals and file lists never depend on a cap.
   * The entity manager is cleared between batches, so hand over a fork whose
   * entities nobody else holds.
   */
  async *loadAll(
    em: EntityManager,
    tenantId: string,
  ): AsyncGenerator<LabPortalSnapshot> {
    let after: LabOrderKey | undefined;
    for (;;) {
      const orders = await this.repo.findOrders(em, tenantId, {
        limit: LAB_PORTAL_PAGE_MAX,
        after,
      });
      if (orders.length === 0) return;
      yield await this.load(em, tenantId, orders);
      if (orders.length < LAB_PORTAL_PAGE_MAX) return;
      const last = orders[orders.length - 1];
      after = { createdAt: last.createdAt, id: last.id };
      em.clear();
    }
  }

  async load(
    em: EntityManager,
    tenantId: string,
    orders: readonly ServiceRequests[],
  ): Promise<LabPortalSnapshot> {
    if (orders.length === 0) return { orders: [], files: [] };
    const orderIds = orders.map((order) => order.id);

    const [accessions, reports] = await Promise.all([
      this.repo.findAccessions(em, tenantId, orderIds),
      this.repo.findReports(em, tenantId, orderIds),
    ]);
    const latestAccession = new Map<string, LaboratoryAccessions>();
    for (const accession of accessions) {
      const orderId = accession.serviceRequestId;
      if (orderId && !latestAccession.has(orderId)) {
        latestAccession.set(orderId, accession);
      }
    }
    const accessionIds = [...latestAccession.values()].map((a) => a.id);

    const [workOrders, items, versions] = await Promise.all([
      this.repo.findWorkOrders(em, tenantId, accessionIds),
      this.repo.findAccessionItems(em, accessionIds),
      this.reports.findVersionsByReports(
        em,
        reports.map((report) => report.id),
      ),
    ]);
    const specimenIds = items.map((item) => item.specimenId);
    const [rejections, reportFiles] = await Promise.all([
      this.repo.findRejections(em, specimenIds),
      this.reports.findFilesByVersions(
        em,
        versions.map((version) => version.id),
      ),
    ]);
    const history = fileHistory(versions, reportFiles);

    const [meta, people, studies, users] = await Promise.all([
      this.repo.findFileMeta(
        em,
        history.map((entry) => entry.fileId),
      ),
      this.labels.findPatientLabels(em, [
        ...orders.map((order) => order.patientProfileId),
        ...orders
          .map((order) => order.requesterProfileId)
          .filter((id): id is string => typeof id === 'string'),
      ]),
      this.labels.findConceptDisplays(
        em,
        orders.map((order) => order.codeConceptId),
      ),
      this.repo.findUserNames(
        em,
        history
          .map((entry) => entry.uploadedByUserId)
          .filter((id): id is string => id !== null),
      ),
    ]);

    const processed = new Set(
      workOrders
        .filter((workOrder) => workOrder.completedAt)
        .map((workOrder) => workOrder.laboratoryAccessionId),
    );
    const rejectionBySpecimen = new Map<string, string | null>();
    for (const event of rejections) {
      if (!rejectionBySpecimen.has(event.specimenId)) {
        rejectionBySpecimen.set(event.specimenId, event.notes ?? null);
      }
    }
    const orderByReport = new Map(
      reports.map((report) => [report.id, report.serviceRequestId ?? '']),
    );

    const views: LabOrderView[] = [];
    const allFiles: LabFileView[] = [];
    for (const order of orders) {
      const studyName = studies.get(order.codeConceptId) ?? 'Estudio';
      const patientName =
        people.get(order.patientProfileId)?.displayName ?? 'Paciente';
      const requesterName =
        (order.requesterProfileId
          ? people.get(order.requesterProfileId)?.displayName
          : null) ?? 'Médico solicitante';
      const files = history
        .filter((entry) => orderByReport.get(entry.reportId) === order.id)
        .map((entry): LabFileView => {
          const fileMeta = meta.get(entry.fileId) ?? {
            fileName: 'archivo',
            contentType: '',
            sizeBytes: 0,
          };
          return {
            ...entry,
            orderId: order.id,
            meta: fileMeta,
            kind: resultKindOf(fileMeta.fileName, fileMeta.contentType),
            uploadedBy:
              (entry.uploadedByUserId
                ? users.get(entry.uploadedByUserId)
                : undefined) ?? 'Laboratorio',
            orderLabel: `${studyName} · pedido por ${requesterName}`,
            patientName,
          };
        });
      allFiles.push(...files);

      const accession = latestAccession.get(order.id) ?? null;
      const accessionSpecimens = accession
        ? items.filter((item) => item.laboratoryAccessionId === accession.id)
        : [];
      const rejected = accessionSpecimens.filter((item) =>
        rejectionBySpecimen.has(item.specimenId),
      );
      const available = files.filter((file) => file.status === 'AVAILABLE');
      const status = deriveLabOrderStatus({
        revoked: REVOKED.includes(order.statusConceptId),
        rejected: rejected.length > 0,
        processed: accession !== null && processed.has(accession.id),
        received: accession !== null,
        availableFiles: available.length,
      });
      views.push({
        order,
        status,
        reason:
          status === 'REJECTED'
            ? (rejectionBySpecimen.get(rejected[0].specimenId) ?? null)
            : null,
        studyName,
        patientName,
        requesterName,
        accession,
        openSpecimenIds: accessionSpecimens
          .filter((item) => !rejectionBySpecimen.has(item.specimenId))
          .map((item) => item.specimenId),
        reports: reports.filter(
          (report) => report.serviceRequestId === order.id,
        ),
        files,
      });
    }
    return { orders: views, files: allFiles };
  }
}
