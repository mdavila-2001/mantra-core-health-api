import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import type { FileContentDto } from '../../common/dto';
import { FileUploadService } from '../../common/services/file-upload.service';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { DiagnosticReportFiles, DiagnosticReportVersions } from '../entities';
import { LabPortalRepository } from '../repositories';
import type {
  LabResultFileDto,
  LabResultFilePageDto,
  LabResultFileSearchDto,
} from '../dto/lab-portal-results.dto';
import type { LabResultTargetPageDto } from '../dto/lab-portal-orders.dto';
import { normalizeForSearch } from './diagnostics-reception.service';
import {
  LabPortalSnapshotService,
  type LabFileView,
  type LabOrderView,
} from './lab-portal-snapshot.service';

/** Same 404 for "absent" and "another tenant's": an id never leaks. */
export const notAvailable = (): ResourceNotFoundException =>
  new ResourceNotFoundException(
    'Recurso no disponible',
    undefined,
    DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
  );

export function toResultFileDto(file: LabFileView): LabResultFileDto {
  return {
    id: file.fileId,
    fileName: file.meta.fileName,
    contentType: file.meta.contentType,
    sizeBytes: file.meta.sizeBytes,
    kind: file.kind,
    uploadedAt: file.uploadedAt.toISOString(),
    uploadedBy: file.uploadedBy,
    orderId: file.orderId,
    orderLabel: file.orderLabel,
    patientName: file.patientName,
    note: file.note,
    notified: false,
    status: file.status,
    withdrawnReason: file.withdrawnReason,
  };
}

/**
 * Reads of the laboratory portal result files. A file lives in
 * `diagnostics.diagnostic_report_files` of a released, patient-visible version
 * of the order's `clinical.diagnostic_reports`: exactly what
 * `GET /diagnostic-results/me` reads, so an upload reaches the patient.
 */
@Injectable()
export class LabPortalResultsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LabPortalRepository,
    private readonly snapshot: LabPortalSnapshotService,
    private readonly logger: PinoLogger,
    @Optional() private readonly fileUpload?: FileUploadService,
  ) {
    this.logger.setContext(LabPortalResultsService.name);
  }

  async list(
    tenantId: string,
    filter: LabResultFileSearchDto,
  ): Promise<LabResultFilePageDto> {
    const needle = filter.q ? normalizeForSearch(filter.q) : '';
    const files: LabFileView[] = [];
    // Every order of the lab, in batches: old orders keep their files listed.
    for await (const snap of this.snapshot.loadAll(this.em.fork(), tenantId)) {
      files.push(
        ...snap.files
          .filter((f) => filter.includeWithdrawn || f.status === 'AVAILABLE')
          .filter((f) => !filter.kind || f.kind === filter.kind)
          .filter((f) => !filter.orderId || f.orderId === filter.orderId)
          .filter(
            (f) =>
              needle === '' ||
              [f.meta.fileName, f.patientName, f.orderLabel, f.note ?? ''].some(
                (text) => normalizeForSearch(text).includes(needle),
              ),
          ),
      );
    }
    const items = files
      .sort(
        (a, b) =>
          b.uploadedAt.getTime() - a.uploadedAt.getTime() ||
          a.fileId.localeCompare(b.fileId),
      )
      .map(toResultFileDto);
    const totalBytes = items.reduce((sum, item) => sum + item.sizeBytes, 0);
    return { items, count: items.length, totalBytes };
  }

  /** Orders a result may be attached to: processed, with or without files. */
  async targets(tenantId: string): Promise<LabResultTargetPageDto> {
    const items: LabResultTargetPageDto['items'] = [];
    for await (const snap of this.snapshot.loadAll(this.em.fork(), tenantId)) {
      for (const o of snap.orders) {
        if (o.status !== 'PROCESSED' && o.status !== 'UPLOADED') continue;
        items.push({
          orderId: o.order.id,
          studyName: o.studyName,
          patientName: o.patientName,
          requesterName: o.requesterName,
          requestedAt: o.order.createdAt.toISOString(),
          fileCount: o.files.filter((f) => f.status === 'AVAILABLE').length,
        });
      }
    }
    return { items, count: items.length };
  }

  async content(tenantId: string, fileId: string): Promise<FileContentDto> {
    await this.locate(this.em.fork(), tenantId, fileId);
    if (!this.fileUpload) {
      throw new PreconditionFailedException(
        'La descarga de archivos no está disponible',
      );
    }
    this.logger.info(
      { operation: 'diagnostics.lab-portal.result.content', fileId },
      'Laboratory downloads a result file',
    );
    return this.fileUpload.downloadForAuthorizedContext(
      fileId,
      'diagnostics.lab-portal.result.content',
    );
  }

  /** 404 unless the order is the tenant's; 409 unless it is processed. */
  async assertUploadable(
    em: EntityManager,
    tenantId: string,
    orderId: string,
  ): Promise<LabOrderView> {
    const order = await this.repo.findOrder(em, tenantId, orderId);
    if (!order) throw notAvailable();
    const [view] = (await this.snapshot.load(em, tenantId, [order])).orders;
    if (view.status !== 'PROCESSED' && view.status !== 'UPLOADED') {
      throw new ConflictException(
        'Marque la orden como procesada antes de subir sus resultados.',
        { currentStatus: view.status },
      );
    }
    return view;
  }

  /** The file and its order, only when the tenant keeps the report it lives in. */
  async locate(
    em: EntityManager,
    tenantId: string,
    fileId: string,
  ): Promise<{ view: LabOrderView; file: LabFileView }> {
    const rows = await em.find(DiagnosticReportFiles, { fileId });
    const versions = rows.length
      ? await em.find(DiagnosticReportVersions, {
          id: { $in: rows.map((row) => row.diagnosticReportVersionId) },
        })
      : [];
    const reportIds = versions
      .filter((v) => v.custodianTenantId === tenantId)
      .map((v) => v.diagnosticReportId);
    const reports = reportIds.length
      ? await this.repo.findReportsByIds(em, tenantId, reportIds)
      : [];
    const orderId = reports.find((r) => r.serviceRequestId)?.serviceRequestId;
    const order = orderId
      ? await this.repo.findOrder(em, tenantId, orderId)
      : null;
    if (!order) throw notAvailable();
    const [view] = (await this.snapshot.load(em, tenantId, [order])).orders;
    const file = view.files.find((f) => f.fileId === fileId);
    if (!file) throw notAvailable();
    return { view, file };
  }
}
