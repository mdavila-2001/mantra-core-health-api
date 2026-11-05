import type {
  DiagnosticReportFiles,
  DiagnosticReportVersions,
} from '../entities';

/**
 * Pure projections of the laboratory / imaging-center portal
 * (`/diagnostics/lab/*`). Nothing here touches the database: the services load
 * real rows and these functions turn them into the states the portal shows.
 */

/** Order states shown by the portal. None of them is stored as such. */
export type LabOrderStatus =
  'DRAFT' | 'RECEIVED' | 'PROCESSED' | 'UPLOADED' | 'CANCELLED' | 'REJECTED';

export const LAB_ORDER_ACTIONS = [
  'RECEIVE',
  'PROCESS',
  'CANCEL',
  'REJECT',
] as const;
export type LabOrderAction = (typeof LAB_ORDER_ACTIONS)[number];

/** Which state each step may start from (`UPLOADED` is never a source). */
export const LAB_ORDER_TRANSITIONS: Readonly<
  Record<LabOrderAction, readonly LabOrderStatus[]>
> = {
  RECEIVE: ['DRAFT'],
  PROCESS: ['RECEIVED'],
  CANCEL: ['DRAFT', 'RECEIVED'],
  REJECT: ['RECEIVED'],
};

/** The facts an order state is derived from, all read from real rows. */
export interface LabOrderFacts {
  /** `service_requests.status_concept_id` is revoked / satisfied by prior. */
  readonly revoked: boolean;
  /** A specimen of the performer's accession has a rejection event. */
  readonly rejected: boolean;
  /** A performer work order on the accession has `completed_at`. */
  readonly processed: boolean;
  /** The performer registered an accession for the order. */
  readonly received: boolean;
  /** Result files currently available (latest report version). */
  readonly availableFiles: number;
}

/**
 * Derives the visible state. A result already available wins over the
 * workflow rows: it is the strongest evidence that the order was performed.
 */
export function deriveLabOrderStatus(facts: LabOrderFacts): LabOrderStatus {
  if (facts.revoked) return 'CANCELLED';
  if (facts.availableFiles > 0) return 'UPLOADED';
  if (facts.rejected) return 'REJECTED';
  if (facts.processed) return 'PROCESSED';
  if (facts.received) return 'RECEIVED';
  return 'DRAFT';
}

/** How a file can be previewed in the browser, decided by the server. */
export type LabResultKind =
  'PDF' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT' | 'DICOM' | 'OTHER';

export const LAB_RESULT_KINDS: readonly LabResultKind[] = [
  'PDF',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'TEXT',
  'DICOM',
  'OTHER',
];

const EXTENSIONS: Readonly<
  Record<Exclude<LabResultKind, 'OTHER'>, readonly string[]>
> = {
  PDF: ['pdf'],
  IMAGE: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'],
  VIDEO: ['mp4', 'webm', 'ogv', 'mov', 'm4v'],
  AUDIO: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac'],
  TEXT: ['txt', 'csv', 'tsv', 'json', 'xml', 'hl7', 'md', 'log'],
  DICOM: ['dcm', 'dicom'],
};

/** Extension first (browsers send `octet-stream` for unknown types), then MIME. */
export function resultKindOf(
  fileName: string,
  contentType: string,
): LabResultKind {
  const dot = fileName.lastIndexOf('.');
  const extension = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  for (const [kind, list] of Object.entries(EXTENSIONS)) {
    if (list.includes(extension)) return kind as LabResultKind;
  }
  const mime = contentType.toLowerCase();
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'application/dicom') return 'DICOM';
  if (mime.startsWith('image/') && mime !== 'image/tiff') return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('audio/')) return 'AUDIO';
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml'
  ) {
    return 'TEXT';
  }
  return 'OTHER';
}

/** «2,4 MB»: the size as the activity feed prints it. */
export function readableSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const digits = i === 0 ? 0 : 1;
  return `${value.toLocaleString('es-BO', { maximumFractionDigits: digits })} ${units[i]}`;
}

/** The life of one result file across the versions of its report. */
export interface LabFileHistory {
  readonly fileId: string;
  readonly reportId: string;
  readonly uploadedAt: Date;
  readonly uploadedByUserId: string | null;
  /** `conclusion_text` of the version that introduced the file. */
  readonly note: string | null;
  readonly status: 'AVAILABLE' | 'WITHDRAWN';
  readonly withdrawnReason: string | null;
  readonly withdrawnAt: Date | null;
}

/**
 * Report versions are immutable, so a file is never deleted: the portal adds
 * a file by publishing a new version that carries it, and withdraws one by
 * publishing a version without it (`amendment_reason_text` = the reason).
 * A file is AVAILABLE when the latest version of its report still carries it.
 */
export function fileHistory(
  versions: readonly DiagnosticReportVersions[],
  files: readonly DiagnosticReportFiles[],
): LabFileHistory[] {
  const byReport = new Map<string, DiagnosticReportVersions[]>();
  for (const version of versions) {
    const list = byReport.get(version.diagnosticReportId) ?? [];
    list.push(version);
    byReport.set(version.diagnosticReportId, list);
  }
  const filesByVersion = new Map<string, DiagnosticReportFiles[]>();
  for (const file of files) {
    const list = filesByVersion.get(file.diagnosticReportVersionId) ?? [];
    list.push(file);
    filesByVersion.set(file.diagnosticReportVersionId, list);
  }

  const out: LabFileHistory[] = [];
  for (const [reportId, list] of byReport) {
    list.sort((a, b) => a.versionNumber - b.versionNumber);
    const first = new Map<
      string,
      { row: DiagnosticReportFiles; note: string | null }
    >();
    const lastIndex = new Map<string, number>();
    list.forEach((version, index) => {
      for (const row of filesByVersion.get(version.id) ?? []) {
        if (!first.has(row.fileId)) {
          first.set(row.fileId, { row, note: version.conclusionText ?? null });
        }
        lastIndex.set(row.fileId, index);
      }
    });
    for (const [fileId, { row, note }] of first) {
      const last = lastIndex.get(fileId) ?? 0;
      const next = list[last + 1];
      out.push({
        fileId,
        reportId,
        uploadedAt: row.createdAt,
        uploadedByUserId: row.createdByUserId ?? null,
        note,
        status: next === undefined ? 'AVAILABLE' : 'WITHDRAWN',
        withdrawnReason: next?.amendmentReasonText ?? null,
        withdrawnAt: next?.recordedAt ?? null,
      });
    }
  }
  return out;
}
