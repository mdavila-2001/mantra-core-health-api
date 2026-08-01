import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  CodeSystemVersions,
  CodeSystems,
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
    await this.ensureRowVersionDefaults();

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
    const existing = await em.find(CatalogConcepts, { id: { $in: ids } });
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
   * Garantiza `DEFAULT 1` en toda columna `row_version` de los esquemas de datos
   * de negocio. Es necesario porque las entidades generadas declaran la columna de
   * versión sin `type` explícito: MikroORM 7 no puede inicializarla y la omite del
   * INSERT, de modo que sin un default a nivel de base cada alta violaría el
   * NOT NULL. `SET DEFAULT` es idempotente; tras la primera pasada no quedan
   * columnas pendientes y el coste es una única consulta a `information_schema`.
   *
   * Cubre todos los esquemas de negocio excluyendo los del sistema, no una lista
   * fija: cada módulo nuevo trae tablas con `row_version` y enumerarlos a mano
   * dejaba fuera silenciosamente a los que se integraran después.
   *
   * Los `ALTER` van dentro de un solo `DO`, no en un bucle de consultas: son más
   * de mil tablas y una ida y vuelta por cada una añadía varios MINUTOS al primer
   * arranque, con el proceso ya escuchando pero sin poder atender nada.
   */
  private async ensureRowVersionDefaults(): Promise<void> {
    const connection = this.orm.em.getConnection();
    // Dos `execute()` separados, no un único string con `do $$...$$;` seguido de
    // `select`: bajo Kysely (MikroORM >= 6), un solo round-trip con varias
    // sentencias no garantiza que el result set devuelto sea el de la última
    // (`connection.execute` puede resolver con un array vacío), así que el
    // destructuring `[{ altered }]` fallaba con "Cannot read properties of
    // undefined" y el seed completo se abortaba en cada arranque.
    await connection.execute(
      `do $$
       declare
         target record;
       begin
         for target in
           select table_schema, table_name
             from information_schema.columns
            where column_name = 'row_version'
              and column_default is null
              and table_schema not in ('pg_catalog', 'information_schema')
              and table_schema not like 'pg_%'
         loop
           execute format(
             'alter table %I.%I alter column row_version set default 1',
             target.table_schema, target.table_name);
         end loop;
       end $$;`,
    );

    const [{ altered }]: Array<{
      /**
       * Cuántas columnas quedaron con default en esta pasada.
       */
      altered: number;
    }> = await connection.execute(
      `select count(*)::int as altered
         from information_schema.columns
        where column_name = 'row_version'
          and column_default is null
          and table_schema not in ('pg_catalog', 'information_schema')
          and table_schema not like 'pg_%'`,
    );

    if (altered > 0) {
      // Si algo queda sin default después del bloque, es que no se pudo alterar
      // (vista, permisos): mejor que se vea a que falle el primer INSERT.
      this.logger.warn(
        { columns: altered },
        'Quedan columnas row_version sin DEFAULT tras el barrido',
      );
    }
  }
}
