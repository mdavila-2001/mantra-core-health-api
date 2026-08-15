import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../common';
import { RefreshTokens, Sessions } from '../../iam/entities';
import {
  MedicalVisitorProducts,
  MedicalVisitorSpecialties,
  MedicalVisitors,
} from '../entities';

/**
 * Acceso a datos del visitador médico, incluida la revocación efectiva de sus
 * sesiones.
 *
 * La revocación vive acá y no en `iam` porque la desvinculación es una operación
 * del laboratorio que debe ocurrir **en la misma transacción** que el cambio de
 * estado del visitador: si el `UPDATE` de sesiones fallara, la cuenta no puede
 * quedar desvinculada con sesiones vivas.
 */
@Injectable()
export class VisitorsRepository {
  /**
   * Obtiene un visitador por identificador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del visitador.
   * @returns El visitador, o `null` si no existe.
   */
  findVisitor(em: EntityManager, id: string): Promise<MedicalVisitors | null> {
    return em.findOne(MedicalVisitors, { id });
  }

  /**
   * Obtiene el visitador asociado a una cuenta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta.
   * @returns El visitador, o `null` si la cuenta no es de un visitador.
   */
  findVisitorByUser(
    em: EntityManager,
    userId: string,
  ): Promise<MedicalVisitors | null> {
    return em.findOne(MedicalVisitors, { userId });
  }

  /**
   * Obtiene un visitador por código interno dentro de su laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param internalCode - Código interno.
   * @returns El visitador, o `null` si el código está libre.
   */
  findVisitorByCode(
    em: EntityManager,
    pharmaLabId: string,
    internalCode: string,
  ): Promise<MedicalVisitors | null> {
    return em.findOne(MedicalVisitors, { pharmaLabId, internalCode });
  }

  /**
   * Lista los visitadores de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Visitadores ordenados por nombre.
   */
  listVisitors(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<MedicalVisitors[]> {
    return em.find(
      MedicalVisitors,
      { pharmaLabId },
      { orderBy: { fullName: 'asc' } },
    );
  }

  /**
   * Crea un visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createVisitor(
    em: EntityManager,
    data: Record<string, unknown>,
  ): MedicalVisitors {
    return em.create(
      MedicalVisitors,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Reemplaza el conjunto de especialidades autorizadas de un visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param medicalVisitorId - Visitador.
   * @param specialtyConceptIds - Especialidades que quedan vigentes.
   * @param actorUserId - Quien ejecuta el cambio.
   */
  async replaceSpecialties(
    em: EntityManager,
    medicalVisitorId: string,
    specialtyConceptIds: readonly string[],
    actorUserId?: string,
  ): Promise<void> {
    await em.nativeDelete(MedicalVisitorSpecialties, { medicalVisitorId });
    for (const specialtyConceptId of new Set(specialtyConceptIds)) {
      em.create(
        MedicalVisitorSpecialties,
        {
          medicalVisitorId,
          specialtyConceptId,
          createdAt: new Date(),
          createdByUserId: actorUserId,
        },
        { partial: true },
      );
    }
  }

  /**
   * Lista las especialidades autorizadas de un visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param medicalVisitorId - Visitador.
   * @returns Filas de especialidad.
   */
  listSpecialties(
    em: EntityManager,
    medicalVisitorId: string,
  ): Promise<MedicalVisitorSpecialties[]> {
    return em.find(MedicalVisitorSpecialties, { medicalVisitorId });
  }

  /**
   * Reemplaza el conjunto de productos autorizados de un visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param medicalVisitorId - Visitador.
   * @param pharmaProductIds - Productos que quedan autorizados.
   * @param authorizedFrom - Fecha desde la que rige la autorización.
   * @param actorUserId - Quien ejecuta el cambio.
   */
  async replaceProducts(
    em: EntityManager,
    medicalVisitorId: string,
    pharmaProductIds: readonly string[],
    authorizedFrom: string,
    actorUserId?: string,
  ): Promise<void> {
    await em.nativeDelete(MedicalVisitorProducts, { medicalVisitorId });
    for (const pharmaProductId of new Set(pharmaProductIds)) {
      em.create(
        MedicalVisitorProducts,
        {
          medicalVisitorId,
          pharmaProductId,
          authorizedFrom,
          createdAt: new Date(),
          createdByUserId: actorUserId,
        },
        { partial: true },
      );
    }
  }

  /**
   * Lista los productos autorizados vigentes de un visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param medicalVisitorId - Visitador.
   * @returns Autorizaciones sin fecha de revocación.
   */
  listAuthorizedProducts(
    em: EntityManager,
    medicalVisitorId: string,
  ): Promise<MedicalVisitorProducts[]> {
    return em.find(MedicalVisitorProducts, {
      medicalVisitorId,
      authorizedTo: null,
    });
  }

  /**
   * Cierra todas las sesiones activas de una cuenta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta cuyas sesiones se cierran.
   * @returns Número de sesiones cerradas.
   */
  revokeSessions(em: EntityManager, userId: string): Promise<number> {
    return em.nativeUpdate(
      Sessions,
      { userId, stateConceptId: CONCEPTS.STATE_ACTIVE },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }

  /**
   * Revoca los tokens de refresco vivos de una cuenta, para que la sesión no
   * pueda renacer con el token que el navegador todavía tiene.
   *
   * Los tokens cuelgan de la sesión, no del usuario, así que primero se resuelven
   * las sesiones de la cuenta. Se hace en dos pasos y no con un `JOIN` porque
   * `nativeUpdate` no admite condiciones sobre otra tabla, y una subconsulta en
   * crudo perdería el mapeo de nombres de columna.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta cuyos tokens se revocan.
   * @returns Número de tokens revocados.
   */
  async revokeRefreshTokens(
    em: EntityManager,
    userId: string,
  ): Promise<number> {
    const sessions = await em.find(
      Sessions,
      { userId },
      { fields: ['id'], disableIdentityMap: true },
    );
    if (sessions.length === 0) return 0;
    return em.nativeUpdate(
      RefreshTokens,
      {
        sessionId: { $in: sessions.map((session) => session.id) },
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      },
      { stateConceptId: CONCEPTS.STATE_REVOKED, updatedAt: new Date() },
    );
  }
}
