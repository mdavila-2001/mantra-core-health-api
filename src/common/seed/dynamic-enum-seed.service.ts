import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';
import {
  ValueSetMembers,
  ValueSetVersions,
  ValueSets,
} from '../../modules/terminology/entities';
import {
  DynamicEnumBindings,
  DynamicEnumDefinitions,
  DynamicEnumOptions,
  DynamicEnumVersions,
} from '../../modules/system_context/entities';
import { CONCEPTS } from '../constants/concepts';
import {
  CONCEPT_INDEX_BY_ID,
  DYNAMIC_ENUM_CATALOG,
  enumBindingId,
  enumDefinitionId,
  enumOptionId,
  enumVersionId,
  splitTarget,
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
  type DynamicEnumCatalogEntry,
} from './dynamic-enum-catalog';

/** Versión única de los conjuntos de valores sembrados. */
const SEEDED_VALUE_SET_VERSION = '1.0.0';

/** Número de versión de las definiciones sembradas. */
const SEEDED_ENUM_VERSION_NUMBER = 1;

/** Versión del esquema de opciones que publica el seed. */
const SEEDED_ENUM_SCHEMA_VERSION = '1.0.0';

/**
 * Materializa las enumeraciones bien conocidas declaradas en
 * `DYNAMIC_ENUM_CATALOG`: el conjunto de valores de terminología, su expansión, la
 * definición de enumeración dinámica con su versión publicada y sus opciones, y el
 * amarre de cada campo `esquema.tabla.columna` a esa definición.
 *
 * ## Por qué existe
 *
 * Sin estas filas, un formulario no puede ofrecer ningún campo `*_concept_id`: sabe
 * que el campo se llena desde terminología pero no de qué conjunto, y el único
 * `GET` disponible exigía un uuid que nadie publicaba. Con ellas, el cliente pide
 * las opciones por la ruta del campo y no necesita conocer identificador alguno.
 *
 * ## Idempotencia
 *
 * Todo identificador es determinista (UUIDv5 sobre una clave estable), así que el
 * seed compara por id e inserta sólo lo que falta. Arranques repetidos convergen.
 * Lo que ya existe **no se pisa**: si un administrador editó una opción por API,
 * el arranque siguiente no le deshace el cambio.
 *
 * ## Orden de inserción
 *
 * Las FK del modelo son columnas `uuid` planas, no relaciones del ORM: MikroORM no
 * deduce el orden. Se flushea por niveles, igual que `TerminologySeedService`.
 */
@Injectable()
export class DynamicEnumSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DynamicEnumSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración puedan
   * garantizar el catálogo tras materializar el esquema.
   *
   * @returns Cuántas filas se insertaron, por nivel.
   */
  async run(): Promise<{
    /** Conjuntos de valores creados. */
    valueSets: number;
    /** Definiciones de enumeración creadas. */
    definitions: number;
    /** Opciones publicadas creadas. */
    options: number;
    /** Amarres campo -> enumeración creados. */
    bindings: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    const counters = { valueSets: 0, definitions: 0, options: 0, bindings: 0 };

    // Se resuelve el catálogo entero antes de tocar la base: una entrada mal
    // escrita debe romper el arranque en seco, no dejar media enumeración
    // sembrada que luego nadie sabría distinguir de una completa.
    const entries = DYNAMIC_ENUM_CATALOG.map((entry) => this.resolve(entry));

    const codes = entries.map((entry) => entry.code);

    // --- Nivel 1: conjuntos de valores ---
    const existingValueSets = await this.existingIds(
      em,
      ValueSets,
      codes.map(valueSetId),
    );
    for (const entry of entries) {
      const id = valueSetId(entry.code);
      if (existingValueSets.has(id)) continue;
      em.create(
        ValueSets,
        {
          id,
          internalCode: entry.code,
          name: entry.name,
          canonicalUrl: valueSetCanonicalUrl(entry.code),
          description: entry.description,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
    }
    await em.flush();

    // --- Nivel 2: versión del conjunto de valores ---
    const existingValueSetVersions = await this.existingIds(
      em,
      ValueSetVersions,
      codes.map(valueSetVersionId),
    );
    for (const entry of entries) {
      const id = valueSetVersionId(entry.code);
      if (existingValueSetVersions.has(id)) continue;
      em.create(
        ValueSetVersions,
        {
          id,
          valueSetId: valueSetId(entry.code),
          version: SEEDED_VALUE_SET_VERSION,
          validFrom: now,
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
    }
    await em.flush();

    // --- Nivel 3: miembros de la expansión ---
    const memberIds = entries.flatMap((entry) =>
      entry.options.map((option) =>
        valueSetMemberId(entry.code, option.conceptId),
      ),
    );
    const existingMembers = await this.existingIds(
      em,
      ValueSetMembers,
      memberIds,
    );
    for (const entry of entries) {
      entry.options.forEach((option, ordinal) => {
        const id = valueSetMemberId(entry.code, option.conceptId);
        if (existingMembers.has(id)) return;
        em.create(
          ValueSetMembers,
          {
            id,
            valueSetVersionId: valueSetVersionId(entry.code),
            conceptId: option.conceptId,
            included: true,
            ordinal,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
      });
    }
    await em.flush();

    // --- Nivel 4: definiciones de enumeración dinámica ---
    const existingDefinitions = await this.existingIds(
      em,
      DynamicEnumDefinitions,
      codes.map(enumDefinitionId),
    );
    for (const entry of entries) {
      const id = enumDefinitionId(entry.code);
      if (existingDefinitions.has(id)) continue;
      em.create(
        DynamicEnumDefinitions,
        {
          id,
          code: entry.code,
          name: entry.name,
          description: entry.description,
          valueSetId: valueSetId(entry.code),
          // Global: son vocabularios de plataforma, iguales para todo tenant. Una
          // enumeración por tenant se declararía con `ENUM_SCOPE_TENANT` y su
          // `tenant_id`, y este seed no crea ninguna.
          scopeTypeConceptId: CONCEPTS.ENUM_SCOPE_GLOBAL,
          selectionModeConceptId: CONCEPTS.ENUM_SELECTION_SINGLE,
          allowTenantExtension: false,
          allowCustomValue: false,
          statusConceptId: CONCEPTS.ENUM_DEF_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.definitions += 1;
    }
    await em.flush();

    // --- Nivel 5: versión publicada de cada definición ---
    const existingEnumVersions = await this.existingIds(
      em,
      DynamicEnumVersions,
      codes.map(enumVersionId),
    );
    for (const entry of entries) {
      const id = enumVersionId(entry.code);
      if (existingEnumVersions.has(id)) continue;
      em.create(
        DynamicEnumVersions,
        {
          id,
          dynamicEnumDefinitionId: enumDefinitionId(entry.code),
          versionNumber: SEEDED_ENUM_VERSION_NUMBER,
          valueSetVersionId: valueSetVersionId(entry.code),
          schemaVersion: SEEDED_ENUM_SCHEMA_VERSION,
          cacheToken: entry.cacheToken,
          effectiveFrom: now,
          statusConceptId: CONCEPTS.ENUM_VERSION_PUBLISHED,
          recordedAt: now,
        },
        { partial: true },
      );
    }
    await em.flush();

    // --- Nivel 6: opciones de la versión publicada ---
    const optionIds = entries.flatMap((entry) =>
      entry.options.map((option) => enumOptionId(entry.code, option.conceptId)),
    );
    const existingOptions = await this.existingIds(
      em,
      DynamicEnumOptions,
      optionIds,
    );
    for (const entry of entries) {
      entry.options.forEach((option, ordinal) => {
        const id = enumOptionId(entry.code, option.conceptId);
        if (existingOptions.has(id)) return;
        em.create(
          DynamicEnumOptions,
          {
            id,
            dynamicEnumVersionId: enumVersionId(entry.code),
            conceptId: option.conceptId,
            code: option.code,
            display: option.display,
            ordinal,
            isDefault: option.conceptId === entry.defaultConceptId,
            enabled: true,
            recordedAt: now,
          },
          { partial: true },
        );
        counters.options += 1;
      });
    }
    await em.flush();

    // --- Nivel 7: amarre campo -> enumeración ---
    const bindingIds = entries.flatMap((entry) =>
      entry.targets.map((target) => enumBindingId(entry.code, target)),
    );
    const existingBindings = await this.existingIds(
      em,
      DynamicEnumBindings,
      bindingIds,
    );
    for (const entry of entries) {
      for (const target of entry.targets) {
        const id = enumBindingId(entry.code, target);
        if (existingBindings.has(id)) continue;
        const { schemaName, entityName, fieldName } = splitTarget(target);
        em.create(
          DynamicEnumBindings,
          {
            id,
            dynamicEnumDefinitionId: enumDefinitionId(entry.code),
            targetSchemaName: schemaName,
            targetEntityName: entityName,
            targetFieldName: fieldName,
            // El seed no declara obligatoriedad: si la columna es NOT NULL ya lo
            // dice el esquema, y marcarlo aquí duplicaría la verdad en dos sitios
            // que pueden divergir.
            required: false,
            fallbackConceptId: entry.defaultConceptId,
            validationModeConceptId: CONCEPTS.VALIDATION_MODE_STRICT,
            statusConceptId: CONCEPTS.ENUM_BINDING_ACTIVE,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        counters.bindings += 1;
      }
    }
    await em.flush();

    this.logger.info(
      { operation: 'seed.dynamic-enums', ...counters },
      'Enumeraciones dinámicas sembradas',
    );
    return counters;
  }

  /**
   * Resuelve una entrada del catálogo: comprueba que cada concepto existe en el
   * catálogo sembrado y le adjunta su código y rótulo.
   *
   * Falla ruidosamente si un concepto no está declarado. La alternativa —saltarlo—
   * produciría un selector con una opción de menos y nadie lo notaría hasta que un
   * usuario buscara el valor que falta.
   */
  private resolve(entry: DynamicEnumCatalogEntry): {
    /** Código estable de la enumeración. */
    code: string;
    /** Nombre legible. */
    name: string;
    /** Descripción de qué gobierna. */
    description: string;
    /** Opciones resueltas contra el catálogo de conceptos. */
    options: {
      /** Concepto que respalda la opción. */
      conceptId: string;
      /** Código FHIR del concepto. */
      code: string;
      /** Rótulo legible. */
      display: string;
    }[];
    /** Concepto preseleccionado, si lo hay. */
    defaultConceptId?: string;
    /** Campos gobernados. */
    targets: readonly string[];
    /** Testigo de caché derivado de la composición. */
    cacheToken: string;
  } {
    if (entry.concepts.length === 0) {
      throw new Error(
        `La enumeración "${entry.code}" no declara ningún concepto: sería un selector vacío.`,
      );
    }

    const options = entry.concepts.map((conceptId) => {
      const concept = CONCEPT_INDEX_BY_ID.get(conceptId);
      if (!concept) {
        throw new Error(
          `La enumeración "${entry.code}" referencia un concepto que no está en el catálogo sembrado: ${conceptId}`,
        );
      }
      return { conceptId, code: concept.code, display: concept.display };
    });

    if (
      entry.defaultConceptId &&
      !entry.concepts.includes(entry.defaultConceptId)
    ) {
      throw new Error(
        `El valor por defecto de "${entry.code}" no pertenece a la propia enumeración.`,
      );
    }

    // Los destinos se validan aunque el seed no los use hasta el nivel 7: un
    // destino mal formado debe romper antes de insertar nada.
    entry.targets.forEach(splitTarget);

    return {
      code: entry.code,
      name: entry.name,
      description: entry.description,
      options,
      defaultConceptId: entry.defaultConceptId,
      targets: entry.targets,
      // El testigo depende de la composición, de modo que cambiar la lista de
      // conceptos invalida la caché del cliente sin coordinación adicional.
      cacheToken: createHash('sha1')
        .update(entry.code)
        .update(' ')
        .update(entry.concepts.join(','))
        .digest('hex')
        .slice(0, 16),
    };
  }

  /**
   * Identificadores ya presentes, en una sola consulta por nivel.
   *
   * Evita el N+1 de comprobar fila a fila: el catálogo tiene decenas de entradas
   * y varias opciones cada una, y esto corre en cada arranque de la aplicación.
   */
  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await em.find(
      entity,
      { id: { $in: ids } },
      {
        fields: ['id'] as never,
      },
    );
    return new Set(rows.map((row) => (row as { id: string }).id));
  }
}
