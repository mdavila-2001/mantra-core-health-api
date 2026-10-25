import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';

/**
 * HZ-05 · el rol con el que la API atiende tráfico no puede saltarse RLS.
 *
 * Un superusuario, un rol con `BYPASSRLS` o el dueño de una tabla con RLS sin
 * `FORCE ROW LEVEL SECURITY` ignoran las políticas por tenant sin ningún error.
 * Con cualquiera de ellos las 288 tablas con política quedan protegidas sólo por
 * lo que cada servicio implemente a mano. Este guard se niega a arrancar así en
 * producción, y deja la excepción escrita y ruidosa en vez de implícita.
 *
 * Reglas:
 *   - Fuera de `NODE_ENV=production` no consulta nada (desarrollo y tests no
 *     cambian), salvo `RLS_ENFORCE=true`, donde sólo avisa.
 *   - El proceso de migración/seed (`seed-cli`, `DB_ROLE_PURPOSE=migration`) es
 *     el único que legítimamente usa el rol dueño: queda exento.
 *   - `DB_ALLOW_PRIVILEGED_RUNTIME_ROLE=true` es una válvula transitoria
 *     explícita; cada arranque con ella deja un `error` en el log.
 */

/** Hechos del rol de conexión que alimentan la política. */
export interface RuntimeRoleFacts {
  superuser: boolean;
  bypassRls: boolean;
  /** Tablas con RLS sin FORCE de las que el rol es dueño (ignora sus políticas). */
  ownedUnforcedRlsTables: number;
}

/** Consulta mínima de lectura; la implementa el `EntityManager` de MikroORM. */
export type RoleQuery = <T>(sql: string) => Promise<T[]>;

/** Veredicto de la política sobre un rol. */
export interface RuntimeRoleVerdict {
  /** Motivos por los que el rol ignora RLS; vacío si no lo hace. */
  violations: string[];
  /** Si el arranque debe abortar. */
  fatal: boolean;
}

const ROLE_FACTS_SQL = `
  select r.rolsuper,
         r.rolbypassrls,
         (select count(*)::int
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
           where c.relkind in ('r', 'p')
             and c.relrowsecurity
             and not c.relforcerowsecurity
             and c.relowner = r.oid
             and n.nspname not in ('pg_catalog', 'information_schema')
         ) as owned_unforced_rls_tables
    from pg_roles r
   where r.rolname = current_user`;

/** Produce los hechos del rol actual, o `null` si `pg_roles` no lo muestra. */
export async function inspectRuntimeRole(
  query: RoleQuery,
): Promise<RuntimeRoleFacts | null> {
  const [row] = await query<{
    rolsuper: boolean;
    rolbypassrls: boolean;
    owned_unforced_rls_tables?: number;
  }>(ROLE_FACTS_SQL);
  if (!row) return null;
  return {
    superuser: row.rolsuper === true,
    bypassRls: row.rolbypassrls === true,
    ownedUnforcedRlsTables: Number(row.owned_unforced_rls_tables ?? 0),
  };
}

/** ¿Este proceso es el de migración/seed, que sí usa el rol dueño? */
export function isMigrationProcess(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.DB_ROLE_PURPOSE === 'migration';
}

/**
 * ¿Hay que inspeccionar el rol de runtime en este entorno?
 *
 * Producción (salvo el proceso de migración) o `RLS_ENFORCE=true`. En cualquier
 * otro caso —desarrollo, tests— la sonda no consulta nada.
 */
export function shouldVerifyRuntimeRole(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (isMigrationProcess(env)) return false;
  return env.NODE_ENV === 'production' || env.RLS_ENFORCE === 'true';
}

/** Describe en palabras por qué el rol ignora RLS (sin nombres ni credenciales). */
export function describeViolations(facts: RuntimeRoleFacts | null): string[] {
  if (!facts) {
    return ['no se pudo resolver el rol de conexión en pg_roles'];
  }
  const violations: string[] = [];
  if (facts.superuser) violations.push('es superusuario');
  if (facts.bypassRls) violations.push('tiene BYPASSRLS');
  if (facts.ownedUnforcedRlsTables > 0) {
    violations.push(
      `es dueño de ${facts.ownedUnforcedRlsTables} tablas con RLS sin FORCE`,
    );
  }
  return violations;
}

/** Aplica la política de arranque a los hechos del rol. */
export function evaluateRuntimeRole(
  facts: RuntimeRoleFacts | null,
  env: NodeJS.ProcessEnv = process.env,
): RuntimeRoleVerdict {
  const violations = describeViolations(facts);
  const isProduction = env.NODE_ENV === 'production';
  const overridden = env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE === 'true';
  return {
    violations,
    fatal: violations.length > 0 && isProduction && !overridden,
  };
}

/** Ejecuta la política al arrancar y aborta si corresponde. */
@Injectable()
export class RuntimeRoleGuardService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RuntimeRoleGuardService.name);

  constructor(private readonly orm: MikroORM) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!shouldVerifyRuntimeRole()) return;

    const connection = this.orm.em.getConnection();
    const facts = await inspectRuntimeRole(<T>(sql: string) =>
      connection.execute<T[]>(sql),
    );
    const verdict = evaluateRuntimeRole(facts);
    const roleIsSafe = verdict.violations.length === 0;

    if (roleIsSafe) {
      // El inverso también es un error de despliegue: un rol que SÍ respeta RLS
      // sin `RLS_ENFORCE=true` no recibe `app.current_tenant_id`, y las
      // políticas (fail-closed) le ocultan todas las filas.
      if (process.env.RLS_ENFORCE !== 'true') {
        this.logger.error(
          'El rol de conexión respeta RLS pero RLS_ENFORCE no es "true": el ' +
            'interceptor no fija el tenant y las políticas ocultarán las filas. ' +
            'Definí RLS_ENFORCE=true junto con DB_APP_USER.',
        );
      }
      return;
    }

    const reason = verdict.violations.join('; ');
    if (verdict.fatal) {
      throw new Error(
        `SYSTEM_DB_ROLE_PRIVILEGED: el rol de conexión de la API ${reason}: ` +
          'RLS no se aplicaría. Conectá con DB_APP_USER/DB_APP_PASSWORD (rol ' +
          'sin BYPASSRLS, ni dueño de las tablas) y reservá DB_USER para ' +
          'migraciones y seed. Excepción transitoria explícita: ' +
          'DB_ALLOW_PRIVILEGED_RUNTIME_ROLE=true.',
      );
    }
    this.logger.error(
      `El rol de conexión ${reason}: las políticas RLS no aíslan por tenant.` +
        (process.env.NODE_ENV === 'production'
          ? ' DB_ALLOW_PRIVILEGED_RUNTIME_ROLE=true lo tolera; es una excepción transitoria.'
          : ''),
    );
  }
}
