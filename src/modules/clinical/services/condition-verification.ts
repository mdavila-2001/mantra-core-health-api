import type {
  ConditionVerificationDto,
  ConditionVerificationEvidenceDto,
} from '../dto';

/**
 * Clave del `data_snapshot` de `audit.conditions_history` donde se sella la
 * decisión de verificación (C3 / P41).
 *
 * Sigue la decisión D-BR14-04 del motivo del cambio de estado: sin columna
 * nueva en `clinical.conditions`, lo que explica la decisión va en el registro
 * append-only, que es además donde un auditor lo buscaría.
 */
export const VERIFICATION_SNAPSHOT_KEY = 'verification';

/**
 * ¿La revisión trae una decisión de verificación? Es el filtro que la lectura
 * pasa a `HistoryRepository.latestBySource`: la última revisión de una
 * condición puede ser un cambio de estado posterior, y la decisión no se
 * pierde por eso.
 *
 * @param snapshot - `data_snapshot` de una revisión.
 * @returns Si contiene una decisión con forma válida.
 */
export function hasVerification(snapshot: unknown): boolean {
  return verificationFromSnapshot(snapshot) !== null;
}

/**
 * Lee la decisión de verificación de un `data_snapshot`, validando su forma:
 * el jsonb es de forma libre y una revisión vieja o ajena no puede volverse
 * una decisión a medias en la respuesta.
 *
 * @param snapshot - `data_snapshot` de una revisión.
 * @returns La decisión, o `null` si la revisión no la trae.
 */
export function verificationFromSnapshot(
  snapshot: unknown,
): ConditionVerificationDto | null {
  if (typeof snapshot !== 'object' || snapshot === null) return null;
  const raw = (snapshot as Record<string, unknown>)[VERIFICATION_SNAPSHOT_KEY];
  if (typeof raw !== 'object' || raw === null) return null;
  const v = raw as Record<string, unknown>;
  if (v.outcome !== 'CONFIRMED' && v.outcome !== 'REFUTED') return null;
  if (typeof v.decidedAt !== 'string') return null;
  if (typeof v.decidedByProfileId !== 'string') return null;
  return {
    outcome: v.outcome,
    decidedAt: v.decidedAt,
    decidedByProfileId: v.decidedByProfileId,
    reasonText: typeof v.reasonText === 'string' ? v.reasonText : null,
    basedOn: evidenceFrom(v.basedOn),
  };
}

/** La evidencia sellada, sólo con las claves conocidas. */
function evidenceFrom(raw: unknown): ConditionVerificationEvidenceDto | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  if (e.kind !== 'NOTE' && e.kind !== 'ANALYSIS') return null;
  const texto = (valor: unknown): string | undefined =>
    typeof valor === 'string' ? valor : undefined;
  const noteId = texto(e.noteId);
  const encounterId = texto(e.encounterId);
  const serviceRequestId = texto(e.serviceRequestId);
  const diagnosticReportId = texto(e.diagnosticReportId);
  return {
    kind: e.kind,
    ...(noteId === undefined ? {} : { noteId }),
    ...(encounterId === undefined ? {} : { encounterId }),
    ...(serviceRequestId === undefined ? {} : { serviceRequestId }),
    ...(diagnosticReportId === undefined ? {} : { diagnosticReportId }),
  };
}
