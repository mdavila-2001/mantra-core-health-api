import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { DELEG } from '../delegated_access.concepts';

/** Destinos posibles de una asignación. */
export interface AssignmentTargets {
  practiceId?: string;
  practiceSiteId?: string;
  clinicalUnitId?: string;
  careSpaceId?: string;
}

/**
 * F5g (CONTRATO-F2-F5 §F5g): la sede, unidad y espacio de la asignación son
 * del tenant de la membresía (404 sin distinguir) y el alcance pide su
 * destino (422 `ASSIGNMENT_SCOPE_TARGET_REQUIRED`) y uno coherente (422
 * `ASSIGNMENT_SCOPE_TARGET_MISMATCH`: unidad de otra sede, espacio de otra
 * sede).
 *
 * @param tx - Transacción.
 * @param tenantMembershipId - Membresía.
 * @param scope - Alcance pedido.
 * @param t - Destinos.
 */
export async function assertAssignmentTargets(
  tx: EntityManager,
  tenantMembershipId: string,
  scope: string,
  t: AssignmentTargets,
): Promise<void> {
  const [m] = await tx.execute<{ tenant_id: string }[]>(
    'SELECT tenant_id FROM directory.tenant_memberships WHERE id = ?',
    [tenantMembershipId],
    'all',
  );
  if (!m)
    throw new ResourceNotFoundException('Membresía no encontrada', {
      tenantMembershipId,
    });
  const required: Record<string, keyof AssignmentTargets | null> = {
    SITE: 'practiceSiteId',
    UNIT: 'clinicalUnitId',
    SPACE: 'careSpaceId',
    PRACTICE: 'practiceId',
  };
  const need = required[scope];
  if (need && !t[need]) {
    throw new PreconditionFailedException(
      'El alcance necesita su destino',
      { scope, field: need },
      'ASSIGNMENT_SCOPE_TARGET_REQUIRED',
    );
  }
  const one = async (sql: string, id: string | undefined) => {
    if (!id) return null;
    const [row] = await tx.execute<
      { tenant_id: string; site: string | null; practice: string | null }[]
    >(sql, [id], 'all');
    if (!row || row.tenant_id !== m.tenant_id)
      throw new ResourceNotFoundException('Recurso no encontrado');
    return row;
  };
  const site = await one(
    'SELECT tenant_id, id AS site, practice_id AS practice FROM practice.practice_sites WHERE id = ?',
    t.practiceSiteId,
  );
  const unit = await one(
    'SELECT tenant_id, practice_site_id AS site, NULL AS practice FROM practice.clinical_units WHERE id = ?',
    t.clinicalUnitId,
  );
  const space = await one(
    'SELECT tenant_id, practice_site_id AS site, NULL AS practice FROM practice.care_spaces WHERE id = ?',
    t.careSpaceId,
  );
  await one(
    'SELECT tenant_id, NULL AS site, id AS practice FROM practice.practices WHERE id = ?',
    t.practiceId,
  );
  const siteOf = site?.site ?? unit?.site ?? space?.site;
  const mismatch =
    (unit && siteOf && unit.site !== siteOf) ||
    (space && siteOf && space.site !== siteOf) ||
    (site && t.practiceId && site.practice !== t.practiceId);
  if (mismatch) {
    throw new PreconditionFailedException(
      'Los destinos de la asignación no son coherentes',
      { scope },
      'ASSIGNMENT_SCOPE_TARGET_MISMATCH',
    );
  }
}

/**
 * Jefe de servicio único vigente (regla B.5-29): 409
 * `UNIT_HEAD_ALREADY_ASSIGNED`; la base es la red
 * (`ex_org_user_assignments_unit_head`).
 *
 * @param tx - Transacción.
 * @param clinicalUnitId - Unidad.
 * @param validFrom - Inicio (por defecto ahora).
 * @param validTo - Fin, o abierto.
 */
export async function assertSingleUnitHead(
  tx: EntityManager,
  clinicalUnitId: string,
  validFrom?: string,
  validTo?: string,
): Promise<void> {
  const from = validFrom ? new Date(validFrom) : new Date();
  const to = validTo ? new Date(validTo) : null;
  const rows = await tx.execute<{ id: string }[]>(
    `SELECT id FROM delegated_access.organization_user_assignments
      WHERE clinical_unit_id = ? AND assignment_role_concept_id = ? AND status_concept_id = ?
        AND tstzrange(coalesce(valid_from, '-infinity'), valid_to, '[)') && tstzrange(?, ?, '[)')
      LIMIT 1`,
    [
      clinicalUnitId,
      DELEG.ASSIGN_ROLE_UNIT_HEAD,
      CONCEPTS.STATE_ACTIVE,
      from,
      to,
    ],
    'all',
  );
  if (rows.length > 0) {
    throw new ConflictException(
      'La unidad ya tiene un jefe vigente',
      { clinicalUnitId },
      'UNIT_HEAD_ALREADY_ASSIGNED',
    );
  }
}
