import { Injectable } from '@nestjs/common';
import { QueryOrder, type EntityManager } from '@mikro-orm/postgresql';
import {
  ClaimAdjudicationVersions,
  ClaimDisputes,
  ClaimLineAdjudications,
  InsuranceCarriers,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientCoverages,
} from '../entities';
import { INS } from '../insurance.concepts';

/** Filtros con los que se recorre el listado de solicitudes. */
export interface ClaimListFilters {
  /** Estado de la solicitud. */
  readonly statusConceptId?: string;
  /** Aseguradora a la que se presentó. */
  readonly insuranceCarrierId?: string;
  /** Desde (inclusive) sobre `submitted_at`. */
  readonly submittedFrom?: Date;
  /** Hasta (inclusive) sobre `submitted_at`. */
  readonly submittedTo?: Date;
}

/** Clave de continuación del listado, en las columnas por las que se ordena. */
export interface ClaimCursor {
  /** `submitted_at` de la última fila devuelta, en ISO; `null` si no tenía. */
  readonly submittedAt: string | null;
  /** `id` de la última fila devuelta, que desempata. */
  readonly id: string;
}

/**
 * Consultas de lectura del ciclo del reclamo.
 *
 * **El alcance es el del prestador que envió la solicitud** (TAREA-16 · D1.a,
 * decisión de Justin del 2026-09-04). La pantalla es la del consultorio o la
 * clínica que le presenta el reclamo a la aseguradora —«solicitudes de seguro
 * **enviadas**»—, no la del pagador que lo recibe. La versión anterior filtraba
 * por las aseguradoras del tenant, que es el lado contrario: desde un
 * consultorio el listado salía siempre vacío, y desde una aseguradora mostraba
 * los reclamos que le presentaron terceros.
 *
 * La solicitud no tiene `tenant_id`; lo que sí tiene es quién la factura:
 * `billing_provider_type_concept_id` + `billing_provider_entity_id`. Con el
 * tipo `BILLING_PROVIDER_TYPE_PRACTICE` —el único que este módulo escribe— esa
 * columna es un `practice.practices.id`, así que el alcance son **las prácticas
 * activas de la organización activa**, que `practice` resuelve por su puerto.
 * Se filtra por el tipo **además** del id: sin eso, el día que exista un
 * segundo tipo de facturador un uuid de otra tabla podría colarse por
 * coincidencia.
 *
 * **El filtro va dentro de la consulta**, nunca después: traer la fila para
 * compararla ya sería haberla leído. Se resuelve con un `$in` sobre los ids de
 * práctica y no con un `JOIN` porque estas tablas no declaran relación en el
 * ORM —son columnas uuid sueltas— y una organización tiene prácticas de a
 * decenas; la lista cabe holgada en un `IN` y evita bajar a SQL crudo, que es
 * donde se pierde el tipado y con él la garantía de que el filtro sigue ahí.
 */
@Injectable()
export class ClaimReadRepository {
  /**
   * Página de solicitudes, por keyset descendente.
   *
   * Ordena por `(submitted_at DESC NULLS LAST, id DESC)`: lo más nuevo
   * primero, con el id desempatando para que dos solicitudes enviadas en el
   * mismo instante no se pisen ni se repitan entre páginas. El `NULLS LAST`
   * hay que pedirlo — PostgreSQL pone los nulos primero en un `DESC`, y
   * arrancar el listado por los borradores sin enviar es lo contrario de lo
   * que la pantalla quiere mostrar.
   *
   * Pide `limit + 1` filas: la de más no se devuelve, sólo dice si hay página
   * siguiente. Es más barato que un `COUNT(*)` y no miente cuando alguien
   * inserta entre dos páginas.
   *
   * @param em - Contexto de persistencia.
   * @param practiceIds - Prácticas activas de la organización activa.
   * @param filters - Filtros de la consulta.
   * @param limit - Tamaño de página.
   * @param cursor - Clave de continuación, si se está paginando.
   * @returns Las solicitudes de la página, más una de sondeo.
   */
  findClaimsPage(
    em: EntityManager,
    practiceIds: readonly string[],
    filters: ClaimListFilters,
    limit: number,
    cursor: ClaimCursor | null,
  ): Promise<InsuranceClaims[]> {
    if (practiceIds.length === 0) return Promise.resolve([]);

    const range: Record<string, Date> = {};
    if (filters.submittedFrom) range.$gte = filters.submittedFrom;
    if (filters.submittedTo) range.$lte = filters.submittedTo;

    const where: Record<string, unknown> = {
      billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
      billingProviderEntityId: { $in: [...practiceIds] },
    };
    // La aseguradora es un **filtro** del usuario, no el alcance: acota lo que
    // ya está acotado por las prácticas propias. Pedir una aseguradora ajena
    // devuelve vacío porque ninguna solicitud propia la referencia, no porque
    // se haya intersectado una lista.
    if (filters.insuranceCarrierId) {
      where.insuranceCarrierId = filters.insuranceCarrierId;
    }
    if (filters.statusConceptId) {
      where.statusConceptId = filters.statusConceptId;
    }
    if (Object.keys(range).length > 0) {
      where.submittedAt = range;
    }

    const continuation = this.keysetContinuation(cursor);
    if (continuation) {
      where.$and = [continuation];
    }

    return em.find(InsuranceClaims, where, {
      orderBy: [
        { submittedAt: QueryOrder.DESC_NULLS_LAST },
        { id: QueryOrder.DESC },
      ],
      limit: limit + 1,
    });
  }

  /**
   * Traduce el cursor a la condición que continúa el mismo orden.
   *
   * Con `submitted_at` nulo no hay `<` posible contra `NULL`, así que la cola
   * de no enviadas se continúa sólo por `id`; y estando ya en esa cola, no se
   * vuelve a las que sí tienen fecha.
   *
   * @param cursor - Clave de continuación, o `null` en la primera página.
   * @returns La condición, o `null` si no hay que continuar nada.
   */
  private keysetContinuation(
    cursor: ClaimCursor | null,
  ): Record<string, unknown> | null {
    if (!cursor) return null;
    if (cursor.submittedAt === null) {
      return { submittedAt: null, id: { $lt: cursor.id } };
    }
    const from = new Date(cursor.submittedAt);
    return {
      $or: [
        { submittedAt: { $lt: from } },
        { submittedAt: null },
        { submittedAt: from, id: { $lt: cursor.id } },
      ],
    };
  }

  /**
   * Una solicitud dentro del alcance del prestador activo.
   *
   * Devuelve `null` tanto si el uuid no existe como si la envió otra
   * organización: la respuesta tiene que ser indistinguible para que el código
   * de error no sirva de sonda (AC-16-14).
   *
   * @param em - Contexto de persistencia.
   * @param practiceIds - Prácticas activas de la organización activa.
   * @param id - Solicitud consultada.
   * @returns La solicitud, o `null`.
   */
  findClaimInScope(
    em: EntityManager,
    practiceIds: readonly string[],
    id: string,
  ): Promise<InsuranceClaims | null> {
    if (practiceIds.length === 0) return Promise.resolve(null);
    return em.findOne(InsuranceClaims, {
      id,
      billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
      billingProviderEntityId: { $in: [...practiceIds] },
    });
  }

  /** Aseguradoras por id, para nombrar la columna del listado. */
  findCarriersByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<InsuranceCarriers[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(InsuranceCarriers, { id: { $in: [...ids] } });
  }

  /** Coberturas por id, para llegar al paciente y a la póliza. */
  findCoveragesByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PatientCoverages[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PatientCoverages, { id: { $in: [...ids] } });
  }

  /** Ítems de las solicitudes dadas, en orden de secuencia. */
  findLinesByClaimIds(
    em: EntityManager,
    claimIds: readonly string[],
  ): Promise<InsuranceClaimLines[]> {
    if (claimIds.length === 0) return Promise.resolve([]);
    return em.find(
      InsuranceClaimLines,
      { insuranceClaimId: { $in: [...claimIds] } },
      { orderBy: { lineSequence: QueryOrder.ASC } },
    );
  }

  /**
   * Versiones de adjudicación de las solicitudes dadas, de la más nueva a la
   * más vieja.
   *
   * Se traen **todas** y no sólo la vigente: el detalle muestra el historial, y
   * pedir la última por solicitud con una subconsulta por fila es N+1 para
   * ahorrar unas pocas filas por reclamo.
   */
  findAdjudicationsByClaimIds(
    em: EntityManager,
    claimIds: readonly string[],
  ): Promise<ClaimAdjudicationVersions[]> {
    if (claimIds.length === 0) return Promise.resolve([]);
    return em.find(
      ClaimAdjudicationVersions,
      { insuranceClaimId: { $in: [...claimIds] } },
      { orderBy: { adjudicationVersion: QueryOrder.DESC } },
    );
  }

  /** Adjudicaciones de ítem de las versiones dadas. */
  findLineAdjudications(
    em: EntityManager,
    versionIds: readonly string[],
  ): Promise<ClaimLineAdjudications[]> {
    if (versionIds.length === 0) return Promise.resolve([]);
    return em.find(ClaimLineAdjudications, {
      claimAdjudicationVersionId: { $in: [...versionIds] },
    });
  }

  /** Disputas de las solicitudes dadas, de la más nueva a la más vieja. */
  findDisputesByClaimIds(
    em: EntityManager,
    claimIds: readonly string[],
  ): Promise<ClaimDisputes[]> {
    if (claimIds.length === 0) return Promise.resolve([]);
    return em.find(
      ClaimDisputes,
      { insuranceClaimId: { $in: [...claimIds] } },
      { orderBy: { createdAt: QueryOrder.DESC } },
    );
  }
}
