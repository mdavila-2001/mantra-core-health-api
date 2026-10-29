import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { deterministicId, SEED } from '../constants/concepts';
import { runWithTenant } from '../tenant/tenant-context';
import { AuthenticationCredentials } from '../../modules/iam/entities';
import { IamUsersService } from '../../modules/iam/application/services';
import { TenantMemberships } from '../../modules/directory/entities';
import { DIR } from '../../modules/directory/directory.concepts';
import { DirectoryMembershipsService } from '../../modules/directory/services';
import {
  BOLIVIA_CARRIERS,
  BOLIVIA_CURATED_CARRIERS,
  BOLIVIA_PUBLIC_INSURERS,
} from './bolivia-insurance.catalog';
import { carrierTenantId } from './bolivia-insurance-seed.service';
import {
  demoGateSkip,
  loadDemoGateEnv,
  type DemoGateEnv,
  type DemoGateSkip,
} from './demo-gate';
import {
  PadronOrganizationsSeedService,
  padronFacilities,
} from './padron-organizations-seed.service';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';

/** Dominio reservado a cuentas de prueba: ningún correo sale a una persona real. */
const DEMO_EMAIL_DOMAIN = 'alovida.test';

/** Lo que el paso dejó hecho en esta pasada. */
export interface PadronOrgAdminsResult {
  /** Cuentas de administrador creadas. */
  created: number;
  /** Cuentas que ya estaban. */
  existing: number;
  /**
   * Organizaciones que ya tenían un administrador de demostración (una cuenta
   * `@alovida.test` con membresía `ADMIN` activa) de una carga anterior, y por
   * eso no recibieron otro.
   */
  adopted: number;
  /** Membresías ADMIN creadas. */
  memberships: number;
  /** Organizaciones que todavía no existen: su administrador espera al paso de organizaciones. */
  organizationMissing: number;
  /** Cuentas que fallaron, con el motivo. */
  failed: string[];
  /** Por qué no se hizo nada, si se saltó todo el paso. */
  reason?: DemoGateSkip;
}

/** Una organización que recibe administrador. */
interface AdminTarget {
  /** Base estable del correo y de los ids. */
  slug: string;
  /** Nombre con que se presenta la cuenta. */
  organizationName: string;
  /** Organización a la que administra. */
  tenantId: string | undefined;
}

/** `BO_EST_CLINICA_LAS_AMERICAS` → `clinica-las-americas`. */
function slugOf(code: string): string {
  return code
    .replace(/^BO_EST_/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Correo de la cuenta de administrador de una organización. */
export function padronAdminEmail(slug: string): string {
  return `admin.${slug}@${DEMO_EMAIL_DOMAIN}`;
}

/**
 * Una cuenta de administrador por organización del padrón (y por aseguradora).
 *
 * ## A qué organizaciones
 *
 * A todas salvo los centros de primer nivel (`CENTRO_SALUD`): una cuenta por
 * cada uno de los 464 centros no aporta a una demostración y llena la base de
 * credenciales. Quedan las clínicas, los hospitales y cajas, los laboratorios,
 * los centros de imágenes, las farmacias y las aseguradoras. La regla se infirió
 * de los conteos de la carga anterior y está escrita acá para que no dependa de
 * una lista exportada de otra base.
 *
 * ## Qué es una cuenta de demostración
 *
 * Tiene la contraseña compartida `SEED_DEMO_PASSWORD` y por eso pasa por el
 * candado común (`demo-gate.ts`): en producción no se crea ninguna. El correo es
 * siempre `admin.<organización>@alovida.test`, un dominio de pruebas al que no
 * llega correo de verdad.
 *
 * Todo entra por los servicios de la aplicación: `IamUsersService.createUser`
 * para la cuenta y `DirectoryMembershipsService.invite` para la membresía
 * `ADMIN`, esta última con id determinista.
 */
@Injectable()
export class PadronOrgAdminsSeedService {
  /**
   * @param orm - Acceso al `EntityManager` para las lecturas de convergencia.
   * @param users - Alta de cuentas, que sabe hashear la contraseña.
   * @param memberships - Alta de membresías de organización.
   * @param organizations - Resolución de la organización de cada fila del padrón.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly users: IamUsersService,
    private readonly memberships: DirectoryMembershipsService,
    private readonly organizations: PadronOrganizationsSeedService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PadronOrgAdminsSeedService.name);
  }

  /**
   * Ejecuta el paso.
   *
   * @param env - Candado de cuentas de demostración; por defecto, el del proceso.
   * @param enabled - Interruptor del paso.
   * @returns Qué quedó hecho en esta pasada.
   */
  async run(
    env: DemoGateEnv = loadDemoGateEnv(),
    enabled = process.env.SEED_PADRON_ORG_ADMINS_ENABLED === 'true',
  ): Promise<PadronOrgAdminsResult> {
    const result: PadronOrgAdminsResult = {
      created: 0,
      existing: 0,
      adopted: 0,
      memberships: 0,
      organizationMissing: 0,
      failed: [],
    };
    if (!enabled) return { ...result, reason: 'not-configured' };
    const skipped = demoGateSkip(env);
    if (skipped) {
      this.logger.warn(
        { operation: 'seed.padron-org-admins', reason: skipped },
        'Administradores de organizaciones omitidos: faltan SEED_DEMO_PASSWORD y SEED_DEMO_ALLOW_PRODUCTION=true',
      );
      return { ...result, reason: skipped };
    }
    const password = env.password as string;

    const em = this.orm.em.fork();
    await ensureSeedActor(em);
    const actor = { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] };

    let attempted = 0;
    for (const target of await this.targets()) {
      if (!target.tenantId) {
        result.organizationMissing++;
        continue;
      }
      attempted++;
      try {
        await this.ensureAdmin(
          target,
          target.tenantId,
          password,
          actor,
          result,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push(`${target.slug}: ${message}`);
        this.logger.error(
          {
            operation: 'seed.padron-org-admins',
            slug: target.slug,
            err: error,
          },
          'No se pudo dar de alta un administrador de organización',
        );
      }
    }

    this.logger.info(
      {
        operation: 'seed.padron-org-admins',
        created: result.created,
        existing: result.existing,
        adopted: result.adopted,
        memberships: result.memberships,
        organizationMissing: result.organizationMissing,
        failed: result.failed.length,
      },
      'Administradores de organizaciones sembrados',
    );
    // Una cuenta que falla es puntual y no detiene a las demás; que fallen
    // todas es una falla sistémica y el paso tiene que salir como fallido.
    if (attempted > 0 && result.failed.length === attempted) {
      throw new Error(
        `Fallaron las ${attempted} cuentas de administrador; la primera: ${result.failed[0]}`,
      );
    }
    return result;
  }

  /** Las organizaciones que reciben administrador, con su organización ya resuelta. */
  private async targets(): Promise<AdminTarget[]> {
    const em = this.orm.em.fork();
    const facilities = padronFacilities().filter(
      (row) => row.tipo !== 'CENTRO_SALUD',
    );
    const { idByCode } = await this.organizations.resolveIds(em, facilities);
    const fromPadron = facilities.map((row) => ({
      slug: slugOf(row.code),
      organizationName: row.nombre,
      tenantId: idByCode.get(row.code),
    }));

    const carriers = [
      ...BOLIVIA_CARRIERS,
      ...BOLIVIA_CURATED_CARRIERS,
      ...BOLIVIA_PUBLIC_INSURERS,
    ];
    const fromInsurers = carriers.map((carrier) => ({
      slug: slugOf(carrier.code),
      organizationName: carrier.sigla || carrier.razonSocial,
      tenantId: carrierTenantId(carrier.code),
    }));
    return [...fromPadron, ...fromInsurers];
  }

  /**
   * Si la organización ya tiene un administrador de demostración: una
   * membresía `ADMIN` activa cuyo usuario entra con un correo `@alovida.test`.
   */
  private async hasDemoAdmin(
    em: EntityManager,
    tenantId: string,
  ): Promise<boolean> {
    const admins = await em.find(TenantMemberships, {
      tenantId,
      tenantRoleConceptId: DIR.ROLE_ADMIN,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    });
    if (admins.length === 0) return false;
    const demo = await em.find(AuthenticationCredentials, {
      userId: { $in: admins.map((m) => m.userId) },
      externalSubject: { $ilike: `%@${DEMO_EMAIL_DOMAIN}` },
    });
    return demo.length > 0;
  }

  private async ensureAdmin(
    target: AdminTarget,
    tenantId: string,
    password: string,
    actor: { id: string; roles: string[] },
    result: PadronOrgAdminsResult,
  ): Promise<void> {
    const em = this.orm.em.fork();
    const email = padronAdminEmail(target.slug);

    const credential = await em.findOne(AuthenticationCredentials, {
      externalSubject: email,
    });
    // Dev y test se cargaron con scripts que dejaron sus propios administradores
    // y después se les cambió el correo: la cuenta sintética no existe, pero la
    // organización ya tiene un administrador de demostración. No se crea otro.
    if (!credential && (await this.hasDemoAdmin(em, tenantId))) {
      result.adopted++;
      return;
    }
    let userId = credential?.userId;
    if (userId) {
      result.existing++;
    } else {
      const created = await this.users.createUser(
        {
          displayName: `Administrador de ${target.organizationName}`.slice(
            0,
            200,
          ),
          email,
          password,
          initialRole: 'USER',
        },
        actor,
      );
      userId = created.id;
      result.created++;
    }

    const membership = await em.findOne(TenantMemberships, {
      userId,
      tenantId,
    });
    if (membership) return;
    await runWithTenant(SEED.tenantId, () =>
      this.memberships.invite(
        tenantId,
        { userId, role: 'ADMIN', accessScope: 'ALL_TENANT' },
        actor,
        deterministicId(`seed:tenant-membership:padron-admin:${target.slug}`),
      ),
    );
    result.memberships++;
  }
}
