import {
  hiddenKeysOf,
  isRuleInForce,
  pickWinningRule,
  resolveVisibility,
  ruleAppliesTo,
  visibilityVersion,
  type ResolvedEntry,
  type ResolverElement,
  type ResolverRule,
  type ResolverSubject,
} from './ui-visibility.resolver';
import {
  UI_PROTECTED_KEY_PREFIXES,
  isProtectedElementKey,
} from '../ui-visibility.constants';

const NOW = new Date('2026-10-31T12:00:00.000Z');
const minus = (ms: number) => new Date(NOW.getTime() - ms);
const plus = (ms: number) => new Date(NOW.getTime() + ms);
const HOUR = 3_600_000;

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '22222222-2222-4222-8222-222222222222';
const TENANT = '33333333-3333-4333-8333-333333333333';
const OTHER_TENANT = '44444444-4444-4444-8444-444444444444';

const subject = (over: Partial<ResolverSubject> = {}): ResolverSubject => ({
  userId: USER,
  tenantId: TENANT,
  roles: ['PRACTITIONER'],
  orgType: 'CLINIC',
  ...over,
});

let seq = 0;
const rule = (over: Partial<ResolverRule> = {}): ResolverRule => ({
  id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
  elementKey: 'pharmacy.orders.export-button',
  effect: 'HIDE',
  subjectType: 'ALL',
  subjectId: null,
  validFrom: null,
  validTo: null,
  endedAt: null,
  ...over,
});

const el = (
  key: string,
  parentKey: string | null = null,
  defaultVisible = true,
): ResolverElement => ({ key, parentKey, defaultVisible });

const one = (
  elements: ResolverElement[],
  rules: ResolverRule[],
  key: string,
  s: ResolverSubject = subject(),
): ResolvedEntry => {
  const found = resolveVisibility(elements, rules, s, NOW).find(
    (e) => e.elementKey === key,
  );
  if (!found) throw new Error(`sin entrada para ${key}`);
  return found;
};

const KEY = 'pharmacy.orders.export-button';

describe('resolveVisibility · sin reglas (defaultVisible)', () => {
  it('un elemento visible por omisión sin reglas queda visible, por DEFAULT', () => {
    expect(one([el(KEY)], [], KEY)).toEqual({
      elementKey: KEY,
      hidden: false,
      winningRuleId: null,
      reason: 'DEFAULT',
      ancestorKey: null,
    });
  });

  it('un elemento con defaultVisible=false sin reglas queda oculto, por DEFAULT', () => {
    const e = one([el(KEY, null, false)], [], KEY);
    expect(e.hidden).toBe(true);
    expect(e.reason).toBe('DEFAULT');
    expect(e.winningRuleId).toBeNull();
  });

  it('un catálogo vacío y reglas huérfanas no producen nada', () => {
    expect(resolveVisibility([], [rule()], subject(), NOW)).toEqual([]);
  });

  it('una regla sobre una clave que no está en el catálogo se ignora', () => {
    const r = rule({ elementKey: 'otro.modulo.cosa' });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });
});

describe('resolveVisibility · especificidad USER > TENANT > ROLE > ORG_TYPE > ALL', () => {
  const allHide = () => rule({ subjectType: 'ALL', effect: 'HIDE' });

  it('ALL oculta a todos', () => {
    const r = allHide();
    const e = one([el(KEY)], [r], KEY);
    expect(e).toMatchObject({
      hidden: true,
      reason: 'RULE',
      winningRuleId: r.id,
    });
  });

  it('ORG_TYPE SHOW gana a ALL HIDE', () => {
    const show = rule({
      subjectType: 'ORG_TYPE',
      subjectId: 'CLINIC',
      effect: 'SHOW',
    });
    const e = one([el(KEY)], [allHide(), show], KEY);
    expect(e).toMatchObject({ hidden: false, winningRuleId: show.id });
  });

  it('ROLE HIDE gana a ORG_TYPE SHOW', () => {
    const show = rule({
      subjectType: 'ORG_TYPE',
      subjectId: 'CLINIC',
      effect: 'SHOW',
    });
    const hide = rule({
      subjectType: 'ROLE',
      subjectId: 'PRACTITIONER',
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [show, hide], KEY)).toMatchObject({
      hidden: true,
      winningRuleId: hide.id,
    });
  });

  it('TENANT SHOW gana a ROLE HIDE', () => {
    const hide = rule({
      subjectType: 'ROLE',
      subjectId: 'PRACTITIONER',
      effect: 'HIDE',
    });
    const show = rule({
      subjectType: 'TENANT',
      subjectId: TENANT,
      effect: 'SHOW',
    });
    expect(one([el(KEY)], [hide, show], KEY)).toMatchObject({
      hidden: false,
      winningRuleId: show.id,
    });
  });

  it('USER HIDE gana a TENANT SHOW', () => {
    const show = rule({
      subjectType: 'TENANT',
      subjectId: TENANT,
      effect: 'SHOW',
    });
    const hide = rule({ subjectType: 'USER', subjectId: USER, effect: 'HIDE' });
    expect(one([el(KEY)], [show, hide], KEY)).toMatchObject({
      hidden: true,
      winningRuleId: hide.id,
    });
  });

  it('USER SHOW gana a toda la escalera de HIDE', () => {
    const rules = [
      rule({ subjectType: 'ALL', effect: 'HIDE' }),
      rule({ subjectType: 'ORG_TYPE', subjectId: 'CLINIC', effect: 'HIDE' }),
      rule({ subjectType: 'ROLE', subjectId: 'PRACTITIONER', effect: 'HIDE' }),
      rule({ subjectType: 'TENANT', subjectId: TENANT, effect: 'HIDE' }),
    ];
    const show = rule({ subjectType: 'USER', subjectId: USER, effect: 'SHOW' });
    expect(one([el(KEY)], [...rules, show], KEY)).toMatchObject({
      hidden: false,
      winningRuleId: show.id,
    });
  });

  it('el orden de las reglas no cambia el resultado', () => {
    const rules = [
      rule({ subjectType: 'ALL', effect: 'HIDE' }),
      rule({ subjectType: 'ROLE', subjectId: 'PRACTITIONER', effect: 'SHOW' }),
      rule({ subjectType: 'TENANT', subjectId: TENANT, effect: 'HIDE' }),
    ];
    const a = one([el(KEY)], rules, KEY);
    const b = one([el(KEY)], [...rules].reverse(), KEY);
    expect(a).toEqual(b);
    expect(a.hidden).toBe(true);
  });
});

describe('resolveVisibility · a quién aplica cada sujeto', () => {
  it('una regla de OTRO usuario no aplica', () => {
    const r = rule({
      subjectType: 'USER',
      subjectId: OTHER_USER,
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('una regla de OTRA organización no aplica', () => {
    const r = rule({
      subjectType: 'TENANT',
      subjectId: OTHER_TENANT,
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('una regla de un rol que el usuario no ejerce no aplica', () => {
    const r = rule({
      subjectType: 'ROLE',
      subjectId: 'PHARMACIST',
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('una regla de otro tipo de organización no aplica', () => {
    const r = rule({
      subjectType: 'ORG_TYPE',
      subjectId: 'PHARMACY',
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('un sujeto sin organización ni tipo no recibe reglas TENANT ni ORG_TYPE', () => {
    const s = subject({ tenantId: null, orgType: null });
    const rules = [
      rule({ subjectType: 'TENANT', subjectId: TENANT, effect: 'HIDE' }),
      rule({ subjectType: 'ORG_TYPE', subjectId: 'CLINIC', effect: 'HIDE' }),
    ];
    expect(one([el(KEY)], rules, KEY, s).hidden).toBe(false);
  });

  it('con userId nulo, una regla USER con subjectId nulo (dato corrupto) no aplica', () => {
    const corrupt = rule({
      subjectType: 'USER',
      subjectId: null,
      effect: 'HIDE',
    });
    expect(
      one([el(KEY)], [corrupt], KEY, subject({ userId: null })).hidden,
    ).toBe(false);
  });

  it('un subjectType desconocido (dato corrupto) no aplica a nadie', () => {
    const corrupt = rule({
      subjectType: 'GROUP' as unknown as ResolverRule['subjectType'],
      subjectId: 'x',
    });
    expect(ruleAppliesTo(corrupt, subject())).toBe(false);
    expect(one([el(KEY)], [corrupt], KEY).hidden).toBe(false);
  });
});

describe('resolveVisibility · ámbito de organización (scopeTenantId)', () => {
  it('una regla acotada a la organización del sujeto aplica', () => {
    const r = rule({
      subjectType: 'USER',
      subjectId: USER,
      scopeTenantId: TENANT,
    });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(true);
  });

  it('una regla acotada a OTRA organización no aplica aunque el usuario sea el mismo', () => {
    const r = rule({
      subjectType: 'USER',
      subjectId: USER,
      scopeTenantId: OTHER_TENANT,
    });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('una regla acotada no aplica si el sujeto no actúa en ninguna organización', () => {
    const r = rule({
      subjectType: 'USER',
      subjectId: USER,
      scopeTenantId: TENANT,
    });
    expect(one([el(KEY)], [r], KEY, subject({ tenantId: null })).hidden).toBe(
      false,
    );
  });

  it('una regla de plataforma (sin ámbito) aplica en cualquier organización', () => {
    const r = rule({ scopeTenantId: null });
    expect(
      one([el(KEY)], [r], KEY, subject({ tenantId: OTHER_TENANT })).hidden,
    ).toBe(true);
    expect(one([el(KEY)], [r], KEY, subject({ tenantId: null })).hidden).toBe(
      true,
    );
  });
});

describe('resolveVisibility · empates: HIDE gana a SHOW', () => {
  it('ROLE SHOW y ROLE HIDE sobre dos roles del mismo usuario: gana HIDE', () => {
    const s = subject({ roles: ['PRACTITIONER', 'NURSE'] });
    const show = rule({
      subjectType: 'ROLE',
      subjectId: 'PRACTITIONER',
      effect: 'SHOW',
    });
    const hide = rule({
      subjectType: 'ROLE',
      subjectId: 'NURSE',
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [show, hide], KEY, s)).toMatchObject({
      hidden: true,
      winningRuleId: hide.id,
    });
    expect(one([el(KEY)], [hide, show], KEY, s).hidden).toBe(true);
  });

  it('dos ROLE SHOW (sin HIDE) muestran', () => {
    const s = subject({ roles: ['PRACTITIONER', 'NURSE'] });
    const a = rule({
      subjectType: 'ROLE',
      subjectId: 'PRACTITIONER',
      effect: 'SHOW',
    });
    const b = rule({ subjectType: 'ROLE', subjectId: 'NURSE', effect: 'SHOW' });
    expect(one([el(KEY, null, false)], [a, b], KEY, s).hidden).toBe(false);
  });

  it('empate total (mismo tipo y efecto): gana el id menor, en cualquier orden', () => {
    const s = subject({ roles: ['A', 'B'] });
    const a = rule({
      id: 'aaaa',
      subjectType: 'ROLE',
      subjectId: 'A',
      effect: 'HIDE',
    });
    const b = rule({
      id: 'bbbb',
      subjectType: 'ROLE',
      subjectId: 'B',
      effect: 'HIDE',
    });
    expect(one([el(KEY)], [b, a], KEY, s).winningRuleId).toBe('aaaa');
    expect(one([el(KEY)], [a, b], KEY, s).winningRuleId).toBe('aaaa');
  });

  it('el empate no sube de nivel: un ROLE HIDE no le gana a un TENANT SHOW', () => {
    const hide = rule({
      subjectType: 'ROLE',
      subjectId: 'PRACTITIONER',
      effect: 'HIDE',
    });
    const show = rule({
      subjectType: 'TENANT',
      subjectId: TENANT,
      effect: 'SHOW',
    });
    expect(one([el(KEY)], [hide, show], KEY).hidden).toBe(false);
  });

  it('pickWinningRule sin reglas devuelve null', () => {
    expect(pickWinningRule([])).toBeNull();
  });
});

describe('resolveVisibility · vigencia', () => {
  it('una regla vigente (dentro de la ventana) aplica', () => {
    const r = rule({ validFrom: minus(HOUR), validTo: plus(HOUR) });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(true);
  });

  it('una regla vencida no aplica', () => {
    const r = rule({ validTo: minus(HOUR) });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('una regla futura todavía no aplica', () => {
    const r = rule({ validFrom: plus(HOUR) });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('límite: validFrom == ahora es inclusive', () => {
    expect(isRuleInForce(rule({ validFrom: NOW }), NOW)).toBe(true);
  });

  it('límite: validTo == ahora es exclusive', () => {
    expect(isRuleInForce(rule({ validTo: NOW }), NOW)).toBe(false);
  });

  it('una regla terminada no aplica aunque su ventana siga abierta', () => {
    const r = rule({ endedAt: minus(1), validTo: minus(1) });
    expect(one([el(KEY)], [r], KEY).hidden).toBe(false);
  });

  it('una regla vencida deja pasar a la siguiente más general', () => {
    const expired = rule({
      subjectType: 'USER',
      subjectId: USER,
      effect: 'HIDE',
      validTo: minus(HOUR),
    });
    const general = rule({ subjectType: 'ALL', effect: 'SHOW' });
    expect(one([el(KEY, null, false)], [expired, general], KEY)).toMatchObject({
      hidden: false,
      winningRuleId: general.id,
    });
  });

  it('una regla vigente sólo hasta mañana oculta hoy y no pasado mañana', () => {
    const r = rule({ validTo: plus(24 * HOUR) });
    expect(isRuleInForce(r, NOW)).toBe(true);
    expect(isRuleInForce(r, plus(48 * HOUR))).toBe(false);
  });
});

describe('resolveVisibility · cascada de ancestros', () => {
  const tree = [
    el('pharmacy'),
    el('pharmacy.orders', 'pharmacy'),
    el('pharmacy.orders.export-button', 'pharmacy.orders'),
  ];

  it('ocultar el padre oculta al hijo aunque el hijo tenga un SHOW propio', () => {
    const hideParent = rule({ elementKey: 'pharmacy.orders', effect: 'HIDE' });
    const showChild = rule({
      elementKey: 'pharmacy.orders.export-button',
      subjectType: 'USER',
      subjectId: USER,
      effect: 'SHOW',
    });
    const child = one(
      tree,
      [hideParent, showChild],
      'pharmacy.orders.export-button',
    );
    expect(child).toEqual({
      elementKey: 'pharmacy.orders.export-button',
      hidden: true,
      winningRuleId: null,
      reason: 'ANCESTOR_HIDDEN',
      ancestorKey: 'pharmacy.orders',
    });
  });

  it('con varios ancestros ocultos, ancestorKey es el más alto', () => {
    const rules = [
      rule({ elementKey: 'pharmacy', effect: 'HIDE' }),
      rule({ elementKey: 'pharmacy.orders', effect: 'HIDE' }),
    ];
    expect(one(tree, rules, 'pharmacy.orders.export-button').ancestorKey).toBe(
      'pharmacy',
    );
    // El intermedio se oculta por su propia regla: conserva RULE y no se reporta como cascada.
    expect(one(tree, rules, 'pharmacy.orders')).toMatchObject({
      hidden: true,
      reason: 'RULE',
      ancestorKey: null,
    });
  });

  it('el padre que se oculta por defaultVisible=false también oculta al hijo', () => {
    const t = [el('a', null, false), el('a.b', 'a')];
    expect(one(t, [], 'a.b')).toMatchObject({
      hidden: true,
      reason: 'ANCESTOR_HIDDEN',
      ancestorKey: 'a',
    });
  });

  it('el hijo que se oculta a sí mismo conserva su regla (no se reporta como cascada)', () => {
    const hideChild = rule({
      elementKey: 'pharmacy.orders.export-button',
      effect: 'HIDE',
    });
    const child = one(tree, [hideChild], 'pharmacy.orders.export-button');
    expect(child).toMatchObject({
      hidden: true,
      reason: 'RULE',
      winningRuleId: hideChild.id,
    });
  });

  it('ocultar un hijo no oculta al padre ni al abuelo', () => {
    const hideChild = rule({
      elementKey: 'pharmacy.orders.export-button',
      effect: 'HIDE',
    });
    expect(one(tree, [hideChild], 'pharmacy.orders').hidden).toBe(false);
    expect(one(tree, [hideChild], 'pharmacy').hidden).toBe(false);
  });

  it('un SHOW en el padre no resucita al hijo oculto por su propia regla', () => {
    const rules = [
      rule({ elementKey: 'pharmacy.orders', effect: 'SHOW' }),
      rule({ elementKey: 'pharmacy.orders.export-button', effect: 'HIDE' }),
    ];
    expect(one(tree, rules, 'pharmacy.orders.export-button').hidden).toBe(true);
  });

  it('una regla que ya no está en vigor en el padre no cascadea', () => {
    const expired = rule({
      elementKey: 'pharmacy.orders',
      effect: 'HIDE',
      validTo: minus(HOUR),
    });
    expect(one(tree, [expired], 'pharmacy.orders.export-button').hidden).toBe(
      false,
    );
  });

  it('un parentKey que no está en el catálogo corta la cadena sin romper', () => {
    const t = [el('x.y', 'x')];
    expect(one(t, [], 'x.y')).toMatchObject({
      hidden: false,
      reason: 'DEFAULT',
    });
  });

  it('un ciclo en la jerarquía (dato corrupto) termina y no oculta por error', () => {
    const t = [el('a', 'b'), el('b', 'a')];
    expect(
      resolveVisibility(t, [], subject(), NOW).map((e) => e.hidden),
    ).toEqual([false, false]);
    const hideA = rule({ elementKey: 'a', effect: 'HIDE' });
    expect(one(t, [hideA], 'b')).toMatchObject({
      hidden: true,
      reason: 'ANCESTOR_HIDDEN',
      ancestorKey: 'a',
    });
  });

  it('el elemento que es su propio padre (dato corrupto) no se oculta a sí mismo por cascada', () => {
    const t = [el('a', 'a')];
    expect(one(t, [], 'a').hidden).toBe(false);
  });
});

describe('resolveVisibility · determinismo de la salida', () => {
  it('devuelve una entrada por elemento, ordenada por clave', () => {
    const out = resolveVisibility(
      [el('b.x'), el('a.x'), el('c.x')],
      [],
      subject(),
      NOW,
    );
    expect(out.map((e) => e.elementKey)).toEqual(['a.x', 'b.x', 'c.x']);
  });

  it('no muta sus entradas', () => {
    const elements = [el(KEY)];
    const rules = [rule()];
    const snapshot = JSON.stringify({ elements, rules });
    resolveVisibility(elements, rules, subject(), NOW);
    expect(JSON.stringify({ elements, rules })).toBe(snapshot);
  });
});

describe('hiddenKeysOf y visibilityVersion', () => {
  const entries: ResolvedEntry[] = [
    {
      elementKey: 'b',
      hidden: true,
      winningRuleId: null,
      reason: 'DEFAULT',
      ancestorKey: null,
    },
    {
      elementKey: 'a',
      hidden: true,
      winningRuleId: null,
      reason: 'DEFAULT',
      ancestorKey: null,
    },
    {
      elementKey: 'c',
      hidden: false,
      winningRuleId: null,
      reason: 'DEFAULT',
      ancestorKey: null,
    },
  ];

  it('sólo devuelve lo oculto y ordenado', () => {
    expect(hiddenKeysOf(entries)).toEqual(['a', 'b']);
  });

  it('sin nada oculto, lista vacía y versión estable', () => {
    expect(hiddenKeysOf([])).toEqual([]);
    expect(visibilityVersion([])).toBe(visibilityVersion([]));
  });

  it('la versión no depende del orden y cambia con el conjunto', () => {
    expect(visibilityVersion(['a', 'b'])).toBe(visibilityVersion(['b', 'a']));
    expect(visibilityVersion(['a', 'b'])).not.toBe(visibilityVersion(['a']));
    expect(visibilityVersion(['a'])).not.toBe(visibilityVersion([]));
  });
});

describe('resolveVisibility · protección anti-bloqueo de las pantallas de gobierno', () => {
  const RULES_SCREEN = 'nav.superadmin.visibility-rules';
  const CATALOG_SCREEN = 'nav.administration.catalog';
  const admin = (role: string) => subject({ roles: [role] });

  it('la constante cubre los dos prefijos y la propia sección', () => {
    expect(isProtectedElementKey(RULES_SCREEN)).toBe(true);
    expect(isProtectedElementKey(CATALOG_SCREEN)).toBe(true);
    expect(isProtectedElementKey('nav.superadmin')).toBe(true);
    expect(isProtectedElementKey('nav.superadministration.x')).toBe(false);
    expect(isProtectedElementKey('nav.clinical.patients')).toBe(false);
    expect(UI_PROTECTED_KEY_PREFIXES).toEqual([
      'nav.superadmin.',
      'nav.administration.',
    ]);
  });

  it.each(['SUPERADMIN', 'SECURITY_ADMIN'])(
    'un HIDE sobre una pantalla protegida se ignora para %s',
    (role) => {
      const hide = rule({
        elementKey: RULES_SCREEN,
        subjectType: 'ALL',
        effect: 'HIDE',
      });
      const e = one([el(RULES_SCREEN)], [hide], RULES_SCREEN, admin(role));
      expect(e).toMatchObject({
        hidden: false,
        winningRuleId: null,
        reason: 'DEFAULT',
      });
    },
  );

  it('se ignoran también los HIDE más específicos (USER, TENANT, ROLE) y el defaultVisible=false', () => {
    const rules = [
      rule({
        elementKey: CATALOG_SCREEN,
        subjectType: 'USER',
        subjectId: USER,
        effect: 'HIDE',
      }),
      rule({
        elementKey: CATALOG_SCREEN,
        subjectType: 'TENANT',
        subjectId: TENANT,
        effect: 'HIDE',
      }),
      rule({
        elementKey: CATALOG_SCREEN,
        subjectType: 'ROLE',
        subjectId: 'SECURITY_ADMIN',
        effect: 'HIDE',
      }),
    ];
    expect(
      one(
        [el(CATALOG_SCREEN, null, false)],
        rules,
        CATALOG_SCREEN,
        admin('SECURITY_ADMIN'),
      ).hidden,
    ).toBe(false);
  });

  it('el administrador con varios roles queda protegido si alguno es de administración', () => {
    const hide = rule({ elementKey: RULES_SCREEN, effect: 'HIDE' });
    const s = subject({ roles: ['NURSE', 'SECURITY_ADMIN'] });
    expect(one([el(RULES_SCREEN)], [hide], RULES_SCREEN, s).hidden).toBe(false);
  });

  it('un SHOW sobre la pantalla sigue siendo la regla ganadora cuando hay HIDE ignorados', () => {
    const hide = rule({
      elementKey: RULES_SCREEN,
      subjectType: 'ALL',
      effect: 'HIDE',
    });
    const show = rule({
      elementKey: RULES_SCREEN,
      subjectType: 'ROLE',
      subjectId: 'SUPERADMIN',
      effect: 'SHOW',
    });
    expect(
      one([el(RULES_SCREEN)], [hide, show], RULES_SCREEN, admin('SUPERADMIN')),
    ).toMatchObject({
      hidden: false,
      winningRuleId: show.id,
      reason: 'RULE',
    });
  });

  it('la cascada de un ancestro oculto tampoco alcanza a la pantalla protegida del administrador', () => {
    const tree = [el('nav'), el(RULES_SCREEN, 'nav')];
    const hideNav = rule({ elementKey: 'nav', effect: 'HIDE' });
    expect(
      one(tree, [hideNav], RULES_SCREEN, admin('SUPERADMIN')),
    ).toMatchObject({
      hidden: false,
      reason: 'DEFAULT',
      ancestorKey: null,
    });
  });

  it('CONTRASTE: los mismos HIDE SÍ se aplican a quien no administra', () => {
    const hide = rule({
      elementKey: RULES_SCREEN,
      subjectType: 'ALL',
      effect: 'HIDE',
    });
    for (const roles of [['PRACTITIONER'], ['NURSE', 'PATIENT'], []]) {
      const e = one(
        [el(RULES_SCREEN)],
        [hide],
        RULES_SCREEN,
        subject({ roles }),
      );
      expect(e).toMatchObject({
        hidden: true,
        winningRuleId: hide.id,
        reason: 'RULE',
      });
    }
    const tree = [el('nav'), el(RULES_SCREEN, 'nav')];
    const hideNav = rule({ elementKey: 'nav', effect: 'HIDE' });
    expect(
      one(tree, [hideNav], RULES_SCREEN, subject({ roles: ['PRACTITIONER'] }))
        .reason,
    ).toBe('ANCESTOR_HIDDEN');
  });

  it('CONTRASTE: un elemento NO protegido sí se oculta al administrador', () => {
    const hide = rule({ elementKey: 'nav.clinical.patients', effect: 'HIDE' });
    expect(
      one(
        [el('nav.clinical.patients')],
        [hide],
        'nav.clinical.patients',
        admin('SUPERADMIN'),
      ).hidden,
    ).toBe(true);
  });

  it('un rol de organización llamado igual pero que no es administración no recibe la protección', () => {
    const hide = rule({ elementKey: RULES_SCREEN, effect: 'HIDE' });
    expect(
      one(
        [el(RULES_SCREEN)],
        [hide],
        RULES_SCREEN,
        subject({ roles: ['SUPERADMIN_ASSISTANT'] }),
      ).hidden,
    ).toBe(true);
  });
});
