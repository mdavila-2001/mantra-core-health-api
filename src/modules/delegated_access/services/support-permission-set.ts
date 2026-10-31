import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DelegatedPermissionSetItemsRepository,
  DelegatedPermissionSetsRepository,
} from '../repositories';
import { SUPPORT_ACTIONS, supportPermissionId } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';

/** Código del set de permisos delegados que ancla las delegaciones de apoyo al tenant. */
export const SUPPORT_AGENDA_SET_CODE = 'SUPPORT_AGENDA';

/**
 * Set de permisos delegados de la organización que respalda las delegaciones
 * de apoyo. `practitioner_delegate_assignments` exige un set (es lo que la
 * ancla al tenant); el detalle de qué puede hacer cada persona vive en sus
 * `support_scope_grants`, no en este set, que lista las acciones de apoyo como
 * techo del catálogo. Se crea la primera vez que hace falta.
 *
 * @param tx - Transacción activa.
 * @param sets - Repositorio de sets.
 * @param items - Repositorio de ítems de set.
 * @param tenantId - Organización.
 * @param actorUserId - Quien dispara la creación, si hay actor.
 * @returns El id del set de apoyo de la organización.
 */
export async function ensureSupportAgendaSet(
  tx: EntityManager,
  sets: DelegatedPermissionSetsRepository,
  items: DelegatedPermissionSetItemsRepository,
  tenantId: string,
  actorUserId?: string,
): Promise<string> {
  const existing = await sets.findByCode(tx, tenantId, SUPPORT_AGENDA_SET_CODE);
  if (existing) return existing.id;
  const set = sets.create(tx, {
    tenantId,
    code: SUPPORT_AGENDA_SET_CODE,
    name: 'Personal de apoyo · agenda',
    delegateTypeConceptId: DELEG.DELEGATE_TYPE_SECRETARY,
    description: 'Techo de acciones de apoyo; el detalle va por permiso.',
    statusConceptId: STATUS.ACTIVE,
    actorUserId,
  });
  await tx.flush();
  for (const code of SUPPORT_ACTIONS) {
    items.create(tx, {
      delegatedPermissionSetId: set.id,
      permissionId: supportPermissionId(code),
    });
  }
  return set.id;
}
