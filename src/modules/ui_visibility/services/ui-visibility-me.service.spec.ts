import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { InMemoryUiVisibilityStore } from '../testing/in-memory-ui-visibility.store';
import {
  UiVisibilityMeService,
  pickVisibilityTenant,
} from './ui-visibility-me.service';

const T1 = '33333333-3333-4333-8333-333333333333';
const T2 = '44444444-4444-4444-8444-444444444444';
const ME = '0a000000-0000-4000-8000-000000000001';
const OTHER = '0a000000-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-31T12:00:00.000Z');

const user = (over: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: ME,
  roles: ['USER'],
  tenantIds: [T1],
  ...over,
});

describe('pickVisibilityTenant', () => {
  it('sin cabecera y con una sola membresía: esa', () => {
    expect(pickVisibilityTenant(undefined, user())).toBe(T1);
  });

  it('sin cabecera y con varias o ninguna membresía: null (no se adivina)', () => {
    expect(
      pickVisibilityTenant(undefined, user({ tenantIds: [T1, T2] })),
    ).toBeNull();
    expect(pickVisibilityTenant(undefined, user({ tenantIds: [] }))).toBeNull();
    expect(
      pickVisibilityTenant(undefined, user({ tenantIds: undefined })),
    ).toBeNull();
  });

  it('cabecera que es una membresía: vale', () => {
    expect(pickVisibilityTenant(` ${T2} `, user({ tenantIds: [T1, T2] }))).toBe(
      T2,
    );
  });

  it('cabecera de una organización ajena: se ignora (nadie pide «como si» fuera de otra)', () => {
    expect(pickVisibilityTenant(T2, user())).toBeNull();
  });

  it('cabecera mal formada: se ignora', () => {
    expect(pickVisibilityTenant('no-es-uuid', user())).toBeNull();
    expect(pickVisibilityTenant("'; DROP TABLE x;--", user())).toBeNull();
  });

  it('un SUPERADMIN de plataforma puede elegir cualquier organización', () => {
    expect(
      pickVisibilityTenant(T2, user({ roles: ['SUPERADMIN'], tenantIds: [] })),
    ).toBe(T2);
  });

  it('un SUPERADMIN acotado a un tenant NO es de plataforma', () => {
    const scoped = user({
      roles: ['SUPERADMIN'],
      scopedRoles: { [T1]: ['SUPERADMIN'] },
    });
    expect(pickVisibilityTenant(T2, scoped)).toBeNull();
  });
});

describe('UiVisibilityMeService.resolveMine', () => {
  let store: InMemoryUiVisibilityStore;
  let svc: UiVisibilityMeService;

  const element = (
    key: string,
    parentKey: string | null = null,
    defaultVisible = true,
  ) => {
    const parent = parentKey
      ? [...store.elements.values()].find((e) => e.key === parentKey)
      : undefined;
    return store.insertElement(
      {
        key,
        kind: 'ACTION',
        moduleCode: key.split('.')[0],
        parentElementId: parent?.id ?? null,
        label: key,
        description: null,
        defaultVisible,
        source: 'CODE',
      },
      ME,
    );
  };
  const rule = async (
    key: string,
    effect: 'SHOW' | 'HIDE',
    subjectType: 'USER' | 'TENANT' | 'ROLE' | 'ORG_TYPE' | 'ALL',
    subjectId: string | null,
    extra: {
      scopeTenantId?: string | null;
      validTo?: Date | null;
      validFrom?: Date | null;
    } = {},
  ) => {
    const el = [...store.elements.values()].find((e) => e.key === key)!;
    return store.insertRule(
      {
        elementId: el.id,
        effect,
        subjectType,
        subjectId,
        scopeTenantId: extra.scopeTenantId ?? null,
        validFrom: extra.validFrom ?? null,
        validTo: extra.validTo ?? null,
        reason: 'Motivo suficientemente largo',
      },
      ME,
    );
  };

  beforeEach(() => {
    store = new InMemoryUiVisibilityStore();
    store.tenants.set(T1, { name: 'Clínica', orgType: 'CLINIC' });
    store.tenants.set(T2, { name: 'Farmacia', orgType: 'PHARMACY' });
    svc = new UiVisibilityMeService(store);
  });

  it('sin reglas ni elementos: nada oculto, versión estable y fecha de generación', async () => {
    const res = await svc.resolveMine(user(), T1, NOW);
    expect(res.hiddenKeys).toEqual([]);
    expect(res.generatedAt).toBe(NOW.toISOString());
    expect((await svc.resolveMine(user(), T1, NOW)).version).toBe(res.version);
  });

  it('devuelve sólo lo oculto, ordenado', async () => {
    await element('m.b');
    await element('m.a');
    await element('m.c');
    await rule('m.b', 'HIDE', 'ALL', null);
    await rule('m.a', 'HIDE', 'USER', ME);
    const res = await svc.resolveMine(user(), T1, NOW);
    expect(res.hiddenKeys).toEqual(['m.a', 'm.b']);
  });

  it('sólo se resuelve para quien llama: una regla de otro usuario no lo afecta', async () => {
    await element('m.a');
    await rule('m.a', 'HIDE', 'USER', OTHER);
    expect((await svc.resolveMine(user(), T1, NOW)).hiddenKeys).toEqual([]);
    expect(
      (await svc.resolveMine(user({ id: OTHER }), T1, NOW)).hiddenKeys,
    ).toEqual(['m.a']);
  });

  it('aplica reglas de TENANT y de ORG_TYPE según la organización', async () => {
    await element('m.a');
    await element('m.b');
    await rule('m.a', 'HIDE', 'TENANT', T1);
    await rule('m.b', 'HIDE', 'ORG_TYPE', 'PHARMACY');
    expect(
      (await svc.resolveMine(user({ tenantIds: [T1, T2] }), T1, NOW))
        .hiddenKeys,
    ).toEqual(['m.a']);
    expect(
      (await svc.resolveMine(user({ tenantIds: [T1, T2] }), T2, NOW))
        .hiddenKeys,
    ).toEqual(['m.b']);
  });

  it('sin organización no se aplican TENANT ni ORG_TYPE, pero sí ALL', async () => {
    await element('m.a');
    await element('m.b');
    await element('m.c');
    await rule('m.a', 'HIDE', 'TENANT', T1);
    await rule('m.b', 'HIDE', 'ORG_TYPE', 'CLINIC');
    await rule('m.c', 'HIDE', 'ALL', null);
    expect(
      (await svc.resolveMine(user({ tenantIds: [] }), null, NOW)).hiddenKeys,
    ).toEqual(['m.c']);
  });

  it('múltiples roles: HIDE de un rol gana al SHOW de otro; un rol de otra organización no cuenta', async () => {
    await element('m.a', null, false);
    await element('m.b');
    await rule('m.a', 'SHOW', 'ROLE', 'PRACTITIONER');
    await rule('m.a', 'HIDE', 'ROLE', 'NURSE');
    await rule('m.b', 'HIDE', 'ROLE', 'PHARMACIST');
    const u = user({
      roles: ['PRACTITIONER', 'NURSE', 'PHARMACIST'],
      scopedRoles: { [T2]: ['PHARMACIST'] },
      tenantIds: [T1, T2],
    });
    const inT1 = await svc.resolveMine(u, T1, NOW);
    expect(inT1.hiddenKeys).toEqual(['m.a']); // NURSE (HIDE) gana a PRACTITIONER (SHOW); PHARMACIST sólo existe en T2
    const inT2 = await svc.resolveMine(u, T2, NOW);
    expect(inT2.hiddenKeys).toEqual(['m.a', 'm.b']);
  });

  it('cascada: ocultar el padre oculta al hijo aunque el hijo tenga SHOW propio', async () => {
    await element('m');
    await element('m.a', 'm');
    await rule('m', 'HIDE', 'ALL', null);
    await rule('m.a', 'SHOW', 'USER', ME);
    expect((await svc.resolveMine(user(), T1, NOW)).hiddenKeys).toEqual([
      'm',
      'm.a',
    ]);
  });

  it('vigencia: la vencida y la futura no aplican; la vigente sí', async () => {
    await element('m.a');
    await element('m.b');
    await element('m.c');
    await rule('m.a', 'HIDE', 'ALL', null, {
      validTo: new Date(NOW.getTime() - 1000),
    });
    await rule('m.b', 'HIDE', 'ALL', null, {
      validFrom: new Date(NOW.getTime() + 1000),
    });
    await rule('m.c', 'HIDE', 'ALL', null, {
      validFrom: new Date(NOW.getTime() - 1000),
      validTo: new Date(NOW.getTime() + 1000),
    });
    expect((await svc.resolveMine(user(), T1, NOW)).hiddenKeys).toEqual([
      'm.c',
    ]);
  });

  it('una regla terminada no aplica', async () => {
    await element('m.a');
    const r = await rule('m.a', 'HIDE', 'ALL', null);
    await store.updateRule(
      r.id,
      1,
      {
        endedAt: new Date(NOW.getTime() - 1000),
        validTo: new Date(NOW.getTime() - 1000),
      },
      ME,
    );
    expect((await svc.resolveMine(user(), T1, NOW)).hiddenKeys).toEqual([]);
  });

  it('una regla acotada a otra organización no aplica en esta', async () => {
    await element('m.a');
    await rule('m.a', 'HIDE', 'USER', ME, { scopeTenantId: T2 });
    expect(
      (await svc.resolveMine(user({ tenantIds: [T1, T2] }), T1, NOW))
        .hiddenKeys,
    ).toEqual([]);
    expect(
      (await svc.resolveMine(user({ tenantIds: [T1, T2] }), T2, NOW))
        .hiddenKeys,
    ).toEqual(['m.a']);
  });

  it('un elemento retirado con una regla HIDE sigue oculto (no se vuelve visible por retirarse)', async () => {
    const e = await element('m.a');
    await rule('m.a', 'HIDE', 'ALL', null);
    await store.updateElement(e.id, { status: 'RETIRED', retiredAt: NOW }, ME);
    expect((await svc.resolveMine(user(), T1, NOW)).hiddenKeys).toEqual([
      'm.a',
    ]);
  });

  it('la versión cambia cuando cambia lo oculto', async () => {
    await element('m.a');
    const before = await svc.resolveMine(user(), T1, NOW);
    await rule('m.a', 'HIDE', 'ALL', null);
    const after = await svc.resolveMine(user(), T1, NOW);
    expect(after.version).not.toBe(before.version);
  });
});
