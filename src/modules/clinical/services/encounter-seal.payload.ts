/**
 * Forma canónica del contenido que se sella al cerrar un encuentro (C.4).
 *
 * Claves fijas y arrays ordenados por `id` (o por `createdAt, id` en el
 * origen): el mismo encuentro produce siempre el mismo JSON, así que el
 * mismo contenido produce siempre el mismo hash sin importar el orden en
 * que la base devolvió las filas.
 */
export interface EncounterSealPayload {
  encounter: {
    id: string;
    patientProfileId: string;
    primaryPractitionerId: string | null;
    startAt: string | null;
    endAt: string | null;
  };
  notes: Array<{
    headerId: string;
    versionId: string | null;
    contentHash: string | null;
  }>;
  conditions: Array<{
    id: string;
    codeConceptId: string;
    clinicalStatusConceptId: string | null;
    verificationStatusConceptId: string | null;
  }>;
  medicationRequests: Array<{
    id: string;
    rowVersion: number;
  }>;
  carePlans: Array<{
    id: string;
    rowVersion: number;
    activityIds: string[];
  }>;
  documents: Array<{
    id: string;
    fileIds: string[];
  }>;
}
