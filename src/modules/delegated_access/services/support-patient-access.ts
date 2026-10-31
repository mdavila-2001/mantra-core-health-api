import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import type { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  canRegisterPatients,
  canSearchPatients,
  hasLiveEngagement,
} from '../domain';
import type { SupportAccessRepository } from '../repositories';
import type { SupportAccessPolicy } from './support-access.policy';
import { withSystemKey } from './tenant-context';

/** Lo que la persona de apoyo puede hacer con pacientes en una organización. */
export interface PatientStanding {
  /** ¿Tiene un vínculo vivo en la organización (con o sin permisos)? */
  readonly linked: boolean;
  /** ¿Puede buscar pacientes? */
  readonly canSearch: boolean;
  /** ¿Puede registrar pacientes? */
  readonly canRegister: boolean;
}

/**
 * Carga el estado de la persona en la organización indicada: si tiene vínculo
 * vivo y qué puede hacer con pacientes. El vínculo se verifica ANTES de sellar
 * nada en la cadena de auditoría de esa organización.
 *
 * @param policy - Política de apoyo (carga los hechos de los vínculos).
 * @param engagements - Vínculos de apoyo.
 * @param tx - Transacción activa.
 * @param userId - Persona de apoyo.
 * @param tenantId - Organización indicada en el cuerpo (aún sin verificar).
 * @param now - Instante de la decisión.
 * @param intent - Lo que la persona intenta (`search` o `register`): si una regla de la
 *   organización le cierra ESE permiso, la denegación deja su asiento `ORG_RULE_DENY` en
 *   `access_decision_log`. Sin intención es solo lectura de contexto y no asienta nada.
 * @returns El estado de la persona en la organización.
 */
export async function loadPatientStanding(
  policy: SupportAccessPolicy,
  engagements: SupportAccessRepository,
  tx: EntityManager,
  userId: string,
  tenantId: string,
  now: Date,
  intent?: 'search' | 'register',
): Promise<PatientStanding> {
  const records = await engagements.findEngagements(tx, { userId, tenantId });
  const facts = records.length ? await policy.loadFacts(tx, records) : [];
  // Una regla de la organización (`DENY_PERMISSION`) también cierra la búsqueda y
  // el alta: no dependen de un doctor, pero sí de las reglas de la organización.
  const denied = async (
    atom: string,
    asked: 'search' | 'register',
  ): Promise<boolean> => {
    const closed =
      typeof policy.deniedByOrgRule === 'function' &&
      (await policy.deniedByOrgRule(tx, tenantId, facts, atom, now));
    if (closed && intent === asked) {
      await policy.recordOrgRuleDenial?.(tx, tenantId, userId, atom);
    }
    return closed;
  };
  return {
    linked: hasLiveEngagement(facts, now),
    canSearch:
      canSearchPatients(facts, now) &&
      !(await denied('patients.search.exact', 'search')),
    canRegister:
      canRegisterPatients(facts, now) &&
      !(await denied('patients.profile.register', 'register')),
  };
}

/** Un asiento de la partición propia de la persona. */
export interface OwnPartitionEntry {
  readonly action: string;
  readonly entity: string;
  readonly success: boolean;
}

/**
 * Sella un rechazo en la partición propia de quien lo provocó (la cadena sin
 * tenant), nunca en la de una organización: quien no tiene vínculo en la
 * organización que escribió en el cuerpo no puede dejar asientos en su cadena
 * (ni competir por su cerrojo). Con RLS, la fila sin tenant solo la admite el
 * contexto de sistema, que se abre únicamente mientras dura este asiento.
 *
 * @param audit - Sello en la cadena de auditoría.
 * @param tx - Transacción activa.
 * @param actor - Quien provocó el rechazo.
 * @param entry - El asiento.
 */
export function sealInOwnPartition(
  audit: AuditTrailService,
  tx: EntityManager,
  actor: AuthenticatedUser,
  entry: OwnPartitionEntry,
): Promise<void> {
  return withSystemKey(tx, () =>
    audit.record(tx, actor, {
      action: entry.action,
      entity: entry.entity,
      success: entry.success,
    }),
  );
}
