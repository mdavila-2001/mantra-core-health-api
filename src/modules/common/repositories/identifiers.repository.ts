import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Identifiers } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';
import {
  nationalIdIndexPredicateSql,
  normalizeNationalId,
  normalizedNationalIdSql,
} from '../../profiles/domain/national-id';

/** Datos mínimos para dar de alta un identificador oficial. */
export interface CreateIdentifierData {
  /**
   * Identificador asociado a owner type concept.
   */
  ownerTypeConceptId: string;
  /**
   * Identificador asociado a owner.
   */
  ownerId: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId: string;
  /**
   * Valor de system mantenido por la instancia.
   */
  system?: string;
  /**
   * Valor de value mantenido por la instancia.
   */
  value: string;
  /**
   * Razón social del titular. `em.create` sólo escribe lo que este objeto
   * nombra, así que omitirlo acá dejaría la columna en `NULL` sin fallar.
   */
  holderName?: string;
  /**
   * Identificador asociado a use concept.
   */
  useConceptId?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Departamento emisor (miembro de `VS_BO_DEPARTMENT`). Sólo aplica a
   * documentos bolivianos; el resto de tipos de identificador lo dejan vacío.
   */
  issuerAdministrativeAreaConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.identifiers`.
 *
 * Repositorio sin estado: cada método recibe el `EntityManager` activo para que
 * el servicio controle la transacción y varias operaciones compartan el mismo
 * `flush`. No contiene reglas de negocio, solo consultas y materialización.
 */
@Injectable()
export class IdentifiersRepository {
  /**
   * Busca un identificador ACTIVO que colisione en (tipo, sistema, valor). Se usa
   * para imponer la unicidad lógica antes de crear uno nuevo.
   */
  findActiveDuplicate(
    em: EntityManager,
    params: {
      /**
       * Identificador asociado a type concept.
       */
      typeConceptId: string; /**
       * Valor de system mantenido por la instancia.
       */
      system?: string; /**
       * Valor de value mantenido por la instancia.
       */
      value: string;
    },
  ): Promise<Identifiers | null> {
    return em.findOne(Identifiers, {
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      typeConceptId: params.typeConceptId,
      system: params.system ?? null,
      value: params.value,
    });
  }

  /**
   * Busca el documento nacional ACTIVO de un paciente que ya tiene este número,
   * comparado en su forma canónica (mayúsculas, sin puntos, guiones ni espacios y
   * sin ceros de relleno): «1.234.567», «01234567» y «1234567 » son el mismo
   * documento aunque se hayan guardado distinto.
   *
   * La consulta repite la expresión Y los cuatro predicados del índice único
   * parcial `common.uq_identifiers_national_id_normalized` (tipo nacional,
   * activo, dueño paciente, sin cierre): solo así Postgres la resuelve con el
   * índice y no con un recorrido de la tabla. Los ids van como literales para que
   * un plan genérico también pruebe que el predicado se cumple. Un documento de
   * otro dueño (representantes, organizaciones) no cuenta, igual que en el índice.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param nationalId - Documento tal como llegó; se normaliza aquí.
   * @returns El identificador y su dueño, o `null` si el documento está libre.
   */
  async findActiveNationalIdDuplicate(
    em: EntityManager,
    nationalId: string,
  ): Promise<{ id: string; ownerId: string } | null> {
    const rows = await em.getConnection().execute<
      {
        id: string;
        owner_id: string;
      }[]
    >(
      `select i.id, i.owner_id
         from common.identifiers i
        where ${normalizedNationalIdSql('i.value')} = ?
          and ${nationalIdIndexPredicateSql('i')}
        limit 1`,
      [normalizeNationalId(nationalId)],
    );
    const row = rows[0];
    return row ? { id: row.id, ownerId: row.owner_id } : null;
  }

  /**
   * Los identificadores de un conjunto de ids, por id.
   *
   * Lectura en lote: la ficha de una organización nombra hasta cuatro personas
   * y pedir sus documentos de a uno sería N+1 sobre la tabla que ya resuelve
   * el login.
   *
   * @param em - Contexto de persistencia.
   * @param ids - Los identificadores a traer; lista vacía devuelve un mapa vacío.
   * @returns Mapa `id -> identificador` con los que existan.
   */
  async findByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, Identifiers>> {
    if (ids.length === 0) return new Map();
    const rows = await em.find(Identifiers, { id: { $in: [...ids] } });
    return new Map(rows.map((row) => [row.id, row]));
  }

  /**
   * Los identificadores vigentes (`valid_to IS NULL`) de un dueño.
   *
   * Mismo `em.find` que ya hacía `ProfilesPatientsService.leerIdentificadores`
   * inline — se sube al repositorio porque el PDF oficial de receta
   * (`clinical`, subtarea B.3) también lo necesita, para el documento de
   * identidad y su departamento emisor. Sin filtrar por tipo: quien llama
   * ya sabe qué `typeConceptId` busca entre los resultados (documento,
   * identificador fiscal…), igual que hacía el código original.
   *
   * @param em - Contexto de persistencia.
   * @param ownerId - El dueño de los identificadores (persona o tenant).
   * @returns Sus identificadores vigentes, sin orden garantizado.
   */
  findCurrentByOwner(
    em: EntityManager,
    ownerId: string,
  ): Promise<Identifiers[]> {
    return em.find(Identifiers, { ownerId, validTo: null });
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateIdentifierData): Identifiers {
    return em.create(
      Identifiers,
      {
        ownerTypeConceptId: data.ownerTypeConceptId,
        ownerId: data.ownerId,
        typeConceptId: data.typeConceptId,
        system: data.system,
        value: data.value,
        holderName: data.holderName,
        useConceptId: data.useConceptId,
        stateConceptId: data.stateConceptId,
        issuerAdministrativeAreaConceptId:
          data.issuerAdministrativeAreaConceptId,
        ...createdBy(data.actorUserId),
        // `partial: true` relaja el tipado estricto de `em.create`: la columna
        // `row_version` (version: true) tiene DEFAULT en BD y MikroORM la gestiona,
        // pero su tipo la marcaría como requerida. No altera el comportamiento.
      },
      { partial: true },
    );
  }
}
