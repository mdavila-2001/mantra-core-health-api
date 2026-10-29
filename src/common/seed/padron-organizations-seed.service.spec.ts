import { describe, it, expect, jest } from '@jest/globals';
import {
  PadronOrganizationsSeedService,
  padronOwnerMembershipId,
  padronTenantId,
  type PadronFacility,
} from './padron-organizations-seed.service';
import { SEED_ACTOR_ID } from './seed-actor';
import { PreconditionFailedException } from '../errors/domain.exception';
import { Tenants } from '../../modules/directory/entities';
import { PublicProfiles } from '../../modules/community/entities';
import { Addresses } from '../../modules/common/entities';
import {
  DIR,
  TENANT_TYPE_CONCEPT_BY_CODE,
} from '../../modules/directory/directory.concepts';
import { COMM } from '../../modules/community/community.concepts';
import facilitiesDataset from './data/bolivia/health-facilities.dataset.json';

const ALL = facilitiesDataset.datos as unknown as PadronFacility[];
const PADRON = ALL.filter((row) => row.naturaleza !== 'RED_ASEGURADORA');
const NEEDS_PAPERS = PADRON.filter(
  (row) => row.tipo === 'FARMACIA' || row.tipo === 'LABORATORIO',
);

interface Existing {
  tenants?: { id: string; statusConceptId: string }[];
  /** Organizaciones de la carga anterior (`CARGA_*`). */
  legacy?: {
    id: string;
    code: string;
    legalName: string;
    tradeName?: string;
    tenantTypeConceptId: string;
    statusConceptId: string;
  }[];
  profiles?: { targetId: string; headline?: string }[];
  addresses?: { ownerId: string }[];
}

function build(existing: Existing = {}) {
  const em: any = {
    findOne: jest.fn(() => Promise.resolve({ id: SEED_ACTOR_ID })),
    find: jest.fn((entity: unknown, where: any) => {
      if (entity === Tenants) {
        const legacy = existing.legacy ?? [];
        if (where?.code?.$like) return Promise.resolve(legacy);
        if (where?.id?.$in) {
          const ids: string[] = where.id.$in;
          return Promise.resolve(
            [...(existing.tenants ?? []), ...legacy].filter((t) =>
              ids.includes(t.id),
            ),
          );
        }
        return Promise.resolve(existing.tenants ?? []);
      }
      if (entity === PublicProfiles)
        return Promise.resolve(existing.profiles ?? []);
      if (entity === Addresses)
        return Promise.resolve(existing.addresses ?? []);
      return Promise.resolve([]);
    }),
    create: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
    transactional: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(em)),
    fork: () => em,
  };
  const orm = { em: { fork: () => em } };
  const tenants = {
    provision: jest.fn((..._args: unknown[]) => Promise.resolve({})),
    verify: jest.fn((..._args: unknown[]) => Promise.resolve({})),
    updatePublicProfile: jest.fn((..._args: unknown[]) => Promise.resolve({})),
  };
  const addresses = {
    create: jest.fn((..._args: unknown[]) => Promise.resolve({})),
  };
  const projection = {
    projectOrganization: jest.fn((..._args: unknown[]) =>
      Promise.resolve('profile-1'),
    ),
  };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const service = new PadronOrganizationsSeedService(
    orm as never,
    tenants as never,
    addresses as never,
    projection as never,
    logger as never,
  );
  return { service, em, tenants, addresses, projection };
}

/** Argumentos de la i-ésima llamada de un doble. */
function callsOf(mock: jest.Mock<(...args: unknown[]) => unknown>): any[][] {
  return mock.mock.calls as any[][];
}

describe('PadronOrganizationsSeedService', () => {
  it('el dataset trae las 523 organizaciones del padrón, sin los consultorios de red', () => {
    expect(PADRON).toHaveLength(523);
    expect(ALL.length - PADRON.length).toBe(119);
  });

  it('apagado no toca nada', async () => {
    const { service, tenants, em } = build();

    const result = await service.run(false, false);

    expect(result.reason).toBe('not-configured');
    expect(tenants.provision).not.toHaveBeenCalled();
    expect(em.find).not.toHaveBeenCalled();
  });

  it('primera corrida: 523 altas con id fijo y dueño el actor semilla', async () => {
    const { service, tenants, em } = build();

    const result = await service.run(true, false);

    expect(result.created).toBe(523);
    expect(result.existing).toBe(0);
    expect(result.failed).toEqual([]);
    expect(tenants.provision).toHaveBeenCalledTimes(523);

    const [dto, actor, fixedIds] = callsOf(tenants.provision)[0];
    expect(dto.ownerUserId).toBe(SEED_ACTOR_ID);
    expect(actor.id).toBe(SEED_ACTOR_ID);
    expect(fixedIds.tenantId).toBe(padronTenantId(dto.code));
    expect(fixedIds.ownerMembershipId).toBe(padronOwnerMembershipId(dto.code));
    // Ninguna escritura salvo la del actor semilla pasa por el EntityManager.
    expect(em.create).not.toHaveBeenCalled();
  });

  it('mapea cada clase de establecimiento a su tipo de organización', async () => {
    const { service, tenants } = build();

    await service.run(true, false);

    const typeByCode = new Map(
      callsOf(tenants.provision).map(([dto]) => [dto.code, dto.tenantType]),
    );
    const expected: Record<string, string> = {
      CLINICA_PRIVADA: 'CLINIC',
      HOSPITAL: 'HOSPITAL',
      CAJA_SALUD: 'HOSPITAL',
      CENTRO_SALUD: 'HEALTH_OTHER',
      LABORATORIO: 'DIAGNOSTIC_CENTER',
      IMAGEN: 'DIAGNOSTIC_CENTER',
      FARMACIA: 'PHARMACY',
    };
    for (const row of PADRON) {
      expect(typeByCode.get(row.code)).toBe(expected[row.tipo]);
    }
  });

  it('segunda corrida: 0 altas, 523 existentes y ninguna escritura', async () => {
    const { service, tenants } = build({
      tenants: PADRON.map((row) => ({
        id: padronTenantId(row.code),
        statusConceptId: 'active',
      })),
      profiles: PADRON.map((row) => ({
        targetId: padronTenantId(row.code),
        headline: 'ya completa',
      })),
      addresses: PADRON.map((row) => ({ ownerId: padronTenantId(row.code) })),
    });

    const result = await service.run(true, false);

    expect(result.created).toBe(0);
    expect(result.existing).toBe(523);
    expect(tenants.provision).not.toHaveBeenCalled();
    expect(tenants.verify).not.toHaveBeenCalled();
    expect(tenants.updatePublicProfile).not.toHaveBeenCalled();
  });

  it('una ficha pendiente y ya existente se verifica en la pasada siguiente', async () => {
    const row = PADRON.find((r) => r.tipo === 'CLINICA_PRIVADA')!;
    const { service, tenants } = build({
      tenants: [
        { id: padronTenantId(row.code), statusConceptId: DIR.TENANT_PENDING },
      ],
    });

    const result = await service.run(true, false);

    expect(result.existing).toBe(1);
    expect(callsOf(tenants.verify).map(([id]) => id)).toContain(
      padronTenantId(row.code),
    );
  });

  it('farmacias y laboratorios sin papeles: ni sello ni vitrina fuera de demostración', async () => {
    const { service, tenants, projection } = build();

    const result = await service.run(true, false);

    const verifiedIds = new Set(callsOf(tenants.verify).map(([id]) => id));
    const profiled = new Set(
      callsOf(tenants.updatePublicProfile).map(([id]) => id),
    );
    for (const row of NEEDS_PAPERS) {
      expect(verifiedIds.has(padronTenantId(row.code))).toBe(false);
      expect(profiled.has(padronTenantId(row.code))).toBe(false);
    }
    expect(result.pendingForPapers).toBe(NEEDS_PAPERS.length);
    expect(projection.projectOrganization).not.toHaveBeenCalled();
  });

  it('en demostración, farmacias y laboratorios tienen vitrina pero siguen sin sello', async () => {
    const { service, tenants, projection } = build();

    await service.run(true, true);

    expect(projection.projectOrganization).toHaveBeenCalledTimes(
      NEEDS_PAPERS.length,
    );
    const verifiedIds = new Set(callsOf(tenants.verify).map(([id]) => id));
    for (const row of NEEDS_PAPERS) {
      expect(verifiedIds.has(padronTenantId(row.code))).toBe(false);
    }
    const pharmacy = PADRON.find((row) => row.tipo === 'FARMACIA')!;
    const call = callsOf(projection.projectOrganization).find(
      ([, data]) => data.targetId === padronTenantId(pharmacy.code),
    )!;
    expect(call[1].targetTypeConceptId).toBe(COMM.PROFILE_TARGET_PHARMACY);
    // La vitrina es de la propia organización, no de la plataforma.
    expect(call[1].tenantId).toBe(padronTenantId(pharmacy.code));
  });

  it('una regla de verify que no se cumple deja la ficha pendiente, no fallida', async () => {
    const { service, tenants } = build();
    tenants.verify.mockImplementation(() =>
      Promise.reject(new PreconditionFailedException('faltan papeles')),
    );

    const result = await service.run(true, false);

    expect(result.failed).toEqual([]);
    expect(result.verified).toBe(0);
  });

  it('un error inesperado de una organización no detiene a las demás', async () => {
    const { service, tenants } = build();
    tenants.provision.mockImplementationOnce(() =>
      Promise.reject(new Error('boom')),
    );

    const result = await service.run(true, false);

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toContain('boom');
    expect(result.created).toBe(522);
  });

  it('la dirección lleva coordenadas solo cuando el dataset las trae y no son del centro de la ciudad', async () => {
    const { service, addresses } = build();

    await service.run(true, false);

    const byOwner = new Map(
      callsOf(addresses.create).map(([dto]) => [dto.ownerId, dto]),
    );
    for (const row of PADRON) {
      const dto = byOwner.get(padronTenantId(row.code));
      const exact =
        row.lat !== null && row.lng !== null && row.precision !== 'ciudad';
      if (exact) {
        expect(dto.latitude).toBe(row.lat);
        expect(dto.longitude).toBe(row.lng);
      } else if (dto) {
        expect(dto.latitude).toBeUndefined();
        expect(dto.longitude).toBeUndefined();
      }
      if (!row.direccion && !exact) expect(dto).toBeUndefined();
    }
  });

  it('la ficha dice que viene del padrón público y no fue verificada por la organización', async () => {
    const { service, tenants } = build();

    await service.run(true, false);

    const [, dto] = callsOf(tenants.updatePublicProfile)[0];
    expect(dto.biography).toContain('no fue verificada por la organización');
    expect(dto.biography).toContain('Fuente:');
  });

  describe('adopción de la carga anterior', () => {
    const clinic = PADRON.find((row) => row.tipo === 'CLINICA_PRIVADA')!;
    const legacyClinic = (id: string, code: string) => ({
      id,
      code,
      legalName: clinic.razonSocial ?? clinic.nombre,
      tradeName: clinic.nombre,
      tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.CLINIC,
      statusConceptId: 'active',
    });

    it('toma como propia una CARGA_* con el mismo nombre y tipo, sin crear un duplicado', async () => {
      const { service, tenants, addresses } = build({
        legacy: [legacyClinic('legacy-1', 'CARGA_CLINICA_001')],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(1);
      expect(result.created).toBe(522);
      const created = callsOf(tenants.provision).map(([dto]) => dto.code);
      expect(created).not.toContain(clinic.code);
      // Las escrituras de la ficha apuntan a la organización adoptada.
      const owners = callsOf(addresses.create).map(([dto]) => dto.ownerId);
      expect(owners).not.toContain(padronTenantId(clinic.code));
    });

    it('con más de una candidata no elige ninguna ni crea otra, y la informa', async () => {
      const { service, tenants } = build({
        legacy: [
          legacyClinic('legacy-1', 'CARGA_CLINICA_001'),
          legacyClinic('legacy-2', 'CARGA_CLINICA_002'),
        ],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(0);
      expect(result.ambiguous).toHaveLength(1);
      expect(result.ambiguous[0]).toContain(clinic.code);
      const created = callsOf(tenants.provision).map(([dto]) => dto.code);
      expect(created).not.toContain(clinic.code);
    });

    it('un nombre igual con otro tipo no se adopta', async () => {
      const { service, tenants } = build({
        legacy: [
          {
            ...legacyClinic('legacy-1', 'CARGA_FARMACIA_001'),
            tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.PHARMACY,
          },
        ],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(0);
      expect(result.created).toBe(523);
    });

    it('no toca la organización adoptada: ni la renombra ni la verifica de nuevo', async () => {
      const { service, tenants } = build({
        legacy: [legacyClinic('legacy-1', 'CARGA_CLINICA_001')],
      });

      await service.run(true, false);

      const verified = callsOf(tenants.verify).map(([id]) => id);
      expect(verified).not.toContain('legacy-1');
    });
  });
});
