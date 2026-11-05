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
import { demoGateSkip, loadDemoGateEnv, type DemoGateEnv } from './demo-gate';
import {
  PadronOrganizationsSeedService,
  padronFacilities,
} from './padron-organizations-seed.service';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';
import {
  DEMO_EMAIL_DOMAIN,
  padronAdminEmail,
  slugOf,
  type AdminTarget,
  type PadronOrgAdminsResult,
} from './padron-org-admins.types';

// Re-export core helpers and types for backwards compatibility.
export {
  padronAdminEmail,
  type PadronOrgAdminsResult,
} from './padron-org-admins.types';

/**
 * Provisions one demo administrator account per padron organization and insurer carrier.
 * Applies shared demo password gates and generates deterministic directory memberships.
 */
@Injectable()
export class PadronOrgAdminsSeedService {
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
   * Executes the organization administrator seeding process.
   *
   * @param env - Demo gate environment settings enforcing password security.
   * @param enabled - Feature flag switch; defaults to env variable configuration.
   * @returns Seeding result summary metrics.
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
        'Organization administrators skipped: missing SEED_DEMO_PASSWORD or SEED_DEMO_ALLOW_PRODUCTION=true',
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
          'Failed to seed organization administrator',
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
      'Organization administrators seeded',
    );

    // If all administrator accounts fail, fail the whole seed step.
    if (attempted > 0 && result.failed.length === attempted) {
      throw new Error(
        `Fallaron las ${attempted} cuentas de administrador; la primera: ${result.failed[0]}`,
      );
    }
    return result;
  }

  /** Gathers all candidate organizations (excluding first-tier health centers) and carriers. */
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
   * Checks if an organization already has an active demo administrator with an @alovida.test email.
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

  /** Idempotently creates administrator user credentials and assigns the ADMIN membership. */
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
    // Check if an existing demo admin was already provisioned in previous environments.
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
