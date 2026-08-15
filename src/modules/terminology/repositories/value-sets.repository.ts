import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ValueSets,
  ValueSetVersions,
  ValueSetRules,
  ValueSetMembers,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar un conjunto de valores. */
export interface CreateValueSetData {
  /**
   * Valor de internal code mantenido por la instancia.
   */
  internalCode?: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de canonical url mantenido por la instancia.
   */
  canonicalUrl: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos mínimos para materializar una versión de conjunto de valores. */
export interface CreateValueSetVersionData {
  /**
   * Identificador asociado a value set.
   */
  valueSetId: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: string;
  /**
   * Valor de is default mantenido por la instancia.
   */
  isDefault?: boolean;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos mínimos para materializar una regla de conjunto de valores. */
export interface CreateValueSetRuleData {
  /**
   * Identificador asociado a value set version.
   */
  valueSetVersionId: string;
  /**
   * Identificador asociado a code system.
   */
  codeSystemId: string;
  /**
   * Identificador asociado a operator concept.
   */
  operatorConceptId?: string;
  /**
   * Valor de property mantenido por la instancia.
   */
  property?: string;
  /**
   * Valor de value mantenido por la instancia.
   */
  value?: string;
  /**
   * Valor de included mantenido por la instancia.
   */
  included: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.value_sets` y sus tablas hijas (versiones y
 * reglas). Los tres niveles se crean en la misma operación de negocio
 * (ValueSetsService.create), por lo que comparten repositorio. Métodos sin estado
 * que reciben el `EntityManager` activo.
 */
@Injectable()
export class ValueSetsRepository {
  /** Busca un conjunto de valores por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<ValueSets | null> {
    return em.findOne(ValueSets, { id });
  }

  /** Busca un conjunto de valores por su código interno; `null` si no existe. */
  findByInternalCode(
    em: EntityManager,
    internalCode: string,
  ): Promise<ValueSets | null> {
    return em.findOne(ValueSets, { internalCode });
  }

  /**
   * Una página del listado de conjuntos de valores, por cursor keyset sobre
   * `internal_code`.
   *
   * El orden es por código interno y no por `created_at` porque el código es
   * único y estable: paginar por fecha repetiría o saltaría filas cuando dos
   * conjuntos comparten instante de creación, que es justo lo que pasa cuando los
   * siembra la misma corrida.
   *
   * @param em - Contexto de persistencia.
   * @param filters - Código exacto, texto libre y cursor.
   * @param limit - Tope de filas a devolver.
   * @returns Conjuntos ordenados por código interno ascendente.
   */
  searchPage(
    em: EntityManager,
    filters: {
      /** Código interno exacto. */
      internalCode?: string;
      /** Texto libre sobre código interno y nombre. */
      query?: string;
      /** Último código interno de la página anterior. */
      afterInternalCode?: string;
    },
    limit: number,
  ): Promise<ValueSets[]> {
    const where: Record<string, unknown> = {};

    if (filters.internalCode !== undefined) {
      where.internalCode = filters.internalCode;
    }
    if (filters.afterInternalCode !== undefined) {
      // Se combina con el filtro exacto en vez de sustituirlo: pedir un código
      // concreto y además pasar cursor debe dar cero filas, no todas.
      where.internalCode =
        filters.internalCode !== undefined
          ? { $eq: filters.internalCode, $gt: filters.afterInternalCode }
          : { $gt: filters.afterInternalCode };
    }
    if (filters.query) {
      const pattern = `%${filters.query}%`;
      where.$or = [
        { internalCode: { $ilike: pattern } },
        { name: { $ilike: pattern } },
      ];
    }

    return em.find(ValueSets, where, {
      orderBy: { internalCode: 'ASC' },
      limit,
    });
  }

  /**
   * Versiones por defecto de varios conjuntos, en una sola consulta.
   *
   * El listado necesita la versión vigente de cada fila para que el cliente pueda
   * expandirla sin una segunda vuelta; pedirlas de una en una sería un N+1.
   */
  async findDefaultVersionsByValueSetIds(
    em: EntityManager,
    valueSetIds: string[],
  ): Promise<Map<string, ValueSetVersions>> {
    if (valueSetIds.length === 0) return new Map();
    const rows = await em.find(ValueSetVersions, {
      valueSetId: { $in: valueSetIds },
      isDefault: true,
    });
    return new Map(rows.map((row) => [row.valueSetId, row]));
  }

  /**
   * Cuántos conceptos incluye cada versión, en una sola consulta.
   *
   * El listado de conjuntos lo necesita para poder mostrar el conteo junto a
   * cada categoría. Un `em.count` por conjunto serían tantas consultas como
   * filas tenga la página —hoy, medio centenar— en el camino de la pantalla que
   * más se abre del glosario.
   *
   * Se traen sólo los identificadores de versión y se agrupan acá en vez de
   * pedirle un `GROUP BY` a la base. Es una consulta igual, y a cambio se queda
   * dentro del `em.find` tipado que usa el resto del repositorio. El coste es
   * traer una fila por miembro en vez de una por versión: con el catálogo actual
   * son un par de centenares de uuid, despreciable. **Si algún día un conjunto
   * de valores tiene decenas de miles de miembros, esto se cambia por un
   * `GROUP BY`** — el lugar es este método y no hay otro llamador.
   *
   * @param em - Contexto de persistencia.
   * @param valueSetVersionIds - Versiones cuyos miembros se cuentan.
   * @returns Mapa `valueSetVersionId -> cantidad`; una versión sin miembros
   *   incluidos no aparece.
   */
  async countMembersByVersionIds(
    em: EntityManager,
    valueSetVersionIds: string[],
  ): Promise<Map<string, number>> {
    if (valueSetVersionIds.length === 0) return new Map();
    const rows = await em.find(
      ValueSetMembers,
      { valueSetVersionId: { $in: valueSetVersionIds }, included: true },
      { fields: ['valueSetVersionId'] },
    );

    const conteo = new Map<string, number>();
    for (const row of rows) {
      conteo.set(
        row.valueSetVersionId,
        (conteo.get(row.valueSetVersionId) ?? 0) + 1,
      );
    }
    return conteo;
  }

  /**
   * A qué conjuntos de valores pertenece cada concepto — el camino inverso al de
   * `$expand`.
   *
   * ## Por qué existe
   *
   * `$expand` va de conjunto a conceptos, y no había nada que fuera al revés. Un
   * glosario que quiera mostrar bajo qué categorías cae un término tenía como
   * única salida expandir los conjuntos **todos** y armarse el índice inverso en
   * el navegador: con un catálogo real, cientos de llamadas y una pantalla que
   * tarda. Esto lo resuelve en tres consultas, sean uno o cincuenta conceptos.
   *
   * ## Sólo la versión vigente
   *
   * Se filtra por la versión marcada por defecto de cada conjunto. Sin ese
   * filtro, un término aparecería etiquetado con categorías de las que ya salió
   * —porque una versión anterior lo incluía— y no habría forma de distinguir eso
   * de la pertenencia actual.
   *
   * @param em - Contexto de persistencia.
   * @param conceptIds - Conceptos cuya pertenencia se resuelve.
   * @returns Mapa `conceptId -> conjuntos`, ordenados por código interno; un
   *   concepto que no está en ninguno no aparece.
   */
  async findValueSetsByConceptIds(
    em: EntityManager,
    conceptIds: string[],
  ): Promise<Map<string, ValueSets[]>> {
    if (conceptIds.length === 0) return new Map();

    const members = await em.find(ValueSetMembers, {
      conceptId: { $in: conceptIds },
      included: true,
    });
    if (members.length === 0) return new Map();

    const versions = await em.find(ValueSetVersions, {
      id: { $in: [...new Set(members.map((row) => row.valueSetVersionId))] },
      isDefault: true,
    });
    if (versions.length === 0) return new Map();

    const valueSetIdPorVersion = new Map(
      versions.map((version) => [version.id, version.valueSetId]),
    );
    const valueSets = await em.find(
      ValueSets,
      { id: { $in: [...new Set(versions.map((v) => v.valueSetId))] } },
      { orderBy: { internalCode: 'ASC' } },
    );
    const valueSetPorId = new Map(valueSets.map((row) => [row.id, row]));

    const porConcepto = new Map<string, ValueSets[]>();
    for (const member of members) {
      const valueSetId = valueSetIdPorVersion.get(member.valueSetVersionId);
      if (valueSetId === undefined) continue;
      const valueSet = valueSetPorId.get(valueSetId);
      if (valueSet === undefined) continue;

      const acumulado = porConcepto.get(member.conceptId);
      if (acumulado === undefined) {
        porConcepto.set(member.conceptId, [valueSet]);
      } else if (!acumulado.includes(valueSet)) {
        acumulado.push(valueSet);
      }
    }

    // El orden de `members` es el de la tabla, no el del catálogo: sin esto, las
    // etiquetas de un término saldrían en un orden distinto en cada consulta y
    // la pantalla parecería inestable sin haber cambiado nada.
    for (const lista of porConcepto.values()) {
      lista.sort((a, b) => a.internalCode.localeCompare(b.internalCode));
    }
    return porConcepto;
  }

  /**
   * Los conceptos que incluye la versión vigente de un conjunto de valores.
   *
   * Es lo que necesita **filtrar la búsqueda por categoría**: sin esto, la única
   * forma de ver los términos de «Diagnóstico» era `$expand`, que devuelve los
   * miembros crudos —sin traducir y sin sus otras etiquetas— y pagina por su
   * cuenta. Con esto, navegar por etiqueta y buscar por texto son la misma
   * lectura, y por lo tanto se ven igual.
   *
   * Devuelve `null`, y no una lista vacía, cuando el conjunto no existe o no
   * tiene versión vigente: son casos distintos de «existe y no tiene miembros»,
   * y el llamador tiene que poder responder 404 en vez de «no hay términos».
   *
   * @param em - Contexto de persistencia.
   * @param valueSetId - Conjunto cuya expansión vigente se lee.
   * @returns Los ids de concepto incluidos, o `null` si no hay versión vigente.
   */
  async findIncludedConceptIdsByValueSet(
    em: EntityManager,
    valueSetId: string,
  ): Promise<string[] | null> {
    const version = await this.findDefaultVersion(em, valueSetId);
    if (version === null) return null;

    const members = await em.find(
      ValueSetMembers,
      { valueSetVersionId: version.id, included: true },
      { fields: ['conceptId'], orderBy: [{ ordinal: 'ASC' }] },
    );
    return members.map((member) => member.conceptId);
  }

  /** Crea el conjunto de valores en la unidad de trabajo (sin flush). */
  createValueSet(em: EntityManager, data: CreateValueSetData): ValueSets {
    return em.create(
      ValueSets,
      {
        internalCode: data.internalCode,
        name: data.name,
        canonicalUrl: data.canonicalUrl,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea la versión del conjunto de valores en la unidad de trabajo (sin flush). */
  createVersion(
    em: EntityManager,
    data: CreateValueSetVersionData,
  ): ValueSetVersions {
    return em.create(
      ValueSetVersions,
      {
        valueSetId: data.valueSetId,
        version: data.version,
        isDefault: data.isDefault,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea una regla del conjunto de valores en la unidad de trabajo (sin flush). */
  createRule(em: EntityManager, data: CreateValueSetRuleData): ValueSetRules {
    return em.create(
      ValueSetRules,
      {
        valueSetVersionId: data.valueSetVersionId,
        codeSystemId: data.codeSystemId,
        operatorConceptId: data.operatorConceptId,
        property: data.property,
        value: data.value,
        included: data.included,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Expansión (UC-03-08) ---

  /**
   * Versión del conjunto de valores bloqueada. Expandir borra los miembros previos
   * y reinserta: dos expansiones simultáneas de la misma versión dejarían una
   * mezcla de ambas.
   */
  findVersionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ValueSetVersions | null> {
    return em.findOne(
      ValueSetVersions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Versiones del conjunto marcadas por defecto, bloqueadas. Sólo una puede serlo,
   * así que promover una exige degradar la anterior sin que otra expansión
   * simultánea la reponga.
   */
  findDefaultVersionsForUpdate(
    em: EntityManager,
    valueSetId: string,
  ): Promise<ValueSetVersions[]> {
    return em.find(
      ValueSetVersions,
      { valueSetId, isDefault: true },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Reglas de la versión; son las que se evalúan contra los conceptos. */
  findRulesByVersion(
    em: EntityManager,
    valueSetVersionId: string,
  ): Promise<ValueSetRules[]> {
    return em.find(ValueSetRules, { valueSetVersionId });
  }

  /**
   * Borra los miembros de la versión antes de reexpandir. La expansión es un
   * reemplazo, no una acumulación: conservar los anteriores dejaría dentro
   * conceptos que las reglas ya no seleccionan.
   */
  deleteMembersByVersion(
    em: EntityManager,
    valueSetVersionId: string,
  ): Promise<number> {
    return em.nativeDelete(ValueSetMembers, { valueSetVersionId });
  }

  /** Crea un miembro de la expansión en la unidad de trabajo (sin flush). */
  createMember(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a value set version.
       */
      valueSetVersionId: string;
      /**
       * Identificador asociado a concept.
       */
      conceptId: string;
      /**
       * Valor de included mantenido por la instancia.
       */
      included: boolean;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ValueSetMembers {
    return em.create(
      ValueSetMembers,
      {
        valueSetVersionId: data.valueSetVersionId,
        conceptId: data.conceptId,
        included: data.included,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Miembros que referencian un concepto, bloqueados. Retirar el concepto los
   * excluye de sus expansiones (UC-03-10): dejarlos dentro haría que un conjunto
   * de valores siguiera ofreciendo un código retirado.
   */
  findMembersByConceptForUpdate(
    em: EntityManager,
    conceptId: string,
  ): Promise<ValueSetMembers[]> {
    return em.find(
      ValueSetMembers,
      { conceptId, included: true },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Lectura de la expansión (UC-03-08, cara de consulta) ---

  /** Versión marcada por defecto del conjunto; `null` si todavía no hay ninguna. */
  findDefaultVersion(
    em: EntityManager,
    valueSetId: string,
  ): Promise<ValueSetVersions | null> {
    return em.findOne(ValueSetVersions, { valueSetId, isDefault: true });
  }

  /** Versión concreta por id; `null` si no existe. */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<ValueSetVersions | null> {
    return em.findOne(ValueSetVersions, { id });
  }

  /**
   * Una página de miembros incluidos de una versión, por cursor keyset.
   *
   * El orden es `(ordinal, concept_id)`, y el desempate por `concept_id` no es
   * decorativo: `ordinal` no es único —dos miembros pueden compartirlo si una
   * expansión previa quedó a medias— y sin desempate determinista dos páginas
   * consecutivas podrían repetir u omitir filas. El índice único
   * `uq_value_set_members_version_concept` garantiza que el par sí es total
   * dentro de la versión.
   *
   * `ordinal` es nullable en el esquema, así que la comparación se parte en dos
   * casos. Postgres ordena los `NULL` al final en `ASC`, y `ordinal > :n` es
   * `NULL` (falso) para una fila sin ordinal: sin el `$or` explícito, esas filas
   * quedarían fuera de toda página posterior a la primera.
   *
   * @param em - Contexto de persistencia.
   * @param valueSetVersionId - Versión cuya expansión se lee.
   * @param after - Última fila de la página anterior, o `undefined` en la primera.
   * @param limit - Tope de filas a devolver.
   * @returns Miembros incluidos, ordenados por `(ordinal, concept_id)`.
   */
  findMembersPage(
    em: EntityManager,
    valueSetVersionId: string,
    after: { ordinal: number | null; conceptId: string } | undefined,
    limit: number,
  ): Promise<ValueSetMembers[]> {
    const where: Record<string, unknown> = {
      valueSetVersionId,
      included: true,
    };

    if (after) {
      where.$or =
        after.ordinal === null
          ? // Ya estamos en la cola de los `NULL`: sólo quedan sus hermanos.
            [{ ordinal: null, conceptId: { $gt: after.conceptId } }]
          : [
              { ordinal: { $gt: after.ordinal } },
              { ordinal: after.ordinal, conceptId: { $gt: after.conceptId } },
              // Los `NULL` van después de cualquier ordinal, nunca antes.
              { ordinal: null },
            ];
    }

    return em.find(ValueSetMembers, where, {
      orderBy: [{ ordinal: 'ASC' }, { conceptId: 'ASC' }],
      limit,
    });
  }
}
