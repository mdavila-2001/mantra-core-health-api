import type { ClinicalNoteHeaders, ClinicalNoteVersions } from '../entities';
import type { ChartNoteItemDto } from '../dto';

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
