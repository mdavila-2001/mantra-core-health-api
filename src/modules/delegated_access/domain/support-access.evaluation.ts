import { withinWindow } from './support-access.coverage';
import {
  evaluateSupportAccessV2,
  type SupportEvaluationEnv,
} from './support-access.decide';
import type {
  EngagementFacts,
  SupportAccessDecision,
  SupportAccessQuery,
} from './support-access.types';
import { atomsOfGrant } from './support-access.candidates';

/*
 * Fachada pública de la política de apoyo. El motor vive en
 * `support-access.decide.ts` (`evaluateSupportAccessV2`); los tipos, en
 * `support-access.types.ts`; la cobertura de objetivos, en
 * `support-access.coverage.ts`. Todo se reexporta aquí para que quien importaba
 * de este archivo (y de `index.ts`) siga compilando sin cambios.
 */
export * from './support-access.types';
export { grantCovers } from './support-access.coverage';
export {
  evaluateSupportAccessV2,
  type SupportEvaluationEnv,
  type SupportEvaluationResult,
} from './support-access.decide';

/**
 * Evalúa, sobre datos ya cargados, si la persona de apoyo puede hacer la
 * acción. Es el envoltorio histórico de `evaluateSupportAccessV2`: devuelve
 * `{ allowed, reason, grantId }` (más nada) y por eso un llamador antiguo falla
 * cerrado ante un `CHALLENGE` (`allowed = false`). La regla del contrato, en
 * este orden:
 *
 *  1. vínculo activo y no vencido;
 *  2. el doctor de la cita aceptó a la persona;
 *  3. algún permiso vigente cubre la cita (doctor, servicio, ubicación por su
 *     ruta, cruces, «todos»);
 *  4. ese permiso incluye la acción.
 *
 * Con datos de hoy (alias y sin condiciones) el resultado es idéntico al de
 * siempre; las capas nuevas (barandilla, reglas, `DENY`, condiciones y
 * obligaciones) solo actúan si hay datos para ellas. El «registro» (quinto
 * paso) lo hace quien llama. La función es pura: no lee ni escribe nada.
 *
 * @param engagements - Vínculos de la persona en la organización.
 * @param query - Acción y objetivo.
 * @param now - Instante de la decisión.
 * @param env - Opcional: hechos y reglas de la organización.
 * @returns El veredicto con su motivo y el permiso que lo habilitó.
 */
export function evaluateSupportAccess(
  engagements: readonly EngagementFacts[],
  query: SupportAccessQuery,
  now: Date,
  env?: SupportEvaluationEnv,
): SupportAccessDecision {
  const { decision } = evaluateSupportAccessV2(engagements, query, now, env);
  return {
    allowed: decision.allowed,
    reason: decision.reason,
    ...(decision.grantId ? { grantId: decision.grantId } : {}),
  };
}

/**
 * ¿La persona sostiene el átomo? Hace falta un vínculo activo y vigente con al
 * menos una concesión `ALLOW` vigente que lo incluya (por alias o por átomo).
 * Es la base de `canSearchPatients` y `canRegisterPatients`, que no dependen de
 * un doctor concreto.
 */
function holds(
  engagements: readonly EngagementFacts[],
  now: Date,
  atom: string,
): boolean {
  return engagements.some(
    (e) =>
      e.active &&
      withinWindow(now, e.validFrom, e.validTo) &&
      !e.onboardingIncomplete &&
      e.grants.some(
        (g) =>
          g.active &&
          g.effect !== 'DENY' &&
          withinWindow(now, g.validFrom, g.validTo) &&
          atomsOfGrant(g).has(atom),
      ),
  );
}

/**
 * ¿Puede la persona buscar pacientes en la organización? Hace falta un vínculo
 * activo y vigente con al menos un permiso vigente que incluya
 * `patients.search.exact` (hoy implícito en crear, reprogramar, llegada, sin
 * cita y registrar). La búsqueda no depende de un doctor concreto.
 *
 * @param engagements - Vínculos de la persona en la organización.
 * @param now - Instante de la decisión.
 * @returns `true` si puede buscar.
 */
export function canSearchPatients(
  engagements: readonly EngagementFacts[],
  now: Date,
): boolean {
  return holds(engagements, now, 'patients.search.exact');
}

/**
 * ¿Puede la persona registrar pacientes nuevos en la organización? Hace falta
 * un vínculo activo y vigente con al menos un permiso vigente que incluya
 * `patients.profile.register` (`patient.register` lo trae). Como la búsqueda,
 * no depende de un doctor concreto: el paciente nuevo no pertenece todavía a
 * ninguna agenda.
 *
 * @param engagements - Vínculos de la persona en la organización.
 * @param now - Instante de la decisión.
 * @returns `true` si puede registrar.
 */
export function canRegisterPatients(
  engagements: readonly EngagementFacts[],
  now: Date,
): boolean {
  return holds(engagements, now, 'patients.profile.register');
}
