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
 * **El aislamiento se resuelve en la raíz**, igual que en
 * `InsuranceReadRepository`: la solicitud no tiene `tenant_id` propio —cuelga
 * de la aseguradora, que sí lo tiene—, así que toda entrada arranca por las
 * aseguradoras del tenant y filtra por ellas **dentro de la consulta**. Traer
 * la fila para compararla después ya sería haberla leído.
 *
 * El alcance se resuelve con un `$in` sobre los ids de aseguradora y no con un
 * `JOIN`: estas tablas no tienen relación declarada en el ORM —son columnas
 * uuid sueltas—, y un tenant tiene aseguradoras de a decenas, no de a miles.
 * La lista cabe holgada en un `IN` y evita bajar a SQL crudo, que es donde se
 * pierde el tipado y con él la garantía de que el filtro de tenant sigue ahí.
 */
@Injectable()
export class ClaimReadRepository {
  /**
   * Ids de las aseguradoras del tenant activo.
   *
   * Es la raíz del alcance: si viene vacía, el tenant no tiene ninguna y el
   * listado es vacío por construcción, sin llegar a consultar solicitudes.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Tenant activo.
   * @returns Los ids de aseguradora del tenant.
   */
  async findCarrierIdsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<string[]> {
    const carriers = await em.find(
      InsuranceCarriers,
      { tenantId },
      { fields: ['id'] },
    );
    return carriers.map((carrier) => carrier.id);
  }

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
   * @param carrierIds - Aseguradoras del tenant activo.
   * @param filters - Filtros de la consulta.
   * @param limit - Tamaño de página.
   * @param cursor - Clave de continuación, si se está paginando.
   * @returns Las solicitudes de la página, más una de sondeo.
   */
  findClaimsPage(
    em: EntityManager,
    carrierIds: readonly string[],
    filters: ClaimListFilters,
    limit: number,
    cursor: ClaimCursor | null,
  ): Promise<InsuranceClaims[]> {
    if (carrierIds.length === 0) return Promise.resolve([]);

    // El filtro por aseguradora del usuario se intersecta con el alcance del
    // tenant, nunca lo reemplaza: pedir una aseguradora ajena no puede ampliar
    // lo que se ve, tiene que devolver vacío.
    const alcance = filters.insuranceCarrierId
      ? carrierIds.filter((id) => id === filters.insuranceCarrierId)
      : [...carrierIds];
    if (alcance.length === 0) return Promise.resolve([]);

    const rango: Record<string, Date> = {};
    if (filters.submittedFrom) rango.$gte = filters.submittedFrom;
    if (filters.submittedTo) rango.$lte = filters.submittedTo;

    const where: Record<string, unknown> = {
      insuranceCarrierId: { $in: alcance },
    };
    if (filters.statusConceptId) {
      where.statusConceptId = filters.statusConceptId;
    }
    if (Object.keys(rango).length > 0) {
      where.submittedAt = rango;
    }

    const continuacion = this.claveDeContinuacion(cursor);
    if (continuacion) {
      where.$and = [continuacion];
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
  private claveDeContinuacion(
    cursor: ClaimCursor | null,
  ): Record<string, unknown> | null {
    if (!cursor) return null;
    if (cursor.submittedAt === null) {
      return { submittedAt: null, id: { $lt: cursor.id } };
    }
    const desde = new Date(cursor.submittedAt);
    return {
      $or: [
        { submittedAt: { $lt: desde } },
        { submittedAt: null },
        { submittedAt: desde, id: { $lt: cursor.id } },
      ],
    };
  }

  /**
   * Una solicitud dentro del alcance del tenant activo.
   *
   * Devuelve `null` tanto si el uuid no existe como si pertenece a otra
   * organización: la respuesta tiene que ser indistinguible para que el código
   * de error no sirva de sonda (AC-16-14).
   *
   * @param em - Contexto de persistencia.
   * @param carrierIds - Aseguradoras del tenant activo.
   * @param id - Solicitud consultada.
   * @returns La solicitud, o `null`.
   */
  findClaimInScope(
    em: EntityManager,
    carrierIds: readonly string[],
    id: string,
  ): Promise<InsuranceClaims | null> {
    if (carrierIds.length === 0) return Promise.resolve(null);
    return em.findOne(InsuranceClaims, {
      id,
      insuranceCarrierId: { $in: [...carrierIds] },
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
