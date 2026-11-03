import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Addresses } from '../../common/entities';
import {
  HealthcareServices,
  PracticeSites,
  Practices,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { ServiceRequests } from '../entities';
import { CLIN } from '../clinical.concepts';

/**
 * Las categorías de orden que se cumplen en un centro médico.
 *
 * Laboratorio e imagen tienen su propio buscador (`/diagnostic-units/search`)
 * y anatomía patológica viaja con la muestra; lo que queda es lo que la persona
 * va a hacerse a un establecimiento: procedimientos y estudios de cardiología.
 */
export const MEDICAL_CENTER_CATEGORIES: readonly string[] = [
  CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
  CLIN.SERVICE_REQUEST_CATEGORY_CARDIO,
];

/**
 * Lecturas de «dónde me hago este procedimiento».
 *
 * Cruza dos módulos sin escribir ninguno: las órdenes salen de `clinical` y la
 * oferta de `practice` (`healthcare_services` por sede). Es la misma forma que
 * usa `diagnostic_units` para llegar a la dirección de una sede: clases sin
 * estado que reciben el `EntityManager` por parámetro.
 */
@Injectable()
export class ProcedureCentersReadRepository {
  /**
   * Las órdenes vigentes del titular en las categorías de centro médico.
   *
   * Sólo las `ACTIVE`: un borrador todavía no se lo dieron, una suspendida no
   * está para cumplirse, y una completada o revocada ya no le pide nada.
   */
  findPendingOrders(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<ServiceRequests[]> {
    return em.find(
      ServiceRequests,
      {
        patientProfileId,
        categoryConceptId: { $in: [...MEDICAL_CENTER_CATEGORIES] },
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /** Los servicios activos que declaran alguno de los conceptos pedidos. */
  findActiveOfferings(
    em: EntityManager,
    conceptIds: readonly string[],
  ): Promise<HealthcareServices[]> {
    if (conceptIds.length === 0) return Promise.resolve([]);
    return em.find(HealthcareServices, {
      serviceConceptId: { $in: [...conceptIds] },
      statusConceptId: PRAC.SERVICE_ACTIVE,
    });
  }

  /** Los establecimientos activos de entre los pedidos. */
  findActivePractices(
    em: EntityManager,
    practiceIds: readonly string[],
  ): Promise<Practices[]> {
    if (practiceIds.length === 0) return Promise.resolve([]);
    return em.find(Practices, {
      id: { $in: [...practiceIds] },
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    });
  }

  /**
   * Las sedes activas de esos establecimientos.
   *
   * Una sede cerrada (`SITE_OP_CLOSED`) queda afuera aunque su estado de
   * registro siga activo: mandar a alguien a una puerta cerrada es peor que no
   * mostrarla.
   */
  findOpenSites(
    em: EntityManager,
    practiceIds: readonly string[],
  ): Promise<PracticeSites[]> {
    if (practiceIds.length === 0) return Promise.resolve([]);
    return em.find(PracticeSites, {
      practiceId: { $in: [...practiceIds] },
      statusConceptId: PRAC.SITE_ACTIVE,
      $or: [
        { operationalStatusConceptId: null },
        { operationalStatusConceptId: { $ne: PRAC.SITE_OP_CLOSED } },
      ],
    });
  }

  /** Direcciones por id. */
  findAddresses(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Addresses[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Addresses, { id: { $in: [...ids] } });
  }
}
