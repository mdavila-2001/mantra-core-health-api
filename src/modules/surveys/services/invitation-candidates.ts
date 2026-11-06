import type { EntityManager } from '@mikro-orm/postgresql';
import type { TemplatesRepository } from '../repositories';
import type {
  SurveyAssignments,
  SurveyTemplates,
  SurveyVersions,
} from '../entities';
import { SURVEYS, isSystemOwnerType } from '../surveys.concepts';

/**
 * Qué tan específico es el destino de una asignación: cuanto menor, más
 * específico. Ordena las encuestas del profesional que aplican a una reserva.
 */
const TARGET_SPECIFICITY: Readonly<Record<string, number>> = {
  [SURVEYS.TARGET_APPOINTMENT]: 0,
  [SURVEYS.TARGET_SERVICE]: 1,
  [SURVEYS.TARGET_CARE_TYPE]: 2,
};

/** Si la plantilla se importó del catálogo estándar (y no se escribió a mano). */
export function isCatalogTemplate(template: {
  /** Código `STD_*` de procedencia, si lo tiene. */
  standardCatalogCode?: string | null;
}): boolean {
  return (
    typeof template.standardCatalogCode === 'string' &&
    template.standardCatalogCode.length > 0
  );
}

/** Una encuesta del profesional que aplica a la reserva que se está cerrando. */
export interface PractitionerCandidate {
  /** La asignación que la trae. */
  assignment: SurveyAssignments;
  /** Su versión publicada y vigente. */
  version: SurveyVersions;
  /** Su plantilla (del profesional que atendió). */
  template: SurveyTemplates;
}

/** Si el instante indicado cae dentro de la vigencia de la versión. */
function isEffective(
  from: Date | undefined,
  to: Date | undefined,
  now: Date,
): boolean {
  if (from && now < from) return false;
  if (to && now > to) return false;
  return true;
}

/** Si la plantilla es del profesional (y no una encuesta de sistema). */
function isPractitionerOf(
  template: SurveyTemplates,
  practitionerProfileId: string,
): boolean {
  return (
    !isSystemOwnerType(template.ownerTypeConceptId) &&
    template.ownerPractitionerId === practitionerProfileId
  );
}

/**
 * Las encuestas del profesional que atendió que aplican a una reserva, de la
 * más específica a la menos (a igual especificidad, la más reciente).
 *
 * Aplica una asignación activa cuya versión está vigente, cuya plantilla está
 * activa y **es del profesional que atendió** (una asignación heredada o mal
 * cargada no puede repartir la encuesta de un colega), y que no es la base del
 * sistema, que se emite aparte. Una misma versión asignada por dos destinos
 * cuenta una vez y, de una plantilla, sólo se reparte su versión más alta.
 */
export class InvitationCandidates {
  constructor(private readonly templatesRepo: TemplatesRepository) {}

  async forBooking(
    tx: EntityManager,
    assignments: SurveyAssignments[],
    practitionerProfileId: string | null,
    now: Date,
  ): Promise<PractitionerCandidate[]> {
    if (practitionerProfileId === null) return [];

    const ordered = [...assignments].sort(
      (a, b) =>
        (TARGET_SPECIFICITY[a.targetTypeConceptId] ?? 3) -
          (TARGET_SPECIFICITY[b.targetTypeConceptId] ?? 3) ||
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );

    const candidates: PractitionerCandidate[] = [];
    const seen = new Set<string>();
    for (const assignment of ordered) {
      if (seen.has(assignment.surveyVersionId)) continue;
      const version = await this.templatesRepo.findVersionById(
        tx,
        assignment.surveyVersionId,
      );
      if (!version) continue;
      if (!isEffective(version.effectiveFrom, version.effectiveTo, now))
        continue;

      const template = await this.templatesRepo.findTemplateById(
        tx,
        version.surveyTemplateId,
      );
      // Una plantilla desactivada deja de repartirse; lo ya emitido sigue en
      // pie, que es exactamente la diferencia entre desactivar y borrar.
      if (!template || template.statusConceptId === SURVEYS.TEMPLATE_INACTIVE)
        continue;
      if (!isPractitionerOf(template, practitionerProfileId)) continue;

      seen.add(version.id);
      candidates.push({ assignment, version, template });
    }

    // Dos versiones de una plantilla asignadas a la vez (la vieja y la
    // corregida) le repetirían la encuesta al paciente.
    const highest = new Map<string, number>();
    for (const { version } of candidates) {
      highest.set(
        version.surveyTemplateId,
        Math.max(
          highest.get(version.surveyTemplateId) ?? 0,
          version.versionNumber,
        ),
      );
    }
    return candidates.filter(
      ({ version }) =>
        version.versionNumber >= (highest.get(version.surveyTemplateId) ?? 0),
    );
  }
}
