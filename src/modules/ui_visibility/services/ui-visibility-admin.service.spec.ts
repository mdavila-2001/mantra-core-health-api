import { jest } from '@jest/globals';
import type { PinoLogger } from 'nestjs-pino';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { UiStaleRecordError } from '../repositories/ui-visibility.store';
import { InMemoryUiVisibilityStore } from '../testing/in-memory-ui-visibility.store';
import { UiVisibilityErrorReason as R } from '../ui-visibility.error-reasons';
import type { UiAdminActor } from '../ui-visibility.types';
import type {
  CreateRuleDto,
  UiElementDraftDto,
} from '../dto/ui-visibility.dto';
import { UiVisibilityAdminService } from './ui-visibility-admin.service';

/**
 * Servicio de administración contra el DOBLE en memoria del puerto (regla 65). Las invariantes
 * de la base (unicidad, versión, atomicidad) las reproduce el doble; el SQL real no se ejerce.
 */
const T1 = '33333333-3333-4333-8333-333333333333';
const T2 = '44444444-4444-4444-8444-444444444444';
const U_PLATFORM = '0a000000-0000-4000-8000-000000000001';
const U_ADMIN1 = '0a000000-0000-4000-8000-000000000002';
const U_ADMIN2 = '0a000000-0000-4000-8000-000000000003';
const U_MEMBER1 = '0a000000-0000-4000-8000-000000000004';
const U_MEMBER2 = '0a000000-0000-4000-8000-000000000005';
const U_GHOST = '0a000000-0000-4000-8000-0000000000ff';

const platform: UiAdminActor = {
  userId: U_PLATFORM,
  isPlatform: true,
  tenantId: null,
};
const admin1: UiAdminActor = {
  userId: U_ADMIN1,
  isPlatform: false,
  tenantId: T1,
};
const admin2: UiAdminActor = {
  userId: U_ADMIN2,
  isPlatform: false,
  tenantId: T2,
};

const REASON = 'Motivo suficientemente largo';

const draft = (
  key: string,
  over: Partial<UiElementDraftDto> = {},
): UiElementDraftDto => ({
  key,
  kind: 'ACTION',
  moduleCode: key.split('.')[0],
  parentKey: null,
  label: key,
  description: null,
  defaultVisible: true,
  ...over,
});

const logger = {
  setContext: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as PinoLogger;

async function rejection(p: Promise<unknown>): Promise<{
  status: number;
  reason?: string;
  details?: unknown;
  message: string;
}> {
  try {
    await p;
  } catch (e) {
    const err = e as {
      getStatus(): number;
      reason?: string;
      details?: unknown;
      message: string;
      getResponse(): { reason?: string; details?: unknown };
    };
    const body = err.getResponse();
    return {
      status: err.getStatus(),
      reason: err.reason ?? body.reason,
      details: err.details ?? body.details,
      message: err.message,
    };
  }
  throw new Error('se esperaba un rechazo');
}

describe('UiVisibilityAdminService', () => {
  let store: InMemoryUiVisibilityStore;
  let svc: UiVisibilityAdminService;

  beforeEach(() => {
    store = new InMemoryUiVisibilityStore();
    store.users.set(U_ADMIN1, 'Admin Uno');
    store.users.set(U_ADMIN2, 'Admin Dos');
    store.users.set(U_PLATFORM, 'Plataforma');
    store.users.set(U_MEMBER1, 'Miembro Uno');
    store.users.set(U_MEMBER2, 'Miembro Dos');
    store.tenants.set(T1, { name: 'Clínica Uno', orgType: 'CLINIC' });
    store.tenants.set(T2, { name: 'Farmacia Dos', orgType: 'PHARMACY' });
    store.memberships.add(`${U_MEMBER1}|${T1}`);
    store.memberships.add(`${U_MEMBER2}|${T2}`);
    store.roleCatalog.set('NURSE', 'Enfermería');
    svc = new UiVisibilityAdminService(store, logger);
  });

  const seed = async (...drafts: UiElementDraftDto[]) =>
    svc.syncElements({ elements: drafts }, platform);

  // ═══ sync ═════════════════════════════════════════════════════════════════
  describe('syncElements', () => {
    it('crea los elementos nuevos con source CODE y respeta la jerarquía aunque el hijo venga antes', async () => {
      const res = await seed(
        draft('pharmacy.orders.export-button', {
          parentKey: 'pharmacy.orders',
        }),
        draft('pharmacy.orders', { parentKey: 'pharmacy', kind: 'SCREEN' }),
        draft('pharmacy', { kind: 'MODULE' }),
      );
      expect(res).toEqual({ created: 3, updated: 0, retired: 0, unchanged: 0 });
      const page = await svc.listElements({});
      const byKey = new Map(page.items.map((e) => [e.key, e]));
      expect(byKey.get('pharmacy.orders.export-button')?.parentKey).toBe(
        'pharmacy.orders',
      );
      expect(byKey.get('pharmacy.orders')?.parentKey).toBe('pharmacy');
      expect(byKey.get('pharmacy')?.parentKey).toBeNull();
      expect(
        page.items.every((e) => e.source === 'CODE' && e.status === 'ACTIVE'),
      ).toBe(true);
    });

    it('es idempotente: repetir el mismo lote no cambia nada ni escribe', async () => {
      const batch = [
        draft('a.x', { kind: 'SCREEN' }),
        draft('a.x.btn', { parentKey: 'a.x' }),
      ];
      await seed(...batch);
      const writes = store.writes;
      const again = await seed(...batch);
      expect(again).toEqual({
        created: 0,
        updated: 0,
        retired: 0,
        unchanged: 2,
      });
      expect(store.writes).toBe(writes);
    });

    it('actualiza lo que cambió y cuenta lo demás como sin cambios', async () => {
      await seed(draft('a.one'), draft('a.two'));
      const res = await seed(
        draft('a.one', { label: 'Nueva etiqueta' }),
        draft('a.two'),
      );
      expect(res).toEqual({ created: 0, updated: 1, retired: 0, unchanged: 1 });
      expect((await svc.listElements({ q: 'a.one' })).items[0].label).toBe(
        'Nueva etiqueta',
      );
    });

    it('retira los CODE que el lote ya no trae, sin borrarlos', async () => {
      await seed(draft('a.one'), draft('a.two'));
      const res = await seed(draft('a.one'));
      expect(res).toEqual({ created: 0, updated: 0, retired: 1, unchanged: 1 });
      const retired = await svc.listElements({ status: 'RETIRED' });
      expect(retired.items.map((e) => e.key)).toEqual(['a.two']);
      // y una segunda corrida no vuelve a contarlo
      expect((await seed(draft('a.one'))).retired).toBe(0);
    });

    it('un elemento retirado que vuelve al lote se reactiva y conserva sus reglas', async () => {
      await seed(draft('a.one'), draft('a.two'));
      await svc.createRule(
        {
          elementKey: 'a.two',
          effect: 'HIDE',
          subjectType: 'ALL',
          subjectId: null,
          reason: REASON,
        },
        platform,
      );
      await seed(draft('a.one'));
      const res = await seed(draft('a.one'), draft('a.two'));
      expect(res).toEqual({ created: 0, updated: 1, retired: 0, unchanged: 1 });
      const back = (await svc.listElements({ q: 'a.two' })).items[0];
      expect(back.status).toBe('ACTIVE');
      expect(back.activeRuleCount).toBe(1);
    });

    it('no toca los elementos ADMIN aunque no vengan en el lote', async () => {
      await svc.createElement(
        {
          key: 'manual.thing',
          kind: 'WIDGET',
          moduleCode: 'manual',
          label: 'Manual',
        },
        platform,
      );
      const res = await seed(draft('a.one'));
      expect(res.retired).toBe(0);
      expect(
        (await svc.listElements({ status: 'ACTIVE' })).items.map((e) => e.key),
      ).toContain('manual.thing');
    });

    it('acepta como padre un elemento ADMIN activo', async () => {
      await svc.createElement(
        {
          key: 'manual',
          kind: 'MODULE',
          moduleCode: 'manual',
          label: 'Manual',
        },
        platform,
      );
      const res = await seed(draft('manual.child', { parentKey: 'manual' }));
      expect(res.created).toBe(1);
    });

    it('límite: un lote vacío se rechaza (retiraría todo el catálogo)', async () => {
      await seed(draft('a.one'));
      const e = await rejection(svc.syncElements({ elements: [] }, platform));
      expect(e).toMatchObject({
        status: 422,
        reason: R.UI_ELEMENT_SYNC_INVALID,
      });
      expect((await svc.listElements({ status: 'ACTIVE' })).items).toHaveLength(
        1,
      );
    });

    it('límite: la misma clave repetida con el mismo contenido se acepta una sola vez', async () => {
      const res = await seed(draft('a.one'), draft('a.one'));
      expect(res.created).toBe(1);
    });

    it('inválido: la misma clave con contenido distinto es 422', async () => {
      const e = await rejection(
        seed(draft('a.one'), draft('a.one', { label: 'otra' })),
      );
      expect(e).toMatchObject({
        status: 422,
        reason: R.UI_ELEMENT_SYNC_INVALID,
      });
    });

    it('inválido: un padre que no existe es 422 UI_ELEMENT_PARENT_NOT_FOUND', async () => {
      const e = await rejection(
        seed(draft('a.one', { parentKey: 'no.existe' })),
      );
      expect(e).toMatchObject({
        status: 422,
        reason: R.UI_ELEMENT_PARENT_NOT_FOUND,
      });
    });

    it('inválido: un padre CODE que este mismo lote retira no sirve de padre', async () => {
      await seed(draft('old'), draft('keep'));
      const e = await rejection(
        seed(draft('keep'), draft('child', { parentKey: 'old' })),
      );
      expect(e.reason).toBe(R.UI_ELEMENT_PARENT_NOT_FOUND);
    });

    it('inválido: un ciclo es 422 UI_ELEMENT_HIERARCHY_CYCLE', async () => {
      const e = await rejection(
        seed(draft('a', { parentKey: 'b' }), draft('b', { parentKey: 'a' })),
      );
      expect(e).toMatchObject({
        status: 422,
        reason: R.UI_ELEMENT_HIERARCHY_CYCLE,
      });
    });

    it('inválido: un elemento que es su propio padre es un ciclo', async () => {
      const e = await rejection(seed(draft('a', { parentKey: 'a' })));
      expect(e.reason).toBe(R.UI_ELEMENT_HIERARCHY_CYCLE);
    });

    it('chocar con un elemento ADMIN es 409 y revierte todo el lote (atomicidad)', async () => {
      await svc.createElement(
        {
          key: 'manual.thing',
          kind: 'WIDGET',
          moduleCode: 'manual',
          label: 'Manual',
        },
        platform,
      );
      const before = (await svc.listElements({})).total;
      const e = await rejection(
        seed(draft('fresh.one'), draft('manual.thing')),
      );
      expect(e).toMatchObject({ status: 409, reason: R.UI_ELEMENT_KEY_EXISTS });
      expect((await svc.listElements({})).total).toBe(before);
      expect((await svc.listElements({ q: 'fresh.one' })).items).toHaveLength(
        0,
      );
    });
  });

  // ═══ catálogo ═════════════════════════════════════════════════════════════
  describe('createElement / listElements', () => {
    it('crea con source ADMIN y defaultVisible=true por omisión', async () => {
      const v = await svc.createElement(
        {
          key: 'manual.thing',
          kind: 'WIDGET',
          moduleCode: 'manual',
          label: 'Manual',
        },
        platform,
      );
      expect(v).toMatchObject({
        source: 'ADMIN',
        status: 'ACTIVE',
        defaultVisible: true,
        parentKey: null,
        activeRuleCount: 0,
      });
    });

    it('409 UI_ELEMENT_KEY_EXISTS si la clave ya existe', async () => {
      await seed(draft('a.one'));
      const e = await rejection(
        svc.createElement(
          { key: 'a.one', kind: 'ACTION', moduleCode: 'a', label: 'x' },
          platform,
        ),
      );
      expect(e).toMatchObject({ status: 409, reason: R.UI_ELEMENT_KEY_EXISTS });
    });

    it('422 si el padre no existe y 409 si está retirado', async () => {
      const missing = await rejection(
        svc.createElement(
          {
            key: 'a.child',
            kind: 'ACTION',
            moduleCode: 'a',
            label: 'x',
            parentKey: 'nope',
          },
          platform,
        ),
      );
      expect(missing.reason).toBe(R.UI_ELEMENT_PARENT_NOT_FOUND);
      await seed(draft('p'), draft('q'));
      await seed(draft('q'));
      const retired = await rejection(
        svc.createElement(
          {
            key: 'p.child',
            kind: 'ACTION',
            moduleCode: 'p',
            label: 'x',
            parentKey: 'p',
          },
          platform,
        ),
      );
      expect(retired).toMatchObject({
        status: 409,
        reason: R.UI_ELEMENT_RETIRED,
      });
    });

    it('pagina por clave con cursor determinista y total', async () => {
      await seed(draft('m.c'), draft('m.a'), draft('m.b'));
      const p1 = await svc.listElements({ limit: 2 });
      expect(p1.items.map((e) => e.key)).toEqual(['m.a', 'm.b']);
      expect(p1.total).toBe(3);
      expect(p1.nextCursor).not.toBeNull();
      const p2 = await svc.listElements({
        limit: 2,
        cursor: p1.nextCursor as string,
      });
      expect(p2.items.map((e) => e.key)).toEqual(['m.c']);
      expect(p2.nextCursor).toBeNull();
    });

    it('filtra por módulo, tipo, estado y texto', async () => {
      await seed(
        draft('m.a', { kind: 'SCREEN', label: 'Pantalla' }),
        draft('n.b', { kind: 'ACTION', label: 'Botón exportar' }),
      );
      expect(
        (await svc.listElements({ module: 'n' })).items.map((e) => e.key),
      ).toEqual(['n.b']);
      expect(
        (await svc.listElements({ kind: 'SCREEN' })).items.map((e) => e.key),
      ).toEqual(['m.a']);
      expect(
        (await svc.listElements({ q: 'EXPORTAR' })).items.map((e) => e.key),
      ).toEqual(['n.b']);
      expect((await svc.listElements({ status: 'RETIRED' })).items).toEqual([]);
    });

    it('inválido: un cursor que no es de esta lista es 400', async () => {
      await expect(
        svc.listElements({ cursor: encodeKeysetCursor({ x: 1 }) }),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        svc.listElements({ cursor: '%%%no-es-base64%%%' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('límite: limit se acota al máximo', async () => {
      await seed(draft('m.a'));
      const page = await svc.listElements({ limit: 100000 });
      expect(page.items).toHaveLength(1);
    });
  });

  // ═══ reglas: alta ═════════════════════════════════════════════════════════
  describe('createRule', () => {
    beforeEach(async () => {
      await seed(
        draft('pharmacy'),
        draft('pharmacy.orders.export', { parentKey: 'pharmacy' }),
      );
    });

    const rule = (over: Record<string, unknown> = {}): CreateRuleDto =>
      ({
        elementKey: 'pharmacy.orders.export',
        effect: 'HIDE',
        subjectType: 'ALL',
        subjectId: null,
        reason: REASON,
        ...over,
      }) as CreateRuleDto;

    it('plataforma: crea una regla ALL sin ámbito, con versión 1 y etiquetas', async () => {
      const v = await svc.createRule(rule(), platform);
      expect(v).toMatchObject({
        elementKey: 'pharmacy.orders.export',
        effect: 'HIDE',
        subjectType: 'ALL',
        subjectId: null,
        subjectLabel: null,
        version: 1,
        createdByLabel: 'Plataforma',
        validFrom: null,
        validTo: null,
      });
      expect([...store.rules.values()][0].scopeTenantId).toBeNull();
    });

    it.each([
      ['USER', U_MEMBER1, 'Miembro Uno'],
      ['TENANT', T1, 'Clínica Uno'],
      ['ROLE', 'NURSE', 'Enfermería'],
      ['ORG_TYPE', 'CLINIC', 'CLINIC'],
    ] as const)(
      'plataforma: sujeto %s válido con su etiqueta',
      async (subjectType, subjectId, label) => {
        const v = await svc.createRule(
          rule({ subjectType, subjectId }),
          platform,
        );
        expect(v).toMatchObject({
          subjectType,
          subjectId,
          subjectLabel: label,
        });
      },
    );

    it('un rol global del token (SUPERADMIN) es un sujeto ROLE válido aunque no esté en authz.roles', async () => {
      const v = await svc.createRule(
        rule({ subjectType: 'ROLE', subjectId: 'SUPERADMIN' }),
        platform,
      );
      expect(v.subjectLabel).toBe('SUPERADMIN');
    });

    it('guarda la vigencia', async () => {
      const from = new Date(Date.now() + 3_600_000).toISOString();
      const to = new Date(Date.now() + 7_200_000).toISOString();
      const v = await svc.createRule(
        rule({ validFrom: from, validTo: to }),
        platform,
      );
      expect(v.validFrom).toBe(from);
      expect(v.validTo).toBe(to);
    });

    it('404 UI_ELEMENT_NOT_FOUND si el elemento no existe', async () => {
      const e = await rejection(
        svc.createRule(rule({ elementKey: 'no.existe' }), platform),
      );
      expect(e).toMatchObject({ status: 404, reason: R.UI_ELEMENT_NOT_FOUND });
    });

    it('409 UI_ELEMENT_RETIRED si el elemento está retirado', async () => {
      await seed(draft('pharmacy'));
      const e = await rejection(svc.createRule(rule(), platform));
      expect(e).toMatchObject({ status: 409, reason: R.UI_ELEMENT_RETIRED });
    });

    it('409 UI_RULE_DUPLICATE con la misma terna; otro sujeto u otro efecto sobre la misma terna también', async () => {
      await svc.createRule(
        rule({ subjectType: 'ROLE', subjectId: 'NURSE' }),
        platform,
      );
      const same = await rejection(
        svc.createRule(
          rule({ subjectType: 'ROLE', subjectId: 'NURSE' }),
          platform,
        ),
      );
      expect(same).toMatchObject({ status: 409, reason: R.UI_RULE_DUPLICATE });
      const otherEffect = await rejection(
        svc.createRule(
          rule({ subjectType: 'ROLE', subjectId: 'NURSE', effect: 'SHOW' }),
          platform,
        ),
      );
      expect(otherEffect.reason).toBe(R.UI_RULE_DUPLICATE);
      await expect(
        svc.createRule(
          rule({ subjectType: 'ROLE', subjectId: 'SUPERADMIN' }),
          platform,
        ),
      ).resolves.toBeDefined();
    });

    it('409 también para ALL repetida; terminada la anterior, se puede volver a crear', async () => {
      const first = await svc.createRule(rule(), platform);
      expect((await rejection(svc.createRule(rule(), platform))).reason).toBe(
        R.UI_RULE_DUPLICATE,
      );
      await svc.endRule(first.id, platform);
      await expect(
        svc.createRule(rule({ effect: 'SHOW' }), platform),
      ).resolves.toMatchObject({ effect: 'SHOW' });
    });

    it('la carrera que gana el índice único también es 409', async () => {
      const original = store.findOpenRule.bind(store);
      store.findOpenRule = async () => null; // el SELECT previo no ve al duplicado: sólo lo para el índice
      await svc.createRule(rule(), platform);
      const e = await rejection(svc.createRule(rule(), platform));
      expect(e).toMatchObject({ status: 409, reason: R.UI_RULE_DUPLICATE });
      store.findOpenRule = original;
    });

    describe('sujeto inválido (422 UI_RULE_INVALID_SUBJECT)', () => {
      it.each([
        ['ALL con sujeto', { subjectType: 'ALL', subjectId: U_MEMBER1 }],
        ['USER sin sujeto', { subjectType: 'USER', subjectId: null }],
        ['USER vacío', { subjectType: 'USER', subjectId: '' }],
        ['USER que no es uuid', { subjectType: 'USER', subjectId: 'pepe' }],
        ['USER inexistente', { subjectType: 'USER', subjectId: U_GHOST }],
        ['TENANT que no es uuid', { subjectType: 'TENANT', subjectId: 'x' }],
        ['TENANT inexistente', { subjectType: 'TENANT', subjectId: U_GHOST }],
        ['ROLE inexistente', { subjectType: 'ROLE', subjectId: 'NO_ROLE' }],
        [
          'ORG_TYPE inexistente',
          { subjectType: 'ORG_TYPE', subjectId: 'MARCIANO' },
        ],
      ])('%s', async (_name, over) => {
        const e = await rejection(svc.createRule(rule(over), platform));
        expect(e).toMatchObject({
          status: 422,
          reason: R.UI_RULE_INVALID_SUBJECT,
        });
      });
    });

    describe('vigencia inválida (422 UI_RULE_INVALID_VALIDITY)', () => {
      it('validTo anterior a validFrom', async () => {
        const e = await rejection(
          svc.createRule(
            rule({
              validFrom: new Date(Date.now() + 7_200_000).toISOString(),
              validTo: new Date(Date.now() + 3_600_000).toISOString(),
            }),
            platform,
          ),
        );
        expect(e).toMatchObject({
          status: 422,
          reason: R.UI_RULE_INVALID_VALIDITY,
        });
      });

      it('validTo igual a validFrom (límite)', async () => {
        const t = new Date(Date.now() + 3_600_000).toISOString();
        const e = await rejection(
          svc.createRule(rule({ validFrom: t, validTo: t }), platform),
        );
        expect(e.reason).toBe(R.UI_RULE_INVALID_VALIDITY);
      });

      it('validTo que ya pasó: nace vencida, no se acepta', async () => {
        const e = await rejection(
          svc.createRule(
            rule({ validTo: new Date(Date.now() - 1000).toISOString() }),
            platform,
          ),
        );
        expect(e.reason).toBe(R.UI_RULE_INVALID_VALIDITY);
      });
    });

    describe('administrador de organización', () => {
      it('puede crear TENANT sobre su organización, y la regla queda acotada a ella', async () => {
        const v = await svc.createRule(
          rule({ subjectType: 'TENANT', subjectId: T1 }),
          admin1,
        );
        expect(v.subjectId).toBe(T1);
        expect([...store.rules.values()][0].scopeTenantId).toBe(T1);
      });

      it('puede crear USER sobre un miembro de su organización', async () => {
        await expect(
          svc.createRule(
            rule({ subjectType: 'USER', subjectId: U_MEMBER1 }),
            admin1,
          ),
        ).resolves.toBeDefined();
      });

      it.each([
        ['TENANT ajena', { subjectType: 'TENANT', subjectId: T2 }],
        [
          'USER de otra organización',
          { subjectType: 'USER', subjectId: U_MEMBER2 },
        ],
        ['USER inexistente', { subjectType: 'USER', subjectId: U_GHOST }],
        ['ROLE', { subjectType: 'ROLE', subjectId: 'NURSE' }],
        ['ORG_TYPE', { subjectType: 'ORG_TYPE', subjectId: 'CLINIC' }],
        ['ALL', { subjectType: 'ALL', subjectId: null }],
      ])('%s: 422 sin delatar si existe', async (_n, over) => {
        const e = await rejection(svc.createRule(rule(over), admin1));
        expect(e).toMatchObject({
          status: 422,
          reason: R.UI_RULE_INVALID_SUBJECT,
        });
      });

      it('el rechazo de un USER ajeno es indistinguible del de uno inexistente', async () => {
        const foreign = await rejection(
          svc.createRule(
            rule({ subjectType: 'USER', subjectId: U_MEMBER2 }),
            admin1,
          ),
        );
        const ghost = await rejection(
          svc.createRule(
            rule({ subjectType: 'USER', subjectId: U_GHOST }),
            admin1,
          ),
        );
        expect(foreign).toEqual(ghost);
      });

      it('un actor de organización sin organización no tiene alcance: 403 y no escribe', async () => {
        const noScope: UiAdminActor = {
          userId: U_ADMIN1,
          isPlatform: false,
          tenantId: null,
        };
        await expect(
          svc.createRule(
            rule({ subjectType: 'USER', subjectId: U_MEMBER1 }),
            noScope,
          ),
        ).rejects.toMatchObject({ status: 403 });
        await expect(svc.listRules({}, noScope)).rejects.toMatchObject({
          status: 403,
        });
        expect(store.rules.size).toBe(0);
      });
    });
  });

  // ═══ reglas: lectura ══════════════════════════════════════════════════════
  describe('listRules', () => {
    beforeEach(async () => {
      await seed(draft('m.a'), draft('m.b'));
      let t = Date.parse('2026-10-31T10:00:00.000Z');
      store.setClock(() => new Date((t += 1000)));
      await svc.createRule(
        {
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'ALL',
          subjectId: null,
          reason: REASON,
        },
        platform,
      );
      await svc.createRule(
        {
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'TENANT',
          subjectId: T1,
          reason: REASON,
        },
        admin1,
      );
      await svc.createRule(
        {
          elementKey: 'm.b',
          effect: 'SHOW',
          subjectType: 'TENANT',
          subjectId: T2,
          reason: REASON,
        },
        admin2,
      );
    });

    it('plataforma ve todas, la más reciente primero', async () => {
      const page = await svc.listRules({}, platform);
      expect(page.total).toBe(3);
      expect(page.items.map((r) => `${r.elementKey}:${r.subjectType}`)).toEqual(
        ['m.b:TENANT', 'm.a:TENANT', 'm.a:ALL'],
      );
    });

    it('un administrador de organización sólo ve las de su organización', async () => {
      const page = await svc.listRules({}, admin1);
      expect(page.total).toBe(1);
      expect(page.items[0]).toMatchObject({
        subjectType: 'TENANT',
        subjectId: T1,
        subjectLabel: 'Clínica Uno',
        createdByLabel: 'Admin Uno',
      });
      expect((await svc.listRules({}, admin2)).items[0].subjectId).toBe(T2);
    });

    it('filtra por elemento, tipo de sujeto y sujeto', async () => {
      expect((await svc.listRules({ elementKey: 'm.a' }, platform)).total).toBe(
        2,
      );
      expect(
        (await svc.listRules({ subjectType: 'ALL' }, platform)).total,
      ).toBe(1);
      expect(
        (
          await svc.listRules(
            { subjectType: 'TENANT', subjectId: T2 },
            platform,
          )
        ).total,
      ).toBe(1);
    });

    it('404 UI_ELEMENT_NOT_FOUND si el filtro nombra un elemento que no existe', async () => {
      const e = await rejection(
        svc.listRules({ elementKey: 'no.existe' }, platform),
      );
      expect(e).toMatchObject({ status: 404, reason: R.UI_ELEMENT_NOT_FOUND });
    });

    it('active=true/false separa vigentes de terminadas', async () => {
      const [first] = (await svc.listRules({ subjectType: 'ALL' }, platform))
        .items;
      await svc.endRule(first.id, platform);
      expect((await svc.listRules({ active: true }, platform)).total).toBe(2);
      expect(
        (await svc.listRules({ active: false }, platform)).items.map(
          (r) => r.id,
        ),
      ).toEqual([first.id]);
    });

    it('pagina con cursor determinista sin repetir ni saltar filas', async () => {
      const p1 = await svc.listRules({ limit: 2 }, platform);
      expect(p1.items).toHaveLength(2);
      expect(p1.nextCursor).not.toBeNull();
      const p2 = await svc.listRules(
        { limit: 2, cursor: p1.nextCursor as string },
        platform,
      );
      expect(p2.items).toHaveLength(1);
      expect(p2.nextCursor).toBeNull();
      const ids = [...p1.items, ...p2.items].map((r) => r.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('cursor con fecha inválida es 400', async () => {
      await expect(
        svc.listRules(
          { cursor: encodeKeysetCursor({ c: 'ayer', i: 'x' }) },
          platform,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('la etiqueta del sujeto de un usuario inexistente es null, no un error', async () => {
      const [r] = [...store.rules.values()];
      r.subjectType = 'USER';
      r.subjectId = U_GHOST;
      const item = (
        await svc.listRules({ elementKey: 'm.a' }, platform)
      ).items.find((x) => x.id === r.id);
      expect(item?.subjectLabel).toBeNull();
    });
  });

  // ═══ reglas: edición y fin ════════════════════════════════════════════════
  describe('updateRule / endRule', () => {
    let ruleId: string;
    beforeEach(async () => {
      await seed(draft('m.a'));
      const v = await svc.createRule(
        {
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'TENANT',
          subjectId: T1,
          reason: REASON,
        },
        admin1,
      );
      ruleId = v.id;
    });

    it('edita con la versión vigente y la sube', async () => {
      const v = await svc.updateRule(
        ruleId,
        1,
        { effect: 'SHOW', reason: 'Otro motivo suficiente' },
        admin1,
      );
      expect(v).toMatchObject({
        effect: 'SHOW',
        reason: 'Otro motivo suficiente',
        version: 2,
      });
    });

    it('409 UI_RULE_VERSION_MISMATCH con expected y actual si la versión no es la vigente', async () => {
      await svc.updateRule(ruleId, 1, { effect: 'SHOW' }, admin1);
      const e = await rejection(
        svc.updateRule(ruleId, 1, { effect: 'HIDE' }, admin1),
      );
      expect(e).toMatchObject({
        status: 409,
        reason: R.UI_RULE_VERSION_MISMATCH,
        details: { expected: 1, actual: 2 },
      });
      expect([...store.rules.values()][0].effect).toBe('SHOW');
    });

    it('la carrera que gana el otro flush (stale del almacén) es el mismo 409', async () => {
      store.updateRule = async () => {
        throw new UiStaleRecordError();
      };
      const e = await rejection(
        svc.updateRule(ruleId, 1, { effect: 'SHOW' }, admin1),
      );
      expect(e).toMatchObject({
        status: 409,
        reason: R.UI_RULE_VERSION_MISMATCH,
      });
    });

    it('editar con los mismos valores no escribe ni sube la versión', async () => {
      const writes = store.writes;
      const v = await svc.updateRule(
        ruleId,
        1,
        { effect: 'HIDE', reason: REASON },
        admin1,
      );
      expect(v.version).toBe(1);
      expect(store.writes).toBe(writes);
    });

    it('validTo/validFrom null limpian la vigencia', async () => {
      const to = new Date(Date.now() + 3_600_000).toISOString();
      const withTo = await svc.updateRule(ruleId, 1, { validTo: to }, admin1);
      expect(withTo.validTo).toBe(to);
      const cleared = await svc.updateRule(
        ruleId,
        2,
        { validTo: null },
        admin1,
      );
      expect(cleared.validTo).toBeNull();
    });

    it('422 UI_RULE_EMPTY_UPDATE sin campos', async () => {
      const e = await rejection(svc.updateRule(ruleId, 1, {}, admin1));
      expect(e).toMatchObject({ status: 422, reason: R.UI_RULE_EMPTY_UPDATE });
    });

    it('422 si la vigencia resultante es incoherente o ya pasó', async () => {
      const past = await rejection(
        svc.updateRule(
          ruleId,
          1,
          { validTo: new Date(Date.now() - 1000).toISOString() },
          admin1,
        ),
      );
      expect(past.reason).toBe(R.UI_RULE_INVALID_VALIDITY);
      const from = new Date(Date.now() + 7_200_000).toISOString();
      const to = new Date(Date.now() + 3_600_000).toISOString();
      const inverted = await rejection(
        svc.updateRule(ruleId, 1, { validFrom: from, validTo: to }, admin1),
      );
      expect(inverted.reason).toBe(R.UI_RULE_INVALID_VALIDITY);
    });

    it('409 UI_RULE_ENDED al editar una regla terminada', async () => {
      await svc.endRule(ruleId, admin1);
      const e = await rejection(
        svc.updateRule(ruleId, 2, { effect: 'SHOW' }, admin1),
      );
      expect(e).toMatchObject({ status: 409, reason: R.UI_RULE_ENDED });
    });

    it('end: pone endedAt y validTo=ahora, sube la versión y la regla deja de contarse como vigente', async () => {
      const v = await svc.endRule(ruleId, admin1);
      expect(v.version).toBe(2);
      expect(v.validTo).not.toBeNull();
      expect(Date.parse(v.validTo as string)).toBeLessThanOrEqual(Date.now());
      expect(
        (await svc.listElements({ q: 'm.a' })).items[0].activeRuleCount,
      ).toBe(0);
    });

    it('end es idempotente: terminar una terminada devuelve la misma sin escribir', async () => {
      const first = await svc.endRule(ruleId, admin1);
      const writes = store.writes;
      const second = await svc.endRule(ruleId, admin1);
      expect(second).toEqual(first);
      expect(store.writes).toBe(writes);
    });

    it('límite: se puede terminar una regla que todavía no empezó (validFrom futura)', async () => {
      const from = new Date(Date.now() + 86_400_000).toISOString();
      const future = await svc.createRule(
        {
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'USER',
          subjectId: U_MEMBER1,
          validFrom: from,
          reason: REASON,
        },
        admin1,
      );
      const ended = await svc.endRule(future.id, admin1);
      expect(ended.validFrom).toBe(from);
      expect(Date.parse(ended.validTo as string)).toBeLessThan(
        Date.parse(from),
      );
    });

    it('límite: terminar una regla que ya había vencido conserva su validTo', async () => {
      const [row] = [...store.rules.values()];
      const past = new Date(Date.now() - 3_600_000);
      row.validTo = past;
      const v = await svc.endRule(ruleId, admin1);
      expect(v.validTo).toBe(past.toISOString());
    });

    it('404 UI_RULE_NOT_FOUND idéntico para una regla inexistente y para una de otra organización', async () => {
      const ghost = await rejection(
        svc.updateRule(U_GHOST, 1, { effect: 'SHOW' }, admin2),
      );
      const foreign = await rejection(
        svc.updateRule(ruleId, 1, { effect: 'SHOW' }, admin2),
      );
      expect(foreign).toEqual(ghost);
      expect(foreign).toMatchObject({
        status: 404,
        reason: R.UI_RULE_NOT_FOUND,
      });
      const foreignEnd = await rejection(svc.endRule(ruleId, admin2));
      expect(foreignEnd).toEqual(ghost);
      expect([...store.rules.values()][0].endedAt).toBeNull();
    });

    it('un administrador de organización no toca una regla de plataforma', async () => {
      const platformRule = await svc.createRule(
        {
          elementKey: 'm.a',
          effect: 'HIDE',
          subjectType: 'ALL',
          subjectId: null,
          reason: REASON,
        },
        platform,
      );
      expect(
        (
          await rejection(
            svc.updateRule(platformRule.id, 1, { effect: 'SHOW' }, admin1),
          )
        ).status,
      ).toBe(404);
      expect(
        (await rejection(svc.endRule(platformRule.id, admin1))).status,
      ).toBe(404);
    });

    it('la plataforma sí toca la regla de una organización', async () => {
      await expect(
        svc.updateRule(ruleId, 1, { effect: 'SHOW' }, platform),
      ).resolves.toMatchObject({ version: 2 });
    });
  });

  // ═══ protección anti-bloqueo ══════════════════════════════════════════════
  describe('protección anti-bloqueo (UI_RULE_PROTECTED_ELEMENT)', () => {
    const SCREEN = 'nav.superadmin.visibility-rules';
    const OTHER = 'nav.clinical.patients';
    beforeEach(async () => {
      await seed(
        draft(SCREEN),
        draft('nav.administration.catalog'),
        draft(OTHER),
      );
      store.userRoles.set(U_MEMBER1, [{ code: 'SECURITY_ADMIN' }]);
      store.userRoles.set(U_MEMBER2, [{ code: 'NURSE' }]);
      store.roleCatalog.set('SUPERADMIN', 'Superadmin');
    });
    const create = (over: Record<string, unknown>, actor = platform) =>
      svc.createRule(
        {
          elementKey: SCREEN,
          effect: 'HIDE',
          subjectType: 'ALL',
          subjectId: null,
          reason: REASON,
          ...over,
        } as CreateRuleDto,
        actor,
      );

    it.each([
      ['ALL', { subjectType: 'ALL', subjectId: null }],
      ['ROLE SUPERADMIN', { subjectType: 'ROLE', subjectId: 'SUPERADMIN' }],
      [
        'ROLE SECURITY_ADMIN',
        { subjectType: 'ROLE', subjectId: 'SECURITY_ADMIN' },
      ],
      ['USER administrador', { subjectType: 'USER', subjectId: U_MEMBER1 }],
    ])(
      'crear HIDE con sujeto %s sobre una pantalla protegida es 422',
      async (_n, over) => {
        const e = await rejection(create(over));
        expect(e).toMatchObject({
          status: 422,
          reason: R.UI_RULE_PROTECTED_ELEMENT,
        });
        expect(store.rules.size).toBe(0);
      },
    );

    it('también en el prefijo nav.administration.', async () => {
      const e = await rejection(
        create({ elementKey: 'nav.administration.catalog' }),
      );
      expect(e.reason).toBe(R.UI_RULE_PROTECTED_ELEMENT);
    });

    it('sí se admite HIDE para un rol o un usuario que no administran, y para TENANT/ORG_TYPE', async () => {
      await expect(
        create({ subjectType: 'ROLE', subjectId: 'NURSE' }),
      ).resolves.toBeDefined();
      await expect(
        create({ subjectType: 'USER', subjectId: U_MEMBER2 }),
      ).resolves.toBeDefined();
      await expect(
        create({ subjectType: 'TENANT', subjectId: T1 }),
      ).resolves.toBeDefined();
      await expect(
        create({ subjectType: 'ORG_TYPE', subjectId: 'CLINIC' }),
      ).resolves.toBeDefined();
    });

    it('SHOW sobre una pantalla protegida (ALL o administradores) se admite', async () => {
      await expect(create({ effect: 'SHOW' })).resolves.toBeDefined();
    });

    it('CONTRASTE: HIDE ALL sobre un elemento NO protegido sí se crea', async () => {
      await expect(create({ elementKey: OTHER })).resolves.toBeDefined();
    });

    it('el rechazo de protección no se confunde con un sujeto inválido (se evalúa después)', async () => {
      const e = await rejection(
        create({ subjectType: 'ROLE', subjectId: 'NO_ROLE' }),
      );
      expect(e.reason).toBe(R.UI_RULE_INVALID_SUBJECT);
    });

    it('editar a HIDE una regla SHOW de un sujeto administrador es 422', async () => {
      const show = await create({
        effect: 'SHOW',
        subjectType: 'ROLE',
        subjectId: 'SUPERADMIN',
      });
      const e = await rejection(
        svc.updateRule(show.id, 1, { effect: 'HIDE' }, platform),
      );
      expect(e).toMatchObject({
        status: 422,
        reason: R.UI_RULE_PROTECTED_ELEMENT,
      });
      expect([...store.rules.values()][0]).toMatchObject({
        effect: 'SHOW',
        rowVersion: 1,
      });
    });

    it('editar a HIDE una regla ALL sobre pantalla protegida (o su motivo si ya es HIDE) es 422', async () => {
      const show = await create({ effect: 'SHOW' });
      await expect(
        svc.updateRule(show.id, 1, { effect: 'HIDE' }, platform),
      ).rejects.toMatchObject({ status: 422 });
    });

    it('editar a HIDE una regla de un sujeto no administrador se admite', async () => {
      const show = await create({
        effect: 'SHOW',
        subjectType: 'ROLE',
        subjectId: 'NURSE',
      });
      await expect(
        svc.updateRule(show.id, 1, { effect: 'HIDE' }, platform),
      ).resolves.toMatchObject({ effect: 'HIDE' });
    });

    it('CONTRASTE: editar a HIDE sobre un elemento no protegido se admite', async () => {
      const show = await create({ effect: 'SHOW', elementKey: OTHER });
      await expect(
        svc.updateRule(show.id, 1, { effect: 'HIDE' }, platform),
      ).resolves.toMatchObject({ effect: 'HIDE' });
    });
  });

  // ═══ vista previa ═════════════════════════════════════════════════════════
  describe('preview', () => {
    beforeEach(async () => {
      await seed(
        draft('m'),
        draft('m.a', { parentKey: 'm' }),
        draft('m.b'),
        draft('m.c', { defaultVisible: false }),
      );
      store.userRoles.set(U_MEMBER1, [
        { code: 'NURSE' },
        { code: 'PATIENT', tenantId: T2 },
      ]);
    });
    const hide = (
      elementKey: string,
      subjectType: 'USER' | 'ROLE' | 'TENANT' | 'ALL',
      subjectId: string | null,
      actor = platform,
    ) =>
      svc.createRule(
        { elementKey, effect: 'HIDE', subjectType, subjectId, reason: REASON },
        actor,
      );

    it('exige exactamente uno de userId o roleCode (400)', async () => {
      const none = await rejection(svc.preview({}, platform));
      expect(none).toMatchObject({
        status: 400,
        reason: R.UI_PREVIEW_SUBJECT_REQUIRED,
      });
      const both = await rejection(
        svc.preview({ userId: U_MEMBER1, roleCode: 'NURSE' }, platform),
      );
      expect(both.reason).toBe(R.UI_PREVIEW_SUBJECT_REQUIRED);
    });

    it('«ver como» un usuario: lo oculto con su regla ganadora, el ancestro y el defaultVisible', async () => {
      const r = await hide('m', 'ROLE', 'NURSE');
      const res = await svc.preview({ userId: U_MEMBER1 }, admin1);
      expect(res.subject).toEqual({
        type: 'USER',
        id: U_MEMBER1,
        label: 'Miembro Uno',
      });
      const byKey = new Map(res.entries.map((e) => [e.elementKey, e]));
      expect(byKey.get('m')).toMatchObject({
        hidden: true,
        winningRuleId: r.id,
        reason: 'RULE',
      });
      expect(byKey.get('m.a')).toMatchObject({
        reason: 'ANCESTOR_HIDDEN',
        ancestorKey: 'm',
        winningRuleId: null,
      });
      expect(byKey.get('m.c')).toMatchObject({
        reason: 'DEFAULT',
        winningRuleId: null,
      });
      expect(byKey.has('m.b')).toBe(false);
    });

    it('el rol de otra organización no cuenta al resolver al usuario en la suya', async () => {
      await hide('m.b', 'ROLE', 'PATIENT');
      const res = await svc.preview({ userId: U_MEMBER1 }, admin1);
      expect(res.entries.map((e) => e.elementKey)).not.toContain('m.b');
    });

    it('«ver como» un rol', async () => {
      const r = await hide('m.b', 'ROLE', 'NURSE');
      const res = await svc.preview({ roleCode: 'NURSE' }, platform);
      expect(res.subject).toEqual({
        type: 'ROLE',
        id: 'NURSE',
        label: 'Enfermería',
      });
      expect(res.entries.find((e) => e.elementKey === 'm.b')).toMatchObject({
        winningRuleId: r.id,
      });
    });

    it('un rol global del token es válido; uno inexistente es 404', async () => {
      await expect(
        svc.preview({ roleCode: 'SECURITY_ADMIN' }, platform),
      ).resolves.toBeDefined();
      const e = await rejection(svc.preview({ roleCode: 'NO_ROLE' }, platform));
      expect(e).toMatchObject({
        status: 404,
        reason: R.UI_PREVIEW_SUBJECT_NOT_FOUND,
      });
    });

    it('404 UI_PREVIEW_SUBJECT_NOT_FOUND para un usuario inexistente y para uno ajeno (idénticos)', async () => {
      const ghost = await rejection(svc.preview({ userId: U_GHOST }, admin1));
      const foreign = await rejection(
        svc.preview({ userId: U_MEMBER2 }, admin1),
      );
      expect(foreign).toEqual(ghost);
      expect(foreign).toMatchObject({
        status: 404,
        reason: R.UI_PREVIEW_SUBJECT_NOT_FOUND,
      });
    });

    it('la plataforma puede ver como cualquier usuario', async () => {
      await hide('m.b', 'ALL', null);
      const res = await svc.preview({ userId: U_MEMBER2 }, platform);
      expect(res.entries.map((e) => e.elementKey)).toContain('m.b');
    });

    it('una regla acotada a otra organización no aparece en la vista previa', async () => {
      await hide('m.b', 'TENANT', T2, admin2);
      const res = await svc.preview({ userId: U_MEMBER1 }, admin1);
      expect(res.entries.map((e) => e.elementKey)).not.toContain('m.b');
    });

    it('sin reglas, sólo lo que oculta defaultVisible=false', async () => {
      const res = await svc.preview({ roleCode: 'NURSE' }, platform);
      expect(res.entries.map((e) => e.elementKey)).toEqual(['m.c']);
    });
  });
});
