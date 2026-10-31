import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import {
  HealthcareServices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
} from '../../../practice/entities';

/** Dónde y de qué se atiende un cupo: espacio y servicio, cuando se pueden determinar. */
export interface SlotPlace {
  /** Espacio de atención del cupo. */
  readonly careSpaceId?: string;
  /** Servicio del cupo. */
  readonly healthcareServiceId?: string;
}

/**
 * Resuelve el espacio y el servicio con los que se materializa un cupo, para
 * que la cita los guarde y la política del personal de apoyo pueda decidir por
 * ubicación y por servicio.
 *
 * Solo declara lo que se puede afirmar: el espacio si el doctor atiende en
 * exactamente uno (vigente) y el servicio si la práctica tiene exactamente uno
 * para ese concepto. Con ambigüedad no elige: deja el campo vacío, y un permiso
 * por ubicación o servicio no cubre una cita sin ese dato.
 */
@Injectable()
export class SchedulingPlaceRepository {
  /**
   * Espacio y servicio de un cupo de un recurso de profesional.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil del profesional dueño del recurso.
   * @param practiceId - Práctica del recurso, si la declara.
   * @param serviceConceptId - Concepto del servicio de la plantilla, si lo declara.
   * @param now - Instante que acota la vigencia de la asignación al espacio.
   * @returns El espacio y el servicio que se pueden afirmar.
   */
  async resolve(
    em: EntityManager,
    practitionerProfileId: string,
    practiceId: string | undefined,
    serviceConceptId: string | undefined,
    now: Date,
  ): Promise<SlotPlace> {
    const roles = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId,
      ...(practiceId ? { practiceId } : {}),
    });
    let careSpaceId: string | undefined;
    if (roles.length > 0) {
      const rows = await em.find(PractitionerLocationAssignments, {
        practitionerRoleAssignmentId: { $in: roles.map((r) => r.id) },
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const spaces = new Set(
        rows
          .filter(
            (r) =>
              (!r.validFrom || r.validFrom <= now) &&
              (!r.validTo || r.validTo > now),
          )
          .map((r) => r.careSpaceId),
      );
      if (spaces.size === 1) careSpaceId = [...spaces][0];
    }
    let healthcareServiceId: string | undefined;
    if (practiceId && serviceConceptId) {
      const services = await em.find(HealthcareServices, {
        practiceId,
        serviceConceptId,
      });
      if (services.length === 1) healthcareServiceId = services[0].id;
    }
    return { careSpaceId, healthcareServiceId };
  }

  /**
   * Dónde atiende y qué presta un doctor: sus espacios vigentes y los servicios
   * de sus asignaciones de rol (en la práctica del recurso, si se indica).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil del doctor.
   * @param practiceId - Práctica del recurso, si la declara.
   * @param now - Instante que acota la vigencia de la asignación al espacio.
   * @returns Sus espacios y servicios reales.
   */
  async placementsOf(
    em: EntityManager,
    practitionerProfileId: string,
    practiceId: string | undefined,
    now: Date,
  ): Promise<{ spaceIds: string[]; serviceIds: string[] }> {
    const roles = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId,
      ...(practiceId ? { practiceId } : {}),
    });
    const serviceIds = [
      ...new Set(
        roles
          .map((r) => r.healthcareServiceId)
          .filter((id): id is string => !!id),
      ),
    ];
    if (roles.length === 0) return { spaceIds: [], serviceIds };
    const rows = await em.find(PractitionerLocationAssignments, {
      practitionerRoleAssignmentId: { $in: roles.map((r) => r.id) },
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const spaceIds = [
      ...new Set(
        rows
          .filter(
            (r) =>
              (!r.validFrom || r.validFrom <= now) &&
              (!r.validTo || r.validTo > now),
          )
          .map((r) => r.careSpaceId),
      ),
    ];
    return { spaceIds, serviceIds };
  }
}
