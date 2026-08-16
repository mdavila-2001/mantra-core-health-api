import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  CodeSystemVersions,
  CodeSystems,
  ConceptDesignations,
  ConceptProperties,
  TerminologySources,
} from '../../modules/terminology/entities';
import { Tenants } from '../../modules/directory/entities';
import { ProcessingPurposes } from '../../modules/consent/entities';
import { Users } from '../../modules/iam/entities';
import {
  CONCEPT_DEFS,
  CONCEPTS,
  SEED,
  deterministicId,
} from '../constants/concepts';
import { MODULE_CONCEPT_SEEDS } from './module-concepts';
import {
  SPANISH_DEFINITION_PROPERTY_CODE,
  SPANISH_DESIGNATIONS,
} from './terminology-designations.es';

/** Tipo de dato de la propiedad que guarda la definición en castellano. */
const SPANISH_DEFINITION_DATA_TYPE = 'string';

/**
 * Identificador determinista de la designación `ES` de un concepto.
 *
 * Deterministas por el mismo motivo que el resto del seed: el arranque compara
 * por id para saber qué falta, y con un uuid aleatorio cada reinicio insertaría
 * una designación duplicada del mismo texto.
 */
export function spanishDesignationId(conceptId: string): string {
  return deterministicId(`seed:designation:es:${conceptId}`);
}

/** Identificador determinista de la propiedad con la definición en castellano. */
export function spanishDefinitionPropertyId(conceptId: string): string {
  return deterministicId(`seed:concept-property:definition-es:${conceptId}`);
}

/**
 * Materializa el catálogo de conceptos internos que el resto del sistema
 * referencia por FK (estados de usuario, métodos de credencial, tipos de evento,
 * etc.). Sin estas filas ninguna operación IAM/Common/Terminology podría
 * persistir, porque las columnas `*_concept_id` son claves foráneas obligatorias.
 *
 * Idempotente por diseño: se ejecuta en cada arranque y solo inserta lo que falta,
 * comparando por identificador. Los identificadores son deterministas (UUIDv5),
 * de modo que arranques repetidos convergen al mismo estado sin duplicar.
 *
 * Corta la recursión del modelo -un concepto tiene a su vez un `state_concept_id`-
 * dejando en nulo el estado del sistema de códigos raíz y de sus conceptos: son
 * la raíz del árbol y no necesitan a otro concepto para existir.
 */
@Injectable()
export class TerminologySeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Valor de orm requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TerminologySeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración puedan
   * garantizar el catálogo tras materializar el esquema.
   *
   * Se flushea por niveles (fuente/sistema/versión antes que los conceptos)
   * porque las FK del modelo son columnas `uuid` planas, no relaciones del ORM:
   * MikroORM no infiere el orden de inserción a partir de ellas, así que insertar
   * los conceptos y sus padres en el mismo flush violaría la FK del padre. El
   * flush intermedio impone el orden correcto de forma explícita.
   */
  async run(): Promise<{
    /**
     * Valor de inserted mantenido por la instancia.
     */
    inserted: number;
  }> {
    // `row_version` no se fija acá ni en ningún `em.create` de la aplicación:
    // MikroORM no inicializa la propiedad de versión y la base la aporta con su
    // `DEFAULT 1`, declarado en el DDL canónico desde v4.0.8. Antes esto se
    // parcheaba en caliente desde este mismo servicio con un `ALTER TABLE … SET
    // DEFAULT`, que es la dirección de cambio que el protocolo de 4 capas prohíbe
    // —y además solo cubría 4 de los 52 schemas, así que las escrituras del ORM
    // contra los otros 48 morían con 23502.
    const em = this.orm.em.fork();
    let inserted = 0;
    const now = new Date();

    // Nivel 1: fuente -> sistema de códigos -> versión. Se flushea tras cada uno
    // porque hay dependencia FK encadenada entre ellos y, al ser columnas uuid
    // planas (no relaciones del ORM), MikroORM no ordena los inserts por sí mismo.
    if (!(await em.findOne(TerminologySources, { id: SEED.sourceId }))) {
      em.create(
        TerminologySources,
        {
          id: SEED.sourceId,
          code: SEED.sourceCode,
          name: 'Mantra Core Internal Terminology',
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      await em.flush();
    }
    if (!(await em.findOne(CodeSystems, { id: SEED.codeSystemId }))) {
      em.create(
        CodeSystems,
        {
          id: SEED.codeSystemId,
          sourceId: SEED.sourceId,
          internalCode: SEED.codeSystemInternalCode,
          name: 'Mantra Core Internal Code System',
          canonicalUrl: SEED.canonicalUrl,
          caseSensitive: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      await em.flush();
    }
    if (
      !(await em.findOne(CodeSystemVersions, { id: SEED.codeSystemVersionId }))
    ) {
      em.create(
        CodeSystemVersions,
        {
          id: SEED.codeSystemVersionId,
          codeSystemId: SEED.codeSystemId,
          version: SEED.version,
          publishedAt: now,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      await em.flush();
    }

    // Nivel 2: conceptos. Une el catálogo base (transversal) con los conceptos
    // que declara cada módulo de dominio (MODULE_CONCEPT_SEEDS). Se deduplica por
    // id y se consultan de golpe los ya presentes para evitar el patrón N+1.
    const catalog = new Map<
      string,
      {
        /**
         * Valor de code mantenido por la instancia.
         */
        code: string; /**
         * Valor de display mantenido por la instancia.
         */
        display: string;
      }
    >();
    for (const name of Object.keys(CONCEPT_DEFS)) {
      catalog.set(CONCEPTS[name], {
        code: CONCEPT_DEFS[name].code,
        display: CONCEPT_DEFS[name].display,
      });
    }
    for (const seed of MODULE_CONCEPT_SEEDS) {
      // El `code` almacenado es la CLAVE del concepto (única globalmente), no el
      // `seed.code` humano: `catalog_concepts` tiene UNIQUE(code_system_version_id,
      // code) y varios módulos declaran códigos genéricos coincidentes (p. ej.
      // "ACTIVE"). Los servicios referencian los conceptos por id (mapa `ids`), no
      // por este código, así que usar la clave garantiza unicidad sin efectos.
      catalog.set(deterministicId(seed.key), {
        code: seed.key,
        display: seed.display,
      });
    }

    const ids = [...catalog.keys()];
    // `fields: ['id']` como en los otros nueve seeds: acá solo se necesita saber
    // qué ids ya estan, y sin eso esta era la unica consulta del arranque que
    // hidrataba la entidad completa de ~2 800 conceptos en cada boot.
    const existing = await em.find(
      CatalogConcepts,
      { id: { $in: ids } },
      { fields: ['id'] },
    );
    const existingIds = new Set(existing.map((c) => c.id));

    for (const [id, def] of catalog) {
      if (existingIds.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: def.code,
          display: def.display,
          abstract: false,
          selectable: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    await em.flush();

    // Nivel 2b: el catálogo en castellano —el nombre y la explicación de cada
    // concepto—, que es lo que el glosario muestra.
    //
    // Va después del flush de los conceptos y no dentro de él: las dos tablas
    // referencian `catalog_concepts.id` por FK, y como son columnas uuid planas
    // (no relaciones del ORM) MikroORM no ordena los inserts por sí mismo. Es el
    // mismo motivo por el que los tres niveles de arriba se flushean uno a uno.
    inserted += await this.seedSpanishDesignations(em, now);

    // Nivel 3: tenant por defecto (depende de conceptos ya materializados).
    if (!(await em.findOne(Tenants, { id: SEED.tenantId }))) {
      em.create(
        Tenants,
        {
          id: SEED.tenantId,
          code: SEED.tenantCode,
          tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PROVIDER,
          legalName: 'Mantra Core Default Tenant',
          legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_COMPANY,
          statusConceptId: CONCEPTS.TENANT_ACTIVE,
          verificationStatusConceptId: CONCEPTS.TENANT_VERIFIED,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      await em.flush();
    }

    // Nivel 4: propósito de procesamiento por defecto (consent).
    if (
      !(await em.findOne(ProcessingPurposes, { id: SEED.processingPurposeId }))
    ) {
      em.create(
        ProcessingPurposes,
        {
          id: SEED.processingPurposeId,
          code: SEED.processingPurposeCode,
          name: 'General care',
          purposeCategoryConceptId: CONCEPTS.PURPOSE_CATEGORY_CARE,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      await em.flush();
    }

    // Nivel 5: cuenta de servicio compartida por los 17 procesos worker
    // (depende de CONCEPTS.USER_ACTIVE, ya materializado en el nivel 2). Sin
    // fila real en `iam.users` violaría la FK NOT NULL de
    // `recorded_by_user_id`/`actor_user_id` en cuanto cualquiera de los
    // workers (`src/worker-<dominio>.ts`) llamara un endpoint interno con su
    // token autofirmado.
    if (!(await em.findOne(Users, { id: SEED.systemWorkerUserId }))) {
      em.create(
        Users,
        {
          id: SEED.systemWorkerUserId,
          statusConceptId: CONCEPTS.USER_ACTIVE,
          displayName: SEED.systemWorkerDisplayName,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      await em.flush();
    }

    if (inserted > 0) {
      this.logger.info(
        { inserted },
        'Catálogo de conceptos internos materializado',
      );
    }
    return { inserted };
  }

  /**
   * Materializa el catálogo en castellano: la designación `ES` preferida de cada
   * concepto y su definición en lenguaje llano.
   *
   * ## Por qué hacía falta
   *
   * `catalog_concepts.display` guarda el rótulo del sistema de codificación, que
   * en este catálogo está en inglés, y `catalog_concepts.definition` **nunca se
   * escribe**: el nivel 2 la deja vacía para todo el catálogo. El glosario
   * mostraba, entonces, nombres en inglés y explicaciones en blanco. Ver
   * `terminology-designations.es.ts` para el contenido y sus fuentes.
   *
   * ## Dónde va cada mitad
   *
   * El nombre a `concept_designations` (un texto por idioma, que es para lo que
   * esa tabla existe) y la definición a `concept_properties` bajo
   * `definition-es`. **`catalog_concepts.definition` no se toca**: es una sola
   * columna sin idioma declarado en un catálogo multilingüe, y escribir
   * castellano ahí dejaría la segunda lengua sin sitio.
   *
   * ## Idempotencia, y por qué no se pisa lo que ya está
   *
   * Los identificadores son deterministas, así que el seed compara por id e
   * inserta sólo lo que falta — misma regla que el resto del arranque. Lo que ya
   * existe **no se actualiza**: si alguien corrigió una designación por API
   * (`POST /terminology/concepts/:id/designations`), el arranque siguiente no le
   * deshace el cambio. Cambiar una traducción de este archivo, por lo mismo, no
   * reescribe la fila ya sembrada: hay que corregirla por API, que es la vía que
   * queda auditada.
   *
   * Un concepto sin traducción declarada sencillamente no recibe fila. La
   * lectura lo devuelve con su rótulo original y marcado como no traducido, que
   * es preferible a dejarlo en blanco o a inventarle un texto.
   *
   * @param em - Contexto de persistencia del seed, con los conceptos ya volcados.
   * @param now - Instante único de la corrida, compartido con el resto de niveles.
   * @returns Cuántas filas se insertaron entre las dos tablas.
   */
  private async seedSpanishDesignations(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const conceptIds = [...SPANISH_DESIGNATIONS.keys()];
    if (conceptIds.length === 0) return 0;

    const designationIds = conceptIds.map(spanishDesignationId);
    const propertyIds = conceptIds.map(spanishDefinitionPropertyId);

    // Se consultan de golpe los ya presentes: son ciento y pico conceptos y esto
    // corre en cada arranque, así que comprobar fila a fila sería un N+1 en el
    // camino crítico del despegue.
    const [existingDesignations, existingProperties, existingConcepts] =
      await Promise.all([
        em.find(
          ConceptDesignations,
          { id: { $in: designationIds } },
          { fields: ['id'] },
        ),
        em.find(
          ConceptProperties,
          { id: { $in: propertyIds } },
          { fields: ['id'] },
        ),
        em.find(
          CatalogConcepts,
          { id: { $in: conceptIds } },
          { fields: ['id'] },
        ),
      ]);

    const yaEstaLaDesignacion = new Set(
      existingDesignations.map((row) => row.id),
    );
    const yaEstaLaPropiedad = new Set(existingProperties.map((row) => row.id));
    // Traducir un concepto que no existe violaría la FK y abortaría el arranque
    // entero. Se filtra y se avisa: el catálogo declarado y el sembrado pueden
    // divergir mientras alguien está a mitad de mover un concepto de módulo.
    const conceptoSembrado = new Set(existingConcepts.map((row) => row.id));

    let inserted = 0;
    const huerfanos: string[] = [];

    for (const [conceptId, traduccion] of SPANISH_DESIGNATIONS) {
      if (!conceptoSembrado.has(conceptId)) {
        huerfanos.push(conceptId);
        continue;
      }

      const designationId = spanishDesignationId(conceptId);
      if (!yaEstaLaDesignacion.has(designationId)) {
        em.create(
          ConceptDesignations,
          {
            id: designationId,
            conceptId,
            value: traduccion.display,
            languageConceptId: CONCEPTS.LANG_ES,
            designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
            preferred: true,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        inserted++;
      }

      const propertyId = spanishDefinitionPropertyId(conceptId);
      if (!yaEstaLaPropiedad.has(propertyId)) {
        em.create(
          ConceptProperties,
          {
            id: propertyId,
            conceptId,
            propertyCode: SPANISH_DEFINITION_PROPERTY_CODE,
            dataType: SPANISH_DEFINITION_DATA_TYPE,
            valueJson: traduccion.definition,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        inserted++;
      }
    }

    await em.flush();

    if (huerfanos.length > 0) {
      this.logger.warn(
        { operation: 'seed.terminology.es', count: huerfanos.length },
        'Hay traducciones declaradas para conceptos que no están en el catálogo: se omiten',
      );
    }
    if (inserted > 0) {
      this.logger.info(
        { operation: 'seed.terminology.es', inserted },
        'Catálogo en castellano materializado',
      );
    }
    return inserted;
  }
}
