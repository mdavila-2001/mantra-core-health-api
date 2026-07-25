import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  CodeSystemVersions,
  CodeSystems,
  TerminologySources,
} from '../../modules/terminology/entities';
import { Tenants } from '../../modules/directory/entities';
import { CONCEPT_DEFS, CONCEPTS, SEED, type ConceptName } from '../constants/concepts';

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
export class TerminologySeedService implements OnApplicationBootstrap {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TerminologySeedService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.run();
    } catch (error) {
      // El seed no debe tumbar el arranque si el esquema aún no existe (modo
      // ORM_SCHEMA_SYNC=off contra base vacía). Se registra y se sigue: las
      // operaciones que necesiten los conceptos fallarán con un error claro.
      this.logger.warn({ err: error }, 'Seed de terminología omitido');
    }
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
  async run(): Promise<{ inserted: number }> {
    await this.ensureRowVersionDefaults();

    const em = this.orm.em.fork();
    let inserted = 0;
    const now = new Date();

    // Nivel 1: fuente -> sistema de códigos -> versión. Se flushea tras cada uno
    // porque hay dependencia FK encadenada entre ellos y, al ser columnas uuid
    // planas (no relaciones del ORM), MikroORM no ordena los inserts por sí mismo.
    if (!(await em.findOne(TerminologySources, { id: SEED.sourceId }))) {
      em.create(TerminologySources, {
        id: SEED.sourceId,
        code: SEED.sourceCode,
        name: 'Mantra Core Internal Terminology',
        createdAt: now,
        updatedAt: now,
      }, { partial: true });
      inserted++;
      await em.flush();
    }
    if (!(await em.findOne(CodeSystems, { id: SEED.codeSystemId }))) {
      em.create(CodeSystems, {
        id: SEED.codeSystemId,
        sourceId: SEED.sourceId,
        internalCode: SEED.codeSystemInternalCode,
        name: 'Mantra Core Internal Code System',
        canonicalUrl: SEED.canonicalUrl,
        caseSensitive: true,
        createdAt: now,
        updatedAt: now,
      }, { partial: true });
      inserted++;
      await em.flush();
    }
    if (!(await em.findOne(CodeSystemVersions, { id: SEED.codeSystemVersionId }))) {
      em.create(CodeSystemVersions, {
        id: SEED.codeSystemVersionId,
        codeSystemId: SEED.codeSystemId,
        version: SEED.version,
        publishedAt: now,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      }, { partial: true });
      inserted++;
      await em.flush();
    }

    // Nivel 2: conceptos. Se consultan de golpe los ya presentes para no emitir
    // una query por cada uno (evita el patrón N+1 en el arranque).
    const names = Object.keys(CONCEPT_DEFS) as ConceptName[];
    const ids = names.map((n) => CONCEPTS[n]);
    const existing = await em.find(CatalogConcepts, { id: { $in: ids } });
    const existingIds = new Set(existing.map((c) => c.id));

    for (const name of names) {
      const id = CONCEPTS[name];
      if (existingIds.has(id)) continue;
      const definition = CONCEPT_DEFS[name];
      em.create(CatalogConcepts, {
        id,
        codeSystemVersionId: SEED.codeSystemVersionId,
        code: definition.code,
        display: definition.display,
        abstract: false,
        selectable: true,
        createdAt: now,
        updatedAt: now,
      }, { partial: true });
      inserted++;
    }
    await em.flush();

    // Nivel 3: tenant por defecto (depende de conceptos ya materializados).
    if (!(await em.findOne(Tenants, { id: SEED.tenantId }))) {
      em.create(Tenants, {
        id: SEED.tenantId,
        code: SEED.tenantCode,
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PROVIDER,
        legalName: 'Mantra Core Default Tenant',
        legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_COMPANY,
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        verificationStatusConceptId: CONCEPTS.TENANT_VERIFIED,
        createdAt: now,
        updatedAt: now,
      }, { partial: true });
      inserted++;
      await em.flush();
    }

    if (inserted > 0) {
      this.logger.info({ inserted }, 'Catálogo de conceptos internos materializado');
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
   */
  private async ensureRowVersionDefaults(): Promise<void> {
    const connection = this.orm.em.getConnection();
    const pending: Array<{ table_schema: string; table_name: string }> =
      await connection.execute(
        `select table_schema, table_name
           from information_schema.columns
          where column_name = 'row_version'
            and column_default is null
            and table_schema in ('iam', 'common', 'terminology', 'directory')`,
      );
    for (const { table_schema, table_name } of pending) {
      await connection.execute(
        `alter table "${table_schema}"."${table_name}" alter column row_version set default 1`,
      );
    }
    if (pending.length > 0) {
      this.logger.info({ columns: pending.length }, 'Defaults de row_version asegurados');
    }
  }
}
