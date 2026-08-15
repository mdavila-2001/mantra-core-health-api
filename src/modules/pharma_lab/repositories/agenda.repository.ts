import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  DoctorVisitBlocks,
  DoctorVisitPolicies,
  DoctorVisitWindows,
} from '../entities';
import { PHL } from '../pharma_lab.concepts';

/** Acceso a datos de la agenda de visitas del doctor: política, ventanas y bloqueos. */
@Injectable()
export class AgendaRepository {
  /**
   * Obtiene la política de visitas de un doctor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @returns La política, o `null` si el doctor no configuró agenda de visitas.
   */
  findPolicy(
    em: EntityManager,
    doctorUserId: string,
  ): Promise<DoctorVisitPolicies | null> {
    return em.findOne(DoctorVisitPolicies, { doctorUserId });
  }

  /**
   * Crea la política de visitas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createPolicy(
    em: EntityManager,
    data: Record<string, unknown>,
  ): DoctorVisitPolicies {
    return em.create(
      DoctorVisitPolicies,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Lista las ventanas de una política.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorVisitPolicyId - Política.
   * @returns Ventanas ordenadas por día y hora.
   */
  listWindows(
    em: EntityManager,
    doctorVisitPolicyId: string,
  ): Promise<DoctorVisitWindows[]> {
    return em.find(
      DoctorVisitWindows,
      { doctorVisitPolicyId },
      { orderBy: { weekday: 'asc', startTime: 'asc' } },
    );
  }

  /**
   * Reemplaza las ventanas de una política.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorVisitPolicyId - Política.
   * @param windows - Ventanas que quedan vigentes.
   * @param actorUserId - Quien ejecuta el cambio.
   */
  async replaceWindows(
    em: EntityManager,
    doctorVisitPolicyId: string,
    windows: readonly Record<string, unknown>[],
    actorUserId?: string,
  ): Promise<void> {
    await em.nativeDelete(DoctorVisitWindows, { doctorVisitPolicyId });
    for (const window of windows) {
      em.create(
        DoctorVisitWindows,
        {
          doctorVisitPolicyId,
          ...window,
          ...createdBy(actorUserId),
        },
        { partial: true },
      );
    }
  }

  /**
   * Crea un bloqueo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createBlock(
    em: EntityManager,
    data: Record<string, unknown>,
  ): DoctorVisitBlocks {
    return em.create(
      DoctorVisitBlocks,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene un bloqueo por identificador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del bloqueo.
   * @returns El bloqueo, o `null` si no existe.
   */
  findBlock(em: EntityManager, id: string): Promise<DoctorVisitBlocks | null> {
    return em.findOne(DoctorVisitBlocks, { id });
  }

  /**
   * Lista los bloqueos vigentes de un doctor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @returns Bloqueos con estado vigente.
   */
  listActiveBlocks(
    em: EntityManager,
    doctorUserId: string,
  ): Promise<DoctorVisitBlocks[]> {
    return em.find(DoctorVisitBlocks, {
      doctorUserId,
      statusConceptId: PHL.BLOCK_ACTIVE,
    });
  }

  /**
   * Indica si el doctor tiene un bloqueo vigente sobre el laboratorio o el
   * visitador dados.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Doctor.
   * @param pharmaLabId - Laboratorio del visitador.
   * @param medicalVisitorId - Visitador.
   * @returns El bloqueo que aplica, o `null` si no hay ninguno.
   */
  findApplicableBlock(
    em: EntityManager,
    doctorUserId: string,
    pharmaLabId: string,
    medicalVisitorId: string,
  ): Promise<DoctorVisitBlocks | null> {
    return em.findOne(DoctorVisitBlocks, {
      doctorUserId,
      statusConceptId: PHL.BLOCK_ACTIVE,
      $or: [{ pharmaLabId }, { medicalVisitorId }],
    });
  }
}
