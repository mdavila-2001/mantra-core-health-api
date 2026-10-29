import { describe, it, expect, jest } from '@jest/globals';
import { BoliviaInsuranceSeedService } from './bolivia-insurance-seed.service';
import { SEED_ACTOR_ID } from './seed-actor';
import { COMM } from '../../modules/community/community.concepts';
import { BOLIVIA_CARRIERS } from './bolivia-insurance.catalog';

/** Cuántas aseguradoras siembra el paso: las tres listas del catálogo. */
function carrierCount(): number {
  const service = build().service as any;
  return service.allCarriers().length;
}

function build(profiled: string[] = []) {
  const em: any = {
    find: jest.fn(() =>
      Promise.resolve(profiled.map((targetId) => ({ targetId }))),
    ),
    findOne: jest.fn(() => Promise.resolve({ id: SEED_ACTOR_ID })),
    create: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
    transactional: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(em)),
    fork: () => em,
  };
  const projection = {
    projectOrganization: jest.fn((..._args: unknown[]) =>
      Promise.resolve('profile-1'),
    ),
    updateOrganizationShowcase: jest.fn((..._args: unknown[]) =>
      Promise.resolve('profile-1'),
    ),
  };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const service = new BoliviaInsuranceSeedService(
    { em: { fork: () => em } } as never,
    logger as never,
    projection as never,
  );
  return { service, em, projection };
}

describe('BoliviaInsuranceSeedService: vitrinas', () => {
  it('proyecta la vitrina de toda aseguradora como INSURER, con el actor semilla', async () => {
    const { service, em, projection } = build();

    const created = await (service as any).seedShowcases(em);

    expect(created).toBe(carrierCount());
    expect(created).toBeGreaterThanOrEqual(BOLIVIA_CARRIERS.length);
    const calls = projection.projectOrganization.mock.calls as any[][];
    expect(calls).toHaveLength(created);
    for (const [, data] of calls) {
      expect(data.targetTypeConceptId).toBe(COMM.PROFILE_TARGET_INSURER);
      expect(data.actorUserId).toBe(SEED_ACTOR_ID);
      // La vitrina es de la propia organización.
      expect(data.tenantId).toBe(data.targetId);
      expect(data.slug).toBe(`organization-${data.targetId}`);
    }
  });

  it('la presentación aclara que la compañía no verificó la ficha', async () => {
    const { service, em, projection } = build();

    await (service as any).seedShowcases(em);

    const [, update] = projection.updateOrganizationShowcase.mock
      .calls[0] as any[];
    expect(update.biography).toContain('no fue verificada por la compañía');
  });

  it('completa solo las que no tienen vitrina: la segunda corrida no hace nada', async () => {
    const first = build();
    await (first.service as any).seedShowcases(first.em);
    const projected = (
      first.projection.projectOrganization.mock.calls as any[][]
    ).map(([, data]) => data.targetId as string);

    const second = build(projected);
    const created = await (second.service as any).seedShowcases(second.em);

    expect(created).toBe(0);
    expect(second.projection.projectOrganization).not.toHaveBeenCalled();
  });

  it('con vitrinas a medias proyecta únicamente las que faltan', async () => {
    const first = build();
    await (first.service as any).seedShowcases(first.em);
    const projected = (
      first.projection.projectOrganization.mock.calls as any[][]
    ).map(([, data]) => data.targetId as string);

    const partial = build(projected.slice(2));
    const created = await (partial.service as any).seedShowcases(partial.em);

    expect(created).toBe(2);
  });
});
