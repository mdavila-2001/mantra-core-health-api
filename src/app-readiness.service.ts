import { Injectable, Logger, Optional } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { SchemaIntegrityState } from './orm/bootstrap/schema-integrity.state';
import {
  describeViolations,
  inspectRuntimeRole,
  shouldVerifyRuntimeRole,
} from './orm/config/runtime-role.guard';
import { DocumentStoreService } from './modules/document_store/services';
import { RedisRuntimeService } from './modules/redis_runtime/services';
import { SearchIndexService } from './modules/search_platform/services';
import { SystemErrorReason } from './common/errors/system-error-reasons';
import { serviceUnavailableWithReason } from './common/errors/reasoned-http-exceptions';
import { catalogConceptDefinitions } from './common/seed/catalog-concept-definitions';
import { loadSeedBootEnv } from './common/seed/seed-boot.env';
import { SeedCoreState } from './common/seed/seed-core.state';

/** Plazo de cada sonda; lo declara también la sonda de vida de instancias. */
export const READINESS_TIMEOUT_MS = 3_000;

/**
 * Una sonda no respondió dentro del plazo. Clase propia para que quien lee las
 * entradas (`collect()`) distinga «no contestó» de «contestó que no» por el
 * `name`, sin mirar el mensaje.
 */
class ProbeTimeoutError extends Error {
  override readonly name = 'ProbeTimeoutError';
}

/**
 * El bootstrap del DDL dejó restricciones de integridad sin aplicar (ORMN-01).
 *
 * Clase propia para que `check()` distinga este fallo de una dependencia caída y
 * lo publique con su `reason`. Su `name` es lo único que sale del log de la sonda.
 */
class SchemaIntegrityIncompleteError extends Error {
  override readonly name = 'SchemaIntegrityIncompleteError';
}

/** Un seed núcleo falló, o el catálogo de conceptos no está materializado (SEED-01). */
class SeedCoreIncompleteError extends Error {
  override readonly name = 'SeedCoreIncompleteError';
}

export interface DependencyStatus {
  status: 'up' | 'down';
  latencyMs: number;
  /** Clase del error de la sonda; sólo para el log, nunca para la respuesta. */
  errorType?: string;
}

export interface ReadinessResult {
  status: 'ok';
  checks: Record<string, DependencyStatus>;
  timestamp: string;
}

/** Sonda agregada de las cuatro dependencias síncronas obligatorias de la API. */
@Injectable()
export class AppReadinessService {
  private readonly logger = new Logger(AppReadinessService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly documents: DocumentStoreService,
    private readonly redis: RedisRuntimeService,
    private readonly search: SearchIndexService,
    // ORMN-01: opcional para no romper a quien construye la sonda a mano.
    @Optional() private readonly schemaIntegrity?: SchemaIntegrityState,
    // SEED-01: ídem.
    @Optional() private readonly seedCore?: SeedCoreState,
  ) {}

  /** La sonda de contenido del catálogo ya vio todos los conceptos: no se repite. */
  private catalogVerified = false;

  /**
   * Ejecuta las cinco sondas en paralelo y devuelve sus resultados **sin
   * lanzar**: es lo que `check()` convierte en 200/503 y lo que la sonda de
   * vida de instancias (`ops_console`) consume como dato.
   */
  async collect(): Promise<Array<[string, DependencyStatus]>> {
    return Promise.all([
      this.probe('postgresql', async () => {
        await this.orm.em.getConnection().execute('select 1');
        // ORMN-01: una base con FKs/únicos sin crear no está lista aunque responda.
        await this.checkSchemaIntegrity();
        // SEED-01: ídem para los seeds núcleo y el catálogo de conceptos.
        await this.checkSeedCore();
      }),
      this.probe('mongodb', () => this.documents.ping()),
      this.probe('redis', () => this.redis.ping()),
      this.probe('opensearch', () => this.search.ping()),
      this.probe('rls', () => this.checkRls()),
    ]);
  }

  async check(): Promise<ReadinessResult> {
    const entries = await this.collect();
    const checks = Object.fromEntries(entries);
    const timestamp = new Date().toISOString();
    if (Object.values(checks).some((check) => check.status === 'down')) {
      const publicChecks = Object.fromEntries(
        Object.entries(checks).map(([name, check]) => [
          name,
          { status: check.status, latencyMs: check.latencyMs },
        ]),
      );
      // El diagnóstico (qué dependencia y de qué clase fue el error) queda en
      // el log; el mensaje del error, que puede traer host, usuario o SQL, no
      // sale de acá ni viaja en la respuesta pública.
      this.logger.warn(
        `Readiness degradada: ${entries
          .filter(([, check]) => check.status === 'down')
          .map(([name, check]) => `${name}(${check.errorType ?? 'Error'})`)
          .join(', ')}`,
      );
      throw serviceUnavailableWithReason(
        'Una o más dependencias obligatorias no están disponibles',
        this.reasonOf(entries),
        { status: 'error', checks: publicChecks, timestamp },
      );
    }
    return { status: 'ok', checks, timestamp };
  }

  /**
   * El `reason` que publica un 503: el específico cuando **todo** lo que falló es
   * una integridad del esquema o un seed núcleo incompletos, y el genérico de
   * dependencia no disponible si falló algo más (o una mezcla).
   */
  private reasonOf(
    entries: ReadonlyArray<[string, DependencyStatus]>,
  ): SystemErrorReason {
    const caidas = entries
      .filter(([, check]) => check.status === 'down')
      .map(([, check]) => check.errorType);
    if (caidas.every((tipo) => tipo === 'SchemaIntegrityIncompleteError'))
      return SystemErrorReason.SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE;
    if (caidas.every((tipo) => tipo === 'SeedCoreIncompleteError'))
      return SystemErrorReason.SYSTEM_SEED_CORE_INCOMPLETE;
    return SystemErrorReason.SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE;
  }

  /**
   * MCH-013 · la readiness no puede anunciar aislamiento por tenant que en
   * realidad no rige.
   *
   * Fuera de producción y sin `RLS_ENFORCE=true` esta sonda no consulta nada
   * (HZ-05: en producción sí, porque un runtime con el rol dueño anula RLS
   * aunque el interruptor esté apagado). Con el modo activado, el
   * operador está afirmando que las políticas de PostgreSQL aíslan por
   * tenant — y eso es falso si el rol de runtime tiene `BYPASSRLS` o es
   * superusuario, porque esos roles ignoran toda política sin excepción. En
   * ese caso la sonda falla: es preferible un despliegue que no arranca a uno
   * que arranca creyéndose aislado.
   *
   * No decide *qué* rol usar (eso es `DB_APP_USER`, en `orm.config.ts`); sólo
   * se niega a certificar como seguro un rol que no puede serlo.
   */
  private async checkRls(): Promise<void> {
    // HZ-05: además de `RLS_ENFORCE=true`, en producción (salvo el proceso de
    // migración) la sonda verifica el rol de conexión: un runtime que ignora RLS
    // no se certifica aunque el interruptor esté apagado.
    if (!shouldVerifyRuntimeRole()) return;
    // Excepción transitoria declarada para producción (el arranque ya la dejó
    // registrada como error). Con RLS_ENFORCE=true no hay excepción que valga.
    if (
      process.env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE === 'true' &&
      process.env.RLS_ENFORCE !== 'true'
    ) {
      return;
    }

    const connection = this.orm.em.getConnection();
    const facts = await inspectRuntimeRole(<T>(sql: string) =>
      connection.execute<T[]>(sql),
    );
    const violations = describeViolations(facts);
    if (violations.length > 0) {
      throw new Error(
        `El rol de runtime ${violations.join('; ')}: las políticas no aíslan nada`,
      );
    }
  }

  /**
   * ORMN-01 · no se anuncia listo con FKs o únicos de integridad sin crear.
   *
   * Lee el reporte del bootstrap del DDL; `SCHEMA_INTEGRITY_ENFORCE=false` es la
   * válvula explícita para un despliegue que sabe que tiene datos huérfanos.
   */
  private async checkSchemaIntegrity(): Promise<void> {
    if (process.env.SCHEMA_INTEGRITY_ENFORCE === 'false') return;
    if (this.schemaIntegrity && !this.schemaIntegrity.isComplete()) {
      const report = this.schemaIntegrity.current();
      throw new SchemaIntegrityIncompleteError(
        `Integridad del esquema incompleta: ${report?.blockingCount ?? 0} restricciones sin aplicar`,
      );
    }
  }

  /**
   * SEED-01 · no se anuncia listo con seeds núcleo sin materializar.
   *
   * Dos casos:
   * - un paso `core` falló en este proceso y el entorno no lo hizo fatal (fuera de
   *   producción sin `SEED_CORE_FAILURE_FATAL=true`): lo dice {@link SeedCoreState};
   * - la siembra al arranque está apagada (`SEED_ON_BOOT=false`), de modo que este
   *   proceso nunca comprobó la base: se verifica que todos los conceptos del
   *   catálogo interno existan. Es una sonda por **contenido**, no por versión:
   *   no hay un marcador de versión del seed en la base, así que un concepto que
   *   el código nuevo añade y la base no tiene se detecta, pero un valor que
   *   cambió sin cambiar de id, no.
   *
   * Sólo se registran conteos y nombres de pasos; nunca ids ni textos.
   */
  private async checkSeedCore(): Promise<void> {
    const failed = this.seedCore?.failedSteps() ?? [];
    if (failed.length > 0) {
      throw new SeedCoreIncompleteError(
        `Seeds núcleo fallidos: ${failed.join(', ')}`,
      );
    }
    if (loadSeedBootEnv().enabled || this.catalogVerified) return;

    const ids = [...catalogConceptDefinitions().keys()];
    const rows = await this.orm.em
      .getConnection()
      .execute<{ present: number | string }[]>(
        `select count(*)::int as present from terminology.catalog_concepts where id in (${ids
          .map(() => '?')
          .join(', ')})`,
        ids,
      );
    const present = Number(rows[0]?.present ?? 0);
    if (present < ids.length) {
      throw new SeedCoreIncompleteError(
        `Catálogo de conceptos sin materializar: faltan ${ids.length - present} de ${ids.length}`,
      );
    }
    this.catalogVerified = true;
  }

  private async probe(
    name: string,
    operation: () => Promise<void>,
  ): Promise<[string, DependencyStatus]> {
    const startedAt = Date.now();
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new ProbeTimeoutError(`timeout de ${READINESS_TIMEOUT_MS} ms`),
              ),
            READINESS_TIMEOUT_MS,
          );
          timeout.unref();
        }),
      ]);
      return [name, { status: 'up', latencyMs: Date.now() - startedAt }];
    } catch (error) {
      return [
        name,
        {
          status: 'down',
          latencyMs: Date.now() - startedAt,
          errorType: error instanceof Error ? error.name : 'desconocido',
        },
      ];
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
