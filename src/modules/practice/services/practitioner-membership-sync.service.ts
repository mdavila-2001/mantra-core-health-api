import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { PersonAccountLinks } from '../../profiles/entities';
import { PROF } from '../../profiles/profiles.concepts';
import { withTenantContext } from '../../delegated_access/services/tenant-context';
import { PRAC } from '../practice.concepts';
import { PractitionerRoleAssignments } from '../entities';
import { PracticesRepository } from '../repositories';

/**
 * Lo que la decisión de la organización sobre una solicitud de afiliación de un
 * médico hace con su membresía.
 *
 * Un médico que canjea un QR multiuso de la organización (sin persona destino)
 * deja dos cosas: la solicitud `PENDING` en `practitioner_role_assignments` y
 * una membresía `MEMBERSHIP_INVITED` en la organización dueña de la práctica
 * (`delegated_access`), que no cuenta para el token ni para ninguna lectura.
 * Aprobar la solicitud la activa; rechazarla la termina. Una solicitud sin
 * membresía pendiente (la del médico que pide por su cuenta, la de un médico
 * que ya es miembro) no toca ninguna membresía.
 */
@Injectable()
export class PractitionerMembershipSyncService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param practicesRepo - Práctica dueña de la solicitud (de ella sale la organización).
   */
  constructor(private readonly practicesRepo: PracticesRepository) {}

  /**
   * Aplica la decisión sobre las membresías pendientes del médico en la
   * organización de la práctica. Solo actúa sobre membresías
   * `MEMBERSHIP_INVITED` de las cuentas activas del perfil profesional.
   *
   * - Aprobada: la membresía pasa a `MEMBERSHIP_ACTIVE`.
   * - Rechazada: la membresía termina (`MEMBERSHIP_ENDED`) salvo que el médico
   *   conserve otra solicitud pendiente en la misma práctica.
   *
   * Con RLS escribe dentro del contexto de la organización de la práctica, que
   * puede no ser la activa de quien decide.
   *
   * @param tx - Transacción de la decisión.
   * @param role - Solicitud ya decidida (con su estado nuevo).
   * @param approved - `true` si se aprobó; `false` si se rechazó.
   * @param actorUserId - Quien decide.
   * @returns Cuántas membresías cambiaron.
   */
  async settle(
    tx: EntityManager,
    role: PractitionerRoleAssignments,
    approved: boolean,
    actorUserId: string,
  ): Promise<number> {
    const practice = await this.practicesRepo.findById(tx, role.practiceId);
    if (!practice) return 0;
    const links = await tx.find(PersonAccountLinks, {
      personId: role.practitionerProfileId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    const userIds = [...new Set(links.map((link) => link.userId))];
    if (userIds.length === 0) return 0;

    return withTenantContext(tx, practice.tenantId, async () => {
      const pending = await tx.find(TenantMemberships, {
        userId: { $in: userIds },
        tenantId: practice.tenantId,
        statusConceptId: DIR.MEMBERSHIP_INVITED,
      });
      if (pending.length === 0) return 0;
      if (!approved && (await this.hasOtherPending(tx, role))) return 0;
      const now = new Date();
      for (const membership of pending) {
        membership.statusConceptId = approved
          ? DIR.MEMBERSHIP_ACTIVE
          : DIR.MEMBERSHIP_ENDED;
        membership.endDate = approved ? undefined : now;
        membership.updatedAt = now;
        membership.updatedByUserId = actorUserId;
      }
      return pending.length;
    });
  }

  /** ¿Conserva el médico otra solicitud pendiente en la misma práctica? */
  private async hasOtherPending(
    tx: EntityManager,
    role: PractitionerRoleAssignments,
  ): Promise<boolean> {
    const others = await tx.count(PractitionerRoleAssignments, {
      practitionerProfileId: role.practitionerProfileId,
      practiceId: role.practiceId,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
      id: { $ne: role.id },
    });
    return others > 0;
  }
}
