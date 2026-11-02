import { type MikroORM } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../constants/concepts';
import { touch } from '../../persistence/audit-fields';
import { runWithTenant } from '../../tenant/tenant-context';
import { AddressesService } from '../../../modules/common/services';
import { OwnerType } from '../../../modules/common/dto';
import { COMM } from '../../../modules/community/community.concepts';
import { PublicProfileProjectionService } from '../../../modules/community/services';
import { Tenants } from '../../../modules/directory/entities';
import { DIR } from '../../../modules/directory/directory.concepts';
import { DirectoryTenantsService } from '../../../modules/directory/services';
import {
  boDepartmentConceptId,
  boMunicipalityConceptId,
} from '../bo-geography.catalog';
import {
  normalizeName,
  readableSource,
  SANTA_CRUZ_MUNICIPALITY_BY_NAME,
  titleCase,
  type FacilityKind,
  type PadronFacility,
  type PadronOrganizationsResult,
} from './padron-facility.types';
import type { KnownState } from './padron-legacy-adoption.helper';

/**
 * Creates postal address for a facility when real address line or valid GPS coordinates exist.
 * Skips centroid fallback coordinates ('precision: ciudad') to avoid stacking on maps.
 */
export async function createFacilityAddress(
  addresses: AddressesService,
  tenantId: string,
  row: PadronFacility,
  actor: { id: string; roles: string[] },
): Promise<boolean> {
  const hasPoint =
    row.lat !== null && row.lng !== null && row.precision !== 'ciudad';
  if (!row.direccion && !hasPoint) return false;

  const ine = SANTA_CRUZ_MUNICIPALITY_BY_NAME.get(normalizeName(row.municipio));
  await addresses.create(
    {
      ownerType: OwnerType.TENANT,
      ownerId: tenantId,
      lines: [row.direccion ?? titleCase(row.municipio)],
      city: titleCase(row.municipio.replace(/\(.*?\)/g, '').trim()),
      municipalityConceptId: ine ? boMunicipalityConceptId(ine) : undefined,
      administrativeAreaConceptId:
        row.departamento === 'SC' ? boDepartmentConceptId('SC') : undefined,
      ...(hasPoint ? { latitude: row.lat, longitude: row.lng } : {}),
    },
    actor,
  );
  return true;
}

/**
 * Transitions a pending organization into active status without adding verified credentials.
 * This ensures real establishments are discoverable while remaining officially unverified.
 */
export async function activateFacilityTenant(
  orm: MikroORM,
  tenantId: string,
  actor: { id: string },
): Promise<void> {
  await runWithTenant(SEED.tenantId, () =>
    orm.em.fork().transactional(async (tx) => {
      const tenant = await tx.findOneOrFail(Tenants, { id: tenantId });
      if (tenant.statusConceptId !== DIR.TENANT_PENDING) return;
      tenant.statusConceptId = CONCEPTS.TENANT_ACTIVE;
      touch(tenant, actor.id);
    }),
  );
}

/**
 * Configures the initial public showcase (headline, bio, provenance disclaimer) for the facility.
 */
export async function completeFacilityShowcase(
  projection: PublicProfileProjectionService,
  tenants: DirectoryTenantsService,
  orm: MikroORM,
  tenantId: string,
  row: PadronFacility,
  kind: FacilityKind,
  actor: { id: string; roles: string[] },
  known: KnownState,
  result: PadronOrganizationsResult,
): Promise<void> {
  if (known.showcaseHeadlines.get(tenantId)) return;
  if (!known.showcaseHeadlines.has(tenantId)) {
    await orm.em.fork().transactional((tx) =>
      projection.projectOrganization(tx, {
        tenantId,
        targetId: tenantId,
        slug: `organization-${tenantId}`,
        displayName: row.nombre.slice(0, 200),
        actorUserId: actor.id,
        targetTypeConceptId:
          kind.tenantType === 'PHARMACY'
            ? COMM.PROFILE_TARGET_PHARMACY
            : kind.tenantType === 'DIAGNOSTIC_CENTER'
              ? COMM.PROFILE_TARGET_DIAGNOSTIC_UNIT
              : COMM.PROFILE_TARGET_ORGANIZATION,
      }),
    );
    known.showcaseHeadlines.set(tenantId, undefined);
  }
  const municipality = titleCase(row.municipio.replace(/\(.*?\)/g, '').trim());
  const lines = [
    'Ficha del padrón público de establecimientos de salud, no reclamada. ' +
      'La información no fue verificada por la organización.',
    `Fuente: ${readableSource(row.source_file)}.`,
  ];
  if (row.direccion) lines.push(`Dirección: ${row.direccion}.`);
  if (row.telefonos.length) {
    lines.push(`Teléfono: ${row.telefonos.join(' / ')}.`);
  }
  await runWithTenant(SEED.tenantId, () =>
    tenants.updatePublicProfile(
      tenantId,
      {
        displayName: row.nombre.slice(0, 200),
        headline: `${kind.label} · ${municipality}`.slice(0, 200),
        biography: lines.join('\n').slice(0, 5000),
      },
      actor,
    ),
  );
  known.showcaseHeadlines.set(tenantId, 'listo');
  result.showcases++;
}
