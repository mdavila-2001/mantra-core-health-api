import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { CONCEPTS, SEED } from '../constants/concepts';
import { runWithTenant } from '../tenant/tenant-context';
import { AddressesService } from '../../modules/common/services';
import { PublicProfileProjectionService } from '../../modules/community/services';
import { DIR } from '../../modules/directory/directory.concepts';
import { DirectoryTenantsService } from '../../modules/directory/services';
import { demoGateSkip, loadDemoGateEnv } from './demo-gate';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';
import {
  KIND_BY_TIPO,
  LEGACY_CODE_PREFIX,
  padronFacilities,
  padronOwnerMembershipId,
  padronTenantId,
  type FacilityKind,
  type PadronFacility,
  type PadronOrganizationsResult,
} from './padron-organizations/padron-facility.types';
import {
  resolveFacilityIds,
  resolveKnownState,
  type KnownState,
} from './padron-organizations/padron-legacy-adoption.helper';
import {
  activateFacilityTenant,
  completeFacilityShowcase,
  createFacilityAddress,
} from './padron-organizations/padron-showcase-address.helper';

// Re-export core types and helpers for backwards compatibility across existing callers.
export {
  padronFacilities,
  padronOwnerMembershipId,
  padronTenantId,
  padronTenantType,
  type PadronFacility,
  type PadronOrganizationsResult,
} from './padron-organizations/padron-facility.types';

/**
 * Seeds health facilities from Santa Cruz public padron as active, unverified platform organizations.
 * Ensures deterministic UUIDs and safe adoption of pre-existing legacy seed records.
 */
@Injectable()
export class PadronOrganizationsSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly tenants: DirectoryTenantsService,
    private readonly addresses: AddressesService,
    private readonly projection: PublicProfileProjectionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PadronOrganizationsSeedService.name);
  }

  /**
   * Executes the facility organization seeding pipeline.
   *
   * @param enabled - Main feature switch; skips execution when disabled.
   * @param demoShowcases - Controls whether regulated entities receive demo vitrinas without formal papers.
   * @returns Aggregated metrics of created, adopted, activated, and skipped records.
   */
  async run(
    enabled = process.env.SEED_PADRON_ORGANIZATIONS_ENABLED === 'true',
    demoShowcases = demoGateSkip(loadDemoGateEnv()) === undefined,
  ): Promise<PadronOrganizationsResult> {
    const result: PadronOrganizationsResult = {
      created: 0,
      existing: 0,
      adopted: 0,
      adoptedTypeMismatch: 0,
      ambiguous: [],
      activated: 0,
      pendingForPapers: 0,
      showcases: 0,
      addresses: 0,
      skipped: [],
      failed: [],
    };
    if (!enabled) return { ...result, reason: 'not-configured' };

    const em = this.orm.em.fork();
    await ensureSeedActor(em);
    const actor = { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] };

    const facilities = padronFacilities();
    const known = await resolveKnownState(em, facilities);

    let attempted = 0;
    for (const row of facilities) {
      const kind = KIND_BY_TIPO[row.tipo];
      if (!kind) {
        result.skipped.push(`${row.code}: tipo ${row.tipo} sin clasificar`);
        continue;
      }
      attempted++;
      try {
        await this.ensureOrganization(
          row,
          kind,
          actor,
          known,
          demoShowcases,
          result,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push(`${row.code}: ${message}`);
        this.logger.error(
          {
            operation: 'seed.padron-organizations',
            code: row.code,
            err: error,
          },
          'Failed to seed padron organization',
        );
      }
    }

    this.logger.info(
      {
        operation: 'seed.padron-organizations',
        created: result.created,
        existing: result.existing,
        adopted: result.adopted,
        adoptedTypeMismatch: result.adoptedTypeMismatch,
        ambiguous: result.ambiguous.length,
        activated: result.activated,
        pendingForPapers: result.pendingForPapers,
        showcases: result.showcases,
        addresses: result.addresses,
        skipped: result.skipped.length,
        failed: result.failed.length,
      },
      'Padron organizations seeded',
    );

    // If every single facility fails, trigger systemic failure.
    if (attempted > 0 && result.failed.length === attempted) {
      throw new Error(
        `Fallaron las ${attempted} organizaciones del padrón; la primera: ${result.failed[0]}`,
      );
    }
    return result;
  }

  /**
   * Resolves target tenant UUID for padron facilities, either fixed or adopted from legacy records.
   * Public entrypoint shared with administrative account seeders.
   */
  async resolveIds(
    em: EntityManager,
    facilities: readonly PadronFacility[] = padronFacilities(),
  ): Promise<{
    idByCode: Map<string, string>;
    ambiguous: Set<string>;
    fixedIds: Map<string, string>;
    typeMismatch: Set<string>;
  }> {
    return resolveFacilityIds(em, facilities);
  }

  /**
   * Idempotently provisions an individual facility tenant, address, and public showcase.
   */
  private async ensureOrganization(
    row: PadronFacility,
    kind: FacilityKind,
    actor: { id: string; roles: string[] },
    known: KnownState,
    demoShowcases: boolean,
    result: PadronOrganizationsResult,
  ): Promise<void> {
    if (known.ambiguous.has(row.code)) {
      result.ambiguous.push(
        `${row.code}: más de una organización ${LEGACY_CODE_PREFIX}* en el mismo municipio con el mismo nombre`,
      );
      return;
    }

    // Adopted legacy records are counted and left untouched.
    if (known.adopted.has(row.code)) {
      result.adopted++;
      if (known.typeMismatch.has(row.code)) result.adoptedTypeMismatch++;
      return;
    }

    const tenantId = known.idByCode.get(row.code) ?? padronTenantId(row.code);
    let status = known.tenants.get(tenantId);

    if (status === undefined) {
      await runWithTenant(SEED.tenantId, () =>
        this.tenants.provision(
          {
            code: row.code,
            legalName: (row.razonSocial ?? row.nombre).slice(0, 300),
            tradeName: row.nombre.slice(0, 300),
            ownerUserId: actor.id,
            tenantType: kind.tenantType,
            countryConceptId: CONCEPTS.COUNTRY_BO,
            jurisdictionConceptId: CONCEPTS.JURISDICTION_BO,
            timeZone: 'America/La_Paz',
          },
          actor,
          {
            tenantId,
            ownerMembershipId: padronOwnerMembershipId(row.code),
          },
        ),
      );
      status = DIR.TENANT_PENDING;
      known.tenants.set(tenantId, status);
      result.created++;
    } else {
      result.existing++;
    }

    if (!known.withAddress.has(tenantId)) {
      if (await createFacilityAddress(this.addresses, tenantId, row, actor)) {
        known.withAddress.add(tenantId);
        result.addresses++;
      }
    }

    if (kind.needsPapers) {
      result.pendingForPapers++;
      // Regulated entities stay pending without showcase unless running under demo gates.
      if (
        !demoShowcases ||
        (status !== DIR.TENANT_PENDING && status !== CONCEPTS.TENANT_ACTIVE)
      )
        return;
      await completeFacilityShowcase(
        this.projection,
        this.tenants,
        this.orm,
        tenantId,
        row,
        kind,
        actor,
        known,
        result,
      );
      return;
    }

    if (status === DIR.TENANT_PENDING) {
      await activateFacilityTenant(this.orm, tenantId, actor);
      status = CONCEPTS.TENANT_ACTIVE;
      known.tenants.set(tenantId, status);
      result.activated++;
    }

    // Only active organizations receive a public showcase.
    if (status !== CONCEPTS.TENANT_ACTIVE) return;
    await completeFacilityShowcase(
      this.projection,
      this.tenants,
      this.orm,
      tenantId,
      row,
      kind,
      actor,
      known,
      result,
    );
  }
}
