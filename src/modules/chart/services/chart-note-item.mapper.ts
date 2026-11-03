import type { ClinicalNoteHeaders, ClinicalNoteVersions } from '../entities';
import type { ChartNoteEntryDto, ChartNoteItemDto } from '../dto';

/** Una fila campo/valor como se escribe en `entries_json` (P39). */
export interface NoteEntry {
  readonly label: string;
  readonly value: string;
}

/**
 * Las filas que se guardan en `entries_json`: `null` si no hay ninguna, para
 * que una versión SOAP pura siga siendo exactamente lo que era.
 *
 * @param entries - Las filas ya validadas por el DTO, o nada.
 */
export function toEntriesJson(
  entries: readonly NoteEntry[] | undefined,
): NoteEntry[] | null {
  if (entries === undefined || entries.length === 0) return null;
  return entries.map(({ label, value }) => ({ label, value }));
}

/**
 * Lee `entries_json` de una versión. Defensivo: la columna es `jsonb` y no
 * tiene CHECK de forma, así que sólo se devuelven las filas con `label` y
 * `value` de texto. Sin filas, `undefined` —y no `[]`— para que el cliente
 * distinga una nota sin filas.
 *
 * @param json - El valor crudo de la columna.
 */
export function readNoteEntries(
  json: unknown,
): ChartNoteEntryDto[] | undefined {
  if (!Array.isArray(json)) return undefined;
  const rows = json.flatMap((row: unknown) => {
    if (row === null || typeof row !== 'object') return [];
    const { label, value } = row as { label?: unknown; value?: unknown };
    return typeof label === 'string' && typeof value === 'string'
      ? [{ label, value }]
      : [];
  });
  return rows.length === 0 ? undefined : rows;
}

/**
 * Arma el ítem de nota que consume el expediente y la colección por
 * profesional: cabecera más el texto de su versión vigente, si se pudo
 * resolver.
 *
 * Compartido para no duplicar el mapeo entre `ChartReadService` (por
 * paciente) y `ChartNotesReadService` (por profesional): las dos lecturas
 * devuelven exactamente la misma forma de nota.
 *
 * @param header - Cabecera de la nota.
 * @param version - Versión vigente ya resuelta, o `undefined` si no se pudo.
 * @returns El ítem de nota con el texto de su versión vigente.
 */
export function toChartNoteItem(
  header: ClinicalNoteHeaders,
  version: ClinicalNoteVersions | undefined,
): ChartNoteItemDto {
  return {
    noteId: header.id,
    encounterId: header.encounterId,
    noteTypeConceptId: header.noteTypeConceptId,
    lifecycleStatusConceptId: header.lifecycleStatusConceptId,
    currentVersionId: header.currentVersionId,
    versionNumber: version?.versionNumber,
    authorProfileId: version?.authorProfileId,
    entries: readNoteEntries(version?.entriesJson),
    chiefComplaintText: version?.chiefComplaintText,
    subjectiveText: version?.subjectiveText,
    objectiveText: version?.objectiveText,
    assessmentText: version?.assessmentText,
    planText: version?.planText,
    signedAt: version?.signedAt,
    // Liberada al portal es tener una versión liberada, no un estado del
    // encabezado: una nota puede estar firmada y aún así retenida.
    releasedToPatient: Boolean(header.currentReleasedVersionId),
    createdAt: header.createdAt,
  };
}
