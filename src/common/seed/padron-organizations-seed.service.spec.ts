import { describe, it, expect, jest } from '@jest/globals';
import {
  PadronOrganizationsSeedService,
  padronOwnerMembershipId,
  padronTenantId,
  type PadronFacility,
} from './padron-organizations-seed.service';
import { SEED_ACTOR_ID } from './seed-actor';
import { CONCEPTS } from '../constants/concepts';
import { Tenants } from '../../modules/directory/entities';
import { PublicProfiles } from '../../modules/community/entities';
import { Addresses } from '../../modules/common/entities';
import {
  DIR,
  TENANT_TYPE_CONCEPT_BY_CODE,
} from '../../modules/directory/directory.concepts';
import {
  BO_MUNICIPALITIES,
  boMunicipalityConceptId,
} from './bo-geography.catalog';
import { COMM } from '../../modules/community/community.concepts';
import facilitiesDataset from './data/bolivia/health-facilities.dataset.json';

const ALL = facilitiesDataset.datos as unknown as PadronFacility[];
const PADRON = ALL.filter((row) => row.naturaleza !== 'RED_ASEGURADORA');
const NEEDS_PAPERS = PADRON.filter(
  (row) => row.tipo === 'FARMACIA' || row.tipo === 'LABORATORIO',
);

/** Código del INE de cada municipio de Santa Cruz, por su nombre en mayúsculas. */
const SANTA_CRUZ_INE_BY_NAME = new Map(
  BO_MUNICIPALITIES.filter((m) => m.department === 'SC').map((m) => [
    m.name.toUpperCase(),
    m.ine,
  ]),
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
  addresses?: {
    ownerId: string;
    city?: string;
    municipalityConceptId?: string;
  }[];
}

function build(existing: Existing = {}) {
  /** Las fichas que la activación pudo tocar, por id. */
  const store = new Map<string, any>(
    [...(existing.tenants ?? []), ...(existing.legacy ?? [])].map((t) => [
      t.id,
      { ...t },
    ]),
  );
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
      if (entity === Addresses) {
        const owners: string[] | undefined = where?.ownerId?.$in;
        return Promise.resolve(
          (existing.addresses ?? []).filter(
            (a) => !owners || owners.includes(a.ownerId),
          ),
        );
      }
      return Promise.resolve([]);
    }),
    create: jest.fn(),
    // La activación: cambia el estado de la ficha y nada más.
    findOneOrFail: jest.fn((_entity: unknown, where: any) => {
      if (!store.has(where.id)) {
        store.set(where.id, {
          id: where.id,
          statusConceptId: DIR.TENANT_PENDING,
        });
      }
      return Promise.resolve(store.get(where.id));
    }),
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
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const service = new PadronOrganizationsSeedService(
    orm as never,
    tenants as never,
    addresses as never,
    projection as never,
    logger as never,
  );
  return { service, em, tenants, addresses, projection, store, logger };
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
    // Nadie comprobó estas organizaciones: el sello no se pone nunca.
    expect(tenants.verify).not.toHaveBeenCalled();
  });

  it('deja activas, sin verificar y con vitrina, las fichas que no necesitan papeles', async () => {
    const { service, tenants, projection, store } = build();

    const result = await service.run(true, false);

    const withoutPapers = PADRON.length - NEEDS_PAPERS.length;
    expect(result.activated).toBe(withoutPapers);
    expect(result.showcases).toBe(withoutPapers);
    expect(projection.projectOrganization).toHaveBeenCalledTimes(withoutPapers);
    expect(tenants.updatePublicProfile).toHaveBeenCalledTimes(withoutPapers);
    const clinic = PADRON.find((r) => r.tipo === 'CLINICA_PRIVADA')!;
    const card = store.get(padronTenantId(clinic.code));
    expect(card.statusConceptId).toBe(CONCEPTS.TENANT_ACTIVE);
    // El estado de verificación queda como lo dejó el alta.
    expect(card.verificationStatusConceptId).toBeUndefined();
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

  it('una ficha pendiente y ya existente se activa en la pasada siguiente, sin verificarla', async () => {
    const row = PADRON.find((r) => r.tipo === 'CLINICA_PRIVADA')!;
    const { service, tenants, store } = build({
      tenants: [
        { id: padronTenantId(row.code), statusConceptId: DIR.TENANT_PENDING },
      ],
    });

    const result = await service.run(true, false);

    expect(result.existing).toBe(1);
    expect(store.get(padronTenantId(row.code)).statusConceptId).toBe(
      CONCEPTS.TENANT_ACTIVE,
    );
    expect(tenants.verify).not.toHaveBeenCalled();
  });

  it('una ficha suspendida no se reactiva ni recibe vitrina', async () => {
    const row = PADRON.find((r) => r.tipo === 'CLINICA_PRIVADA')!;
    const id = padronTenantId(row.code);
    const { service, projection, tenants, store } = build({
      tenants: [{ id, statusConceptId: 'suspended' }],
    });

    await service.run(true, false);

    expect(store.get(id).statusConceptId).toBe('suspended');
    const projected = callsOf(projection.projectOrganization).map(
      ([, data]) => data.targetId,
    );
    expect(projected).not.toContain(id);
    expect(callsOf(tenants.updatePublicProfile).map(([t]) => t)).not.toContain(
      id,
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
    const projected = new Set(
      callsOf(projection.projectOrganization).map(([, data]) => data.targetId),
    );
    for (const row of NEEDS_PAPERS) {
      expect(projected.has(padronTenantId(row.code))).toBe(false);
    }
  });

  it('en demostración, farmacias y laboratorios tienen vitrina pero siguen sin sello', async () => {
    const { service, tenants, projection } = build();

    await service.run(true, true);

    const projected = new Set(
      callsOf(projection.projectOrganization).map(([, data]) => data.targetId),
    );
    expect(projected.size).toBe(PADRON.length);
    for (const row of NEEDS_PAPERS) {
      expect(projected.has(padronTenantId(row.code))).toBe(true);
    }
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

  it('registra cada fila fallida con error y el conteo', async () => {
    const { service, tenants, logger } = build();
    tenants.provision.mockImplementationOnce(() =>
      Promise.reject(new Error('boom')),
    );

    await service.run(true, false);

    expect(logger.error).toHaveBeenCalledTimes(1);
    const summary = callsOf(logger.info as never).pop()![0];
    expect(summary.failed).toBe(1);
  });

  it('si fallan todas las filas es una falla sistémica y el paso falla', async () => {
    const { service, tenants } = build();
    tenants.provision.mockImplementation(() =>
      Promise.reject(new Error('sin base')),
    );

    await expect(service.run(true, false)).rejects.toThrow(
      /Fallaron las 523.*sin base/,
    );
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
    const inMunicipality = (ownerId: string, city: string) => ({
      ownerId,
      city,
    });
    const created = (tenants: { provision: jest.Mock<any> }) =>
      callsOf(tenants.provision).map(([dto]) => dto.code);

    it('toma como propia una CARGA_* con el mismo nombre, sin crear un duplicado ni escribirle nada', async () => {
      const { service, tenants, addresses, projection, store } = build({
        legacy: [legacyClinic('legacy-1', 'CARGA_CLINICA_001')],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(1);
      expect(result.adoptedTypeMismatch).toBe(0);
      expect(result.created).toBe(522);
      expect(created(tenants)).not.toContain(clinic.code);
      // Nada de la adoptada se reescribe: ni dirección, ni vitrina, ni estado.
      const owners = callsOf(addresses.create).map(([dto]) => dto.ownerId);
      expect(owners).not.toContain('legacy-1');
      expect(owners).not.toContain(padronTenantId(clinic.code));
      const projected = callsOf(projection.projectOrganization).map(
        ([, data]) => data.targetId,
      );
      expect(projected).not.toContain('legacy-1');
      const profiled = callsOf(tenants.updatePublicProfile).map(([id]) => id);
      expect(profiled).not.toContain('legacy-1');
      expect(store.get('legacy-1').statusConceptId).toBe('active');
    });

    it.each(['active', DIR.TENANT_PENDING, 'suspended'])(
      'una adoptada en estado %s no se verifica ni se reescribe',
      async (status) => {
        const { service, tenants, projection, store } = build({
          legacy: [
            {
              ...legacyClinic('legacy-1', 'CARGA_CLINICA_001'),
              statusConceptId: status,
            },
          ],
        });

        await service.run(true, true);

        expect(tenants.verify).not.toHaveBeenCalled();
        expect(store.get('legacy-1').statusConceptId).toBe(status);
        const projected = callsOf(projection.projectOrganization).map(
          ([, data]) => data.targetId,
        );
        expect(projected).not.toContain('legacy-1');
        const profiled = callsOf(tenants.updatePublicProfile).map(([id]) => id);
        expect(profiled).not.toContain('legacy-1');
      },
    );

    it('un nombre igual con otro tipo se adopta igual, sin cambiarle el tipo, y se cuenta', async () => {
      const { service, tenants, store } = build({
        legacy: [
          {
            ...legacyClinic('legacy-1', 'CARGA_FARMACIA_001'),
            tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.PHARMACY,
          },
        ],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(1);
      expect(result.adoptedTypeMismatch).toBe(1);
      expect(result.created).toBe(522);
      expect(created(tenants)).not.toContain(clinic.code);
      expect(store.get('legacy-1').tenantTypeConceptId).toBe(
        TENANT_TYPE_CONCEPT_BY_CODE.PHARMACY,
      );
    });

    it('una candidata de otro municipio no se adopta', async () => {
      const { service } = build({
        legacy: [legacyClinic('legacy-1', 'CARGA_CLINICA_001')],
        addresses: [inMunicipality('legacy-1', 'Un municipio lejano')],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(0);
      expect(result.created).toBe(523);
    });

    it('con más de una candidata el municipio desempata', async () => {
      const { service, tenants } = build({
        legacy: [
          legacyClinic('legacy-1', 'CARGA_CLINICA_001'),
          legacyClinic('legacy-2', 'CARGA_CLINICA_002'),
        ],
        addresses: [
          inMunicipality('legacy-1', 'Un municipio lejano'),
          inMunicipality('legacy-2', clinic.municipio),
        ],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(1);
      expect(result.ambiguous).toEqual([]);
      expect(created(tenants)).not.toContain(clinic.code);
    });

    it('el municipio también se reconoce por su concepto de geografía', async () => {
      const ine = SANTA_CRUZ_INE_BY_NAME.get(
        clinic.municipio
          .toUpperCase()
          .replace(/\(.*?\)/g, '')
          .trim(),
      );
      expect(ine).toBeDefined();
      const { service } = build({
        legacy: [
          legacyClinic('legacy-1', 'CARGA_CLINICA_001'),
          legacyClinic('legacy-2', 'CARGA_CLINICA_002'),
        ],
        addresses: [
          inMunicipality('legacy-1', 'Un municipio lejano'),
          {
            ownerId: 'legacy-2',
            municipalityConceptId: boMunicipalityConceptId(ine!),
          },
        ],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(1);
      expect(result.ambiguous).toEqual([]);
    });

    it('con más de una candidata en el mismo municipio no elige ninguna ni crea otra, y la informa', async () => {
      const { service, tenants } = build({
        legacy: [
          legacyClinic('legacy-1', 'CARGA_CLINICA_001'),
          legacyClinic('legacy-2', 'CARGA_CLINICA_002'),
        ],
        addresses: [
          inMunicipality('legacy-1', clinic.municipio),
          inMunicipality('legacy-2', clinic.municipio),
        ],
      });

      const result = await service.run(true, false);

      expect(result.adopted).toBe(0);
      expect(result.ambiguous).toHaveLength(1);
      expect(result.ambiguous[0]).toContain(clinic.code);
      expect(created(tenants)).not.toContain(clinic.code);
    });
  });
});
