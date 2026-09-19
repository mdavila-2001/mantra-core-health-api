import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { DocumentStoreService } from './modules/document_store/services';
import { RedisRuntimeService } from './modules/redis_runtime/services';
import { SearchIndexService } from './modules/search_platform/services';
import { ErrorCode } from './common';

const READINESS_TIMEOUT_MS = 3_000;

interface DependencyStatus {
  status: 'up' | 'down';
  latencyMs: number;
  reason?: string;
}

export interface ReadinessResult {
  status: 'ok';
  checks: Record<string, DependencyStatus>;
  timestamp: string;
}

/** Sonda agregada de las cuatro dependencias síncronas obligatorias de la API. */
@Injectable()
export class AppReadinessService {
  constructor(
    private readonly orm: MikroORM,
    private readonly documents: DocumentStoreService,
    private readonly redis: RedisRuntimeService,
    private readonly search: SearchIndexService,
  ) {}

  async check(): Promise<ReadinessResult> {
    const entries = await Promise.all([
      this.probe('postgresql', async () => {
        await this.orm.em.getConnection().execute('select 1');
      }),
      this.probe('mongodb', () => this.documents.ping()),
      this.probe('redis', () => this.redis.ping()),
      this.probe('opensearch', () => this.search.ping()),
      this.probe('rls', () => this.checkRls()),
    ]);
    const checks = Object.fromEntries(entries);
    const timestamp = new Date().toISOString();
    if (Object.values(checks).some((check) => check.status === 'down')) {
      const publicChecks = Object.fromEntries(
        Object.entries(checks).map(([name, check]) => [
          name,
          { status: check.status, latencyMs: check.latencyMs },
        ]),
      );
      throw new ServiceUnavailableException({
        code: ErrorCode.DEPENDENCY_UNAVAILABLE,
        message: 'Una o más dependencias obligatorias no están disponibles',
        details: { status: 'error', checks: publicChecks, timestamp },
      });
    }
    return { status: 'ok', checks, timestamp };
  }

  /**
   * MCH-013 · la readiness no puede anunciar aislamiento por tenant que en
   * realidad no rige.
   *
   * Sin `RLS_ENFORCE=true` esta sonda no consulta nada: el modo no está
   * activado en ningún despliegue actual y agregar una consulta para un
   * control apagado no cambiaría nada salvo el costo. Con el modo activado, el
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
    if (process.env.RLS_ENFORCE !== 'true') return;

    const [role] = await this.orm.em
      .getConnection()
      .execute<{ rolbypassrls: boolean; rolsuper: boolean }[]>(
        'select rolbypassrls, rolsuper from pg_roles where rolname = current_user',
      );
    if (!role || role.rolbypassrls || role.rolsuper) {
      throw new Error(
        role
          ? `RLS_ENFORCE=true pero el rol de runtime "${
              role.rolsuper ? 'es superusuario' : 'tiene BYPASSRLS'
            }": las políticas no aíslan nada`
          : 'RLS_ENFORCE=true pero no se pudo resolver el rol de runtime en pg_roles',
      );
    }
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
            () => reject(new Error(`timeout de ${READINESS_TIMEOUT_MS} ms`)),
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
          reason: error instanceof Error ? error.message : 'error desconocido',
        },
      ];
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
