import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { PRAC } from '../../practice/practice.concepts';
import {
  PracticeSites,
  Practices,
  PractitionerRoleAssignments,
} from '../../practice/entities';

/** Dónde queda la solicitud de un médico que canjeó un QR multiuso sin destino. */
export interface PractitionerAffiliationTarget {
  /** Práctica de la organización que recibe la solicitud. */
  readonly practiceId: string;
  /** Sede en la que aparece la solicitud, si la práctica tiene alguna activa. */
  readonly practiceSiteId?: string;
}

/**
 * Solicitudes de afiliación de médicos (`practice.practitioner_role_assignments`)
 * que deja el canje de un QR multiuso sin persona destino. Es el flujo que la
 * organización ya usa para aprobar o rechazar médicos
 * (`POST /role-assignments/:id/approve|reject`): la solicitud nace `PENDING`
 * y la lista `GET /practices/:practiceId/role-assignments` la muestra.
 */
@Injectable()
export class PractitionerAffiliationRepository {
  /**
   * La práctica y la sede donde queda la solicitud: la primera práctica activa
   * de la organización por código (la que la pantalla de la organización elige
   * por defecto) y la primera sede activa de esa práctica por código. El QR no
   * trae sede, servicio ni especialidad: sin sede activa la solicitud queda sin
   * sede.
   *
   * @param em - Contexto de persistencia o transacción activa, ya con la organización fijada.
   * @param tenantId - Organización de la invitación.
   * @returns El destino, o `null` si la organización no tiene una práctica activa.
   */
  async findTarget(
    em: EntityManager,
    tenantId: string,
  ): Promise<PractitionerAffiliationTarget | null> {
    const practices = await em.find(Practices, {
      tenantId,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    });
    const practice = [...practices].sort((a, b) =>
      a.code.localeCompare(b.code),
    )[0];
    if (!practice) return null;
    const sites = await em.find(PracticeSites, {
      practiceId: practice.id,
      statusConceptId: PRAC.SITE_ACTIVE,
    });
    const site = [...sites].sort((a, b) => a.code.localeCompare(b.code))[0];
    return { practiceId: practice.id, practiceSiteId: site?.id };
  }

  /**
   * Deja la solicitud `PENDING` del médico en la práctica: rol de atención, sin
   * servicio ni especialidad. Si ya tiene una pendiente sin servicio en esa
   * práctica la devuelve (un doble canje con otro código no apila filas).
   *
   * La fila la crea la cuenta del propio médico: la pantalla la muestra como
   * iniciada por el profesional.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil profesional que pide afiliarse.
   * @param target - Práctica y sede de la solicitud.
   * @param userId - Cuenta del médico que canjeó el código.
   * @returns La solicitud pendiente (una nueva queda sin flush).
   */
  async ensurePending(
    em: EntityManager,
    practitionerProfileId: string,
    target: PractitionerAffiliationTarget,
    userId: string,
  ): Promise<PractitionerRoleAssignments> {
    const existing = await em.findOne(PractitionerRoleAssignments, {
      practitionerProfileId,
      practiceId: target.practiceId,
      healthcareServiceId: null,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
    });
    if (existing) return existing;
    return em.create(
      PractitionerRoleAssignments,
      {
        practitionerProfileId,
        practiceId: target.practiceId,
        practiceSiteId: target.practiceSiteId,
        roleConceptId: PRAC.ROLE_ATTENDING,
        validFrom: new Date(),
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        ...createdBy(userId),
      },
      { partial: true },
    );
  }
}
