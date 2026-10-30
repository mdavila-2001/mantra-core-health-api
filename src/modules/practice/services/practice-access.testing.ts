import { PracticeAccessService } from './practice-access.service';
import { PracticeTenantLookupService } from './practice-tenant-lookup.service';

/** Una vinculación tal como la guarda `practice.practitioner_role_assignments`. */
export interface AssignmentRow {
  practitionerProfileId: string;
  practiceId: string;
  statusConceptId: string;
  validTo: Date | null;
}

/**
 * `PracticeAccessService` real sobre un `PracticeTenantLookupService` real,
 * con el repositorio de vinculaciones en memoria: filtra por estado y
 * vigencia igual que la consulta de verdad, así que una vinculación PENDING
 * se ve rechazada por la regla y no por cómo se armó el doble.
 *
 * @param rows - Vinculaciones existentes.
 * @returns El servicio de acceso.
 */
export function buildPracticeAccess(
  rows: AssignmentRow[] = [],
): PracticeAccessService {
  const roleAssignments = {
    findActiveByPractitioner: (
      _em: unknown,
      practitionerProfileId: string,
      statusConceptId: string,
    ) =>
      Promise.resolve(
        rows.filter(
          (row) =>
            row.practitionerProfileId === practitionerProfileId &&
            row.statusConceptId === statusConceptId &&
            row.validTo === null,
        ),
      ),
  };
  const lookup = new PracticeTenantLookupService(
    { fork: () => ({}) } as never,
    {} as never,
    roleAssignments as never,
  );
  return new PracticeAccessService(lookup);
}
