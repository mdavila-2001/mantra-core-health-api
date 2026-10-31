import {
  CONDITION_ERROR_CODES,
  CONDITION_MAX_BYTES,
  deviceCookieEnabledFromEnv,
  validateCondition,
  type ConditionError,
  type ValidateConditionOptions,
} from './support-conditions.validate';

const codes = (errors: readonly ConditionError[]): string[] =>
  errors.map((e) => e.code);

/** Una condición real: 1 a 4 claves. */
const VALID_CANCEL = {
  schemaVersion: 1,
  appointment: { leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' } },
  limits: [{ metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' }],
  patients: { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } },
};
const CANCEL: ValidateConditionOptions = {
  atom: 'agenda.appointment.cancel',
  effect: 'ALLOW',
};

describe('AC-3 · validateCondition · los 12 códigos de §3.10', () => {
  it('lista exactamente los 12 códigos del contrato más el de valor inválido', () => {
    expect([...CONDITION_ERROR_CODES].sort()).toEqual(
      [
        'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
        'CONDITION_UNKNOWN_KEY',
        'CONDITION_TOO_LARGE',
        'CONDITION_TIME_EMPTY_WINDOW',
        'CONDITION_TIME_ZONE_INVALID',
        'CONDITION_LIMIT_INVALID',
        'CONDITION_NOT_APPLICABLE_TO_ATOM',
        'CONDITION_NOT_ALLOWED_ON_DENY',
        'CONDITION_FIELD_NOT_GRANTED',
        'CONDITION_NETWORK_NO_RULES',
        'CONDITION_OBLIGATION_LOOSENS_CATALOG',
        'CONDITION_CEILING_FORBIDDEN_ATOM',
        'CONDITION_VALUE_INVALID',
      ].sort(),
    );
  });

  it('una condición válida no tiene errores', () => {
    expect(validateCondition(VALID_CANCEL, CANCEL)).toEqual([]);
  });

  it('1 · CONDITION_SCHEMA_VERSION_UNSUPPORTED: falta, no es entero o no es la 1', () => {
    for (const bad of [
      {},
      { schemaVersion: 2 },
      { schemaVersion: '1' },
      { schemaVersion: 1.5 },
      { schemaVersion: 0 },
    ]) {
      expect(codes(validateCondition(bad, CANCEL))).toContain(
        'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
      );
    }
    const [error] = validateCondition({ schemaVersion: 2 }, CANCEL);
    expect(error).toMatchObject({
      path: 'schemaVersion',
      atom: 'agenda.appointment.cancel',
    });
  });

  it('2 · CONDITION_UNKNOWN_KEY: claves cerradas en todos los niveles', () => {
    expect(
      codes(validateCondition({ schemaVersion: 1, horario: {} }, CANCEL)),
    ).toEqual(['CONDITION_UNKNOWN_KEY']);
    const nested = validateCondition(
      {
        schemaVersion: 1,
        appointment: {
          leadTime: { minHours: 24, onViolation: 'DENY', extra: 1 },
        },
      },
      CANCEL,
    );
    expect(nested).toMatchObject([
      { code: 'CONDITION_UNKNOWN_KEY', path: 'appointment.leadTime.extra' },
    ]);
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            time: {
              windows: [{ days: [1], from: '08:00', to: '09:00', x: 1 }],
            },
          },
          CANCEL,
        ),
      ),
    ).toEqual(['CONDITION_UNKNOWN_KEY']);
  });

  it('3 · CONDITION_TOO_LARGE: más de 8 KiB', () => {
    expect(CONDITION_MAX_BYTES).toBe(8192);
    const big = {
      schemaVersion: 1,
      patients: { exclude: { flags: [] }, carrier: 'x'.repeat(9000) },
    };
    expect(codes(validateCondition(big, CANCEL))).toEqual([
      'CONDITION_TOO_LARGE',
    ]);
  });

  it('4 · CONDITION_TIME_EMPTY_WINDOW: from == to (C-02)', () => {
    const errors = validateCondition(
      {
        schemaVersion: 1,
        time: { windows: [{ days: [5], from: '08:00', to: '08:00' }] },
      },
      CANCEL,
    );
    expect(errors).toMatchObject([
      { code: 'CONDITION_TIME_EMPTY_WINDOW', path: 'time.windows[0]' },
    ]);
    // cruzar la medianoche (from > to) sí es válido.
    expect(
      validateCondition(
        {
          schemaVersion: 1,
          time: { windows: [{ days: [5], from: '22:00', to: '06:00' }] },
        },
        CANCEL,
      ),
    ).toEqual([]);
  });

  it('5 · CONDITION_TIME_ZONE_INVALID', () => {
    const errors = validateCondition(
      {
        schemaVersion: 1,
        time: {
          timeZone: 'Marte/Olympus',
          windows: [{ days: [1], from: '08:00', to: '09:00' }],
        },
      },
      CANCEL,
    );
    expect(errors).toMatchObject([
      { code: 'CONDITION_TIME_ZONE_INVALID', path: 'time.timeZone' },
    ]);
  });

  it('6 · CONDITION_LIMIT_INVALID: lista vacía, más de 6, tope fuera de 1-10000, métrica, periodo, grupo', () => {
    const limit = { metric: 'ACTIONS', per: 'DAY', max: 20, onExceed: 'DENY' };
    const bad: unknown[] = [
      [],
      [limit, limit, limit, limit, limit, limit, limit],
      [{ ...limit, max: 0 }],
      [{ ...limit, max: 10001 }],
      [{ ...limit, max: 1.5 }],
      [{ ...limit, metric: 'BYTES' }],
      [{ ...limit, per: 'MONTH' }],
      [{ ...limit, scope: 'TEAM' }],
      [{ ...limit, group: 'Con Mayúsculas' }],
      [{ ...limit, group: 'x'.repeat(41) }],
      [{ ...limit, onExceed: 'IGNORE' }],
    ];
    for (const limits of bad) {
      expect(
        codes(validateCondition({ schemaVersion: 1, limits }, CANCEL)),
      ).toContain('CONDITION_LIMIT_INVALID');
    }
  });

  it('7 · CONDITION_NOT_APPLICABLE_TO_ATOM', () => {
    const errors = validateCondition(
      {
        schemaVersion: 1,
        appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } },
      },
      { atom: 'agenda.appointment.create', effect: 'ALLOW' },
    );
    expect(errors).toMatchObject([
      {
        code: 'CONDITION_NOT_APPLICABLE_TO_ATOM',
        path: 'appointment.leadTime',
        atom: 'agenda.appointment.create',
      },
    ]);
  });

  it('8 · CONDITION_NOT_ALLOWED_ON_DENY', () => {
    const errors = validateCondition(
      {
        schemaVersion: 1,
        limits: [{ metric: 'ACTIONS', per: 'DAY', max: 5, onExceed: 'DENY' }],
      },
      { atom: 'agenda.appointment.view.reason', effect: 'DENY' },
    );
    expect(codes(errors)).toEqual(['CONDITION_NOT_ALLOWED_ON_DENY']);
  });

  it('9 · CONDITION_FIELD_NOT_GRANTED: el campo no está en el mismo permiso', () => {
    const cond = {
      schemaVersion: 1,
      fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
    };
    expect(
      codes(
        validateCondition(cond, {
          effect: 'ALLOW',
          grantAtoms: ['agenda.appointment.view'],
        }),
      ),
    ).toEqual(['CONDITION_FIELD_NOT_GRANTED']);
    expect(
      validateCondition(cond, {
        effect: 'ALLOW',
        grantAtoms: [
          'agenda.appointment.view',
          'agenda.appointment.view.reason',
        ],
      }),
    ).toEqual([]);
    // SEG A-A2: un alias ya no admite condiciones (antes se aceptaban y el
    // motor las ignoraba): se exige escribir los permisos específicos.
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            fields: {
              'agenda.appointment.view.patient_name': { mask: 'PARTIAL' },
            },
          },
          { effect: 'ALLOW', grantAtoms: ['schedule.view'] },
        ),
      ),
    ).toEqual(['CONDITION_NOT_APPLICABLE_TO_ATOM']);
    // un átomo que no es de campo tampoco se puede enmascarar
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            fields: { 'agenda.appointment.cancel': { mask: 'PARTIAL' } },
          },
          { effect: 'ALLOW', grantAtoms: ['agenda.appointment.cancel'] },
        ),
      ),
    ).toEqual(['CONDITION_FIELD_NOT_GRANTED']);
  });

  it('10 · CONDITION_NETWORK_NO_RULES: ORG_RULES sin ninguna regla ALLOW', () => {
    const cond = { schemaVersion: 1, network: { require: 'ORG_RULES' } };
    expect(
      codes(validateCondition(cond, { ...CANCEL, orgHasAllowRules: false })),
    ).toEqual(['CONDITION_NETWORK_NO_RULES']);
    expect(
      validateCondition(cond, { ...CANCEL, orgHasAllowRules: true }),
    ).toEqual([]);
    // sin dato no se puede afirmar: no se rechaza
    expect(validateCondition(cond, CANCEL)).toEqual([]);
    expect(
      validateCondition(
        { schemaVersion: 1, network: { require: 'ANY' } },
        { ...CANCEL, orgHasAllowRules: false },
      ),
    ).toEqual([]);
  });

  it('11 · CONDITION_OBLIGATION_LOOSENS_CATALOG: no cambia al aprobador ni alarga el segundo paso del catálogo', () => {
    const void_: ValidateConditionOptions = {
      atom: 'billing.receipt.void',
      effect: 'ALLOW',
    };
    expect(
      codes(
        validateCondition(
          { schemaVersion: 1, obligations: { approval: { by: 'DOCTOR' } } },
          void_,
        ),
      ),
    ).toEqual(['CONDITION_OBLIGATION_LOOSENS_CATALOG']);
    expect(
      codes(
        validateCondition(
          { schemaVersion: 1, obligations: { stepUp: { maxAgeMinutes: 30 } } },
          void_,
        ),
      ),
    ).toEqual(['CONDITION_OBLIGATION_LOOSENS_CATALOG']);
    // endurecer sí
    expect(
      validateCondition(
        {
          schemaVersion: 1,
          obligations: {
            approval: { by: 'SECOND_APPROVER', ttlMinutes: 30 },
            stepUp: { maxAgeMinutes: 5 },
            requireReason: { minLength: 20 },
          },
        },
        void_,
      ),
    ).toEqual([]);
    // a nivel de permiso se mira cada átomo del permiso
    expect(
      codes(
        validateCondition(
          { schemaVersion: 1, obligations: { approval: { by: 'DOCTOR' } } },
          {
            effect: 'ALLOW',
            grantAtoms: ['billing.receipt.void', 'agenda.appointment.view'],
          },
        ),
      ),
    ).toEqual(['CONDITION_OBLIGATION_LOOSENS_CATALOG']);
  });

  it('12 · CONDITION_CEILING_FORBIDDEN_ATOM: allowAtoms abre lo que un delegado nunca puede dar (GP-5)', () => {
    const assign: ValidateConditionOptions = {
      atom: 'team.grants.assign',
      effect: 'ALLOW',
    };
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            delegationCeiling: { allowAtoms: ['billing.*'] },
          },
          assign,
        ),
      ),
    ).toEqual(['CONDITION_CEILING_FORBIDDEN_ATOM']);
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            delegationCeiling: { allowAtoms: ['team.members.view'] },
          },
          assign,
        ),
      ),
    ).toEqual(['CONDITION_CEILING_FORBIDDEN_ATOM']);
    expect(
      validateCondition(
        {
          schemaVersion: 1,
          delegationCeiling: {
            allowAtoms: [
              'agenda.*',
              'patients.search.exact',
              'messages.inbox.view',
            ],
            forbidAtoms: ['billing.*'],
            templates: ['SECRETARY', 'FRONT_DESK'],
            maxValidDays: 180,
          },
        },
        assign,
      ),
    ).toEqual([]);
    // billing.* permitido pero prohibido a la vez: lo que el delegado no puede dar ya queda fuera
    expect(
      validateCondition(
        {
          schemaVersion: 1,
          delegationCeiling: {
            allowAtoms: ['billing.invoice.view'],
            forbidAtoms: [],
          },
        },
        assign,
      ),
    ).toEqual([]);
  });
});

describe('AC-3 · validateCondition · las 9 combinaciones de §3.6', () => {
  const ok = (cond: object, atom: string): string[] =>
    codes(
      validateCondition(
        { schemaVersion: 1, ...cond },
        { atom, effect: 'ALLOW' },
      ),
    );
  const NA = ['CONDITION_NOT_APPLICABLE_TO_ATOM'];

  it('limits[DISTINCT_PATIENTS]', () => {
    const cond = {
      limits: [
        { metric: 'DISTINCT_PATIENTS', per: 'HOUR', max: 15, onExceed: 'DENY' },
      ],
    };
    for (const atom of [
      'patients.search.exact',
      'patients.profile.view_basic',
      'patients.profile.view.phone_full',
      'agenda.appointment.view',
      'agenda.appointment.view.reason',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    // N-8: ninguna ruta evalúa condiciones de reportes ni de actividad.
    expect(ok(cond, 'reports.agenda.export')).toEqual(NA);
    expect(ok(cond, 'agenda.appointment.cancel')).toEqual(NA);
    expect(ok(cond, 'billing.payment.collect')).toEqual(NA);
  });

  it('patients.* (menos register)', () => {
    const cond = { patients: { exclude: { minors: true } } };
    for (const atom of [
      'agenda.appointment.cancel',
      'agenda.appointment.view.reason',
      'patients.search.exact',
      'patients.profile.edit_contact',
      'messages.conversation.reply_on_behalf',
      'messages.attachment.send',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    expect(ok(cond, 'patients.profile.register')).toEqual(NA);
    expect(ok(cond, 'billing.payment.collect')).toEqual(NA);
    expect(ok(cond, 'messages.inbox.view')).toEqual(NA);
  });

  it('appointment.window', () => {
    const cond = { appointment: { window: { daysBefore: 1, daysAfter: 14 } } };
    expect(ok(cond, 'agenda.appointment.view.reason')).toEqual([]);
    expect(ok(cond, 'agenda.waitlist.manage')).toEqual(NA);
    expect(ok(cond, 'patients.search.exact')).toEqual(NA);
  });

  it('appointment.leadTime', () => {
    const cond = {
      appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } },
    };
    expect(ok(cond, 'agenda.appointment.cancel')).toEqual([]);
    expect(ok(cond, 'agenda.appointment.reschedule')).toEqual([]);
    expect(ok(cond, 'agenda.appointment.confirm')).toEqual(NA);
    expect(ok(cond, 'agenda.appointment.create')).toEqual(NA);
  });

  it('appointment.horizon', () => {
    const cond = { appointment: { horizon: { maxDaysAhead: 90 } } };
    for (const atom of [
      'agenda.appointment.create',
      'agenda.appointment.create.overbook',
      'agenda.appointment.reschedule',
      'agenda.appointment.walk_in',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    expect(ok(cond, 'agenda.appointment.cancel')).toEqual(NA);
  });

  it('channels', () => {
    const cond = { channels: { allow: ['CHAT'] } };
    for (const atom of [
      'messages.conversation.reply_on_behalf',
      'messages.attachment.send',
      'messages.broadcast.send',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    expect(ok(cond, 'messages.conversation.assign')).toEqual(NA);
    expect(ok(cond, 'agenda.appointment.create')).toEqual(NA);
  });

  it('amount', () => {
    const cond = {
      amount: { currency: 'BOB', perTransactionMax: 500, onExceed: 'DENY' },
    };
    for (const atom of [
      'billing.payment.collect',
      'billing.receipt.issue',
      'billing.receipt.void',
      'billing.payment.refund',
      'billing.discount.apply',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    expect(ok(cond, 'billing.invoice.view')).toEqual(NA);
    expect(ok(cond, 'billing.cashbox.close')).toEqual(NA);
  });

  it('presence', () => {
    const cond = { presence: { doctor: 'ONLINE' } };
    for (const atom of [
      'agenda.appointment.cancel',
      'agenda.waitlist.manage',
      'messages.conversation.reply_on_behalf',
      'patients.clinical.request_temporary_access',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    expect(ok(cond, 'billing.payment.collect')).toEqual(NA);
    expect(ok(cond, 'patients.search.exact')).toEqual(NA);
  });

  it('delegationCeiling', () => {
    const cond = { delegationCeiling: { allowAtoms: ['agenda.*'] } };
    for (const atom of [
      'team.grants.assign',
      'team.requests.decide',
      'team.invitations.create',
    ]) {
      expect(ok(cond, atom)).toEqual([]);
    }
    expect(ok(cond, 'team.grants.revoke')).toEqual(NA);
    expect(ok(cond, 'agenda.appointment.view')).toEqual(NA);
  });

  it('las claves universales (time, session, network, device, obligations, limits[ACTIONS]) valen para todo átomo asignable y para ningún no asignable', () => {
    const universal = {
      time: { windows: [{ days: [1], from: '08:00', to: '09:00' }] },
      session: { maxSessionMinutes: 60 },
      network: { require: 'ANY' },
      device: { knownOnly: true },
      obligations: { requireReason: { minLength: 10 } },
      limits: [{ metric: 'ACTIONS', per: 'DAY', max: 5, onExceed: 'DENY' }],
    };
    expect(ok(universal, 'billing.invoice.view')).toEqual([]);
    // N-8: la actividad y los reportes ya no se condicionan (ninguna ruta las evalúa).
    expect(ok(universal, 'audit.activity.view_org')).toEqual(NA);
    expect(
      codes(
        validateCondition(
          { schemaVersion: 1, ...universal },
          { atom: 'team.guardrails.manage', effect: 'ALLOW' },
        ),
      ),
    ).toContain('CONDITION_NOT_APPLICABLE_TO_ATOM');
  });

  it('a nivel de permiso basta con que algún átomo del permiso acepte la clave', () => {
    const cond = {
      schemaVersion: 1,
      appointment: { leadTime: { minHours: 24, onViolation: 'DENY' } },
    };
    expect(
      validateCondition(cond, {
        effect: 'ALLOW',
        grantAtoms: ['agenda.appointment.view', 'agenda.appointment.cancel'],
      }),
    ).toEqual([]);
    expect(
      codes(
        validateCondition(cond, {
          effect: 'ALLOW',
          grantAtoms: ['agenda.appointment.view', 'agenda.appointment.create'],
        }),
      ),
    ).toEqual(['CONDITION_NOT_APPLICABLE_TO_ATOM']);
  });
});

describe('AC-3 · validateCondition · filas DENY', () => {
  const deny = (
    cond: object,
    atom = 'agenda.appointment.view.reason',
  ): string[] =>
    codes(
      validateCondition(
        { schemaVersion: 1, ...cond },
        { atom, effect: 'DENY' },
      ),
    );

  it('aceptan time, patients (isMinor, age, coverage, flags.anyOf), appointment.window, leadTime, channels y presence', () => {
    expect(
      deny({ time: { windows: [{ days: [1], from: '08:00', to: '09:00' }] } }),
    ).toEqual([]);
    expect(deny({ patients: { isMinor: true } })).toEqual([]);
    expect(
      deny({
        patients: {
          age: { max: 17 },
          coverage: { mode: 'INSURED_ONLY' },
          flags: { anyOf: ['CONFIDENTIAL'] },
        },
      }),
    ).toEqual([]);
    expect(
      deny({ appointment: { window: { daysBefore: 0, daysAfter: 3 } } }),
    ).toEqual([]);
    expect(
      deny(
        { appointment: { leadTime: { minHours: 2, onViolation: 'DENY' } } },
        'agenda.appointment.cancel',
      ),
    ).toEqual([]);
    expect(
      deny(
        { channels: { allow: ['EMAIL'] } },
        'messages.conversation.reply_on_behalf',
      ),
    ).toEqual([]);
    expect(
      deny({ presence: { doctor: 'ONLINE' } }, 'agenda.appointment.cancel'),
    ).toEqual([]);
  });

  it('rechazan patients.exclude, patients.scope y las demás claves', () => {
    expect(deny({ patients: { exclude: { minors: true } } })).toEqual([
      'CONDITION_NOT_ALLOWED_ON_DENY',
    ]);
    expect(deny({ patients: { scope: 'ANY' } })).toEqual([
      'CONDITION_NOT_ALLOWED_ON_DENY',
    ]);
    expect(
      deny({
        limits: [{ metric: 'ACTIONS', per: 'DAY', max: 5, onExceed: 'DENY' }],
      }),
    ).toEqual(['CONDITION_NOT_ALLOWED_ON_DENY']);
    expect(deny({ network: { require: 'ANY' } })).toEqual([
      'CONDITION_NOT_ALLOWED_ON_DENY',
    ]);
    expect(deny({ device: { knownOnly: true } })).toEqual([
      'CONDITION_NOT_ALLOWED_ON_DENY',
    ]);
    expect(deny({ session: { maxSessionMinutes: 60 } })).toEqual([
      'CONDITION_NOT_ALLOWED_ON_DENY',
    ]);
    expect(deny({ obligations: { requireReason: { minLength: 10 } } })).toEqual(
      ['CONDITION_NOT_ALLOWED_ON_DENY'],
    );
    expect(
      deny({
        fields: { 'agenda.appointment.view.reason': { mask: 'PARTIAL' } },
      }),
    ).toEqual(['CONDITION_NOT_ALLOWED_ON_DENY']);
    expect(
      deny(
        { appointment: { horizon: { maxDaysAhead: 5 } } },
        'agenda.appointment.create',
      ),
    ).toEqual(['CONDITION_NOT_ALLOWED_ON_DENY']);
  });
});

describe('validateCondition · valores y formas (CONDITION_VALUE_INVALID)', () => {
  const val = (cond: object): string[] =>
    codes(validateCondition({ schemaVersion: 1, ...cond }, CANCEL));

  it('rechaza lo que no es objeto y los nulos', () => {
    expect(codes(validateCondition(null, CANCEL))).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(codes(validateCondition([], CANCEL))).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(codes(validateCondition('x', CANCEL))).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ time: null })).toEqual(['CONDITION_VALUE_INVALID']);
  });

  it('time: de 1 a 14 ventanas, días 0-6 sin repetir, HH:mm válido', () => {
    const w = { days: [1], from: '08:00', to: '09:00' };
    expect(val({ time: { windows: [] } })).toEqual(['CONDITION_VALUE_INVALID']);
    expect(
      val({ time: { windows: Array.from({ length: 15 }, () => w) } }),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(val({ time: { windows: [{ ...w, days: [] }] } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ time: { windows: [{ ...w, days: [7] }] } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ time: { windows: [{ ...w, days: [1, 1] }] } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ time: { windows: [{ ...w, from: '24:00' }] } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ time: { windows: [{ ...w, to: '9:00' }] } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
  });

  it('rangos numéricos de los demás bloques', () => {
    expect(val({ session: { maxSessionMinutes: 29 } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ session: { maxSessionMinutes: 721 } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(
      val({ appointment: { leadTime: { minHours: -1, onViolation: 'DENY' } } }),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(
      val({
        appointment: { leadTime: { minHours: 24, onViolation: 'IGNORE' } },
      }),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(
      val({ appointment: { window: { daysBefore: -1, daysAfter: 3 } } }),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(val({ patients: { age: { min: 40, max: 20 } } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ patients: { flags: { anyOf: ['SECRETO'] } } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ patients: { scope: 'TODOS' } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ obligations: { requireReason: { minLength: 4 } } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(val({ obligations: { stepUp: { maxAgeMinutes: 61 } } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
    expect(
      val({ obligations: { approval: { by: 'DOCTOR', ttlMinutes: 4 } } }),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(val({ network: { require: 'MAYBE' } })).toEqual([
      'CONDITION_VALUE_INVALID',
    ]);
  });

  it('amount: solo BOB y al menos un tope', () => {
    const amount: ValidateConditionOptions = {
      atom: 'billing.payment.collect',
      effect: 'ALLOW',
    };
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            amount: { currency: 'USD', perTransactionMax: 5, onExceed: 'DENY' },
          },
          amount,
        ),
      ),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(
      codes(
        validateCondition(
          { schemaVersion: 1, amount: { currency: 'BOB', onExceed: 'DENY' } },
          amount,
        ),
      ),
    ).toEqual(['CONDITION_VALUE_INVALID']);
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            amount: {
              currency: 'BOB',
              maxDiscountPercent: 101,
              onExceed: 'DENY',
            },
          },
          amount,
        ),
      ),
    ).toEqual(['CONDITION_VALUE_INVALID']);
  });

  it('fields: HASH solo existe para exportaciones y no es válido sobre un campo', () => {
    const grantAtoms = ['agenda.appointment.view.reason'];
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            fields: { 'agenda.appointment.view.reason': { mask: 'HASH' } },
          },
          { effect: 'ALLOW', grantAtoms },
        ),
      ),
    ).toEqual(['CONDITION_NOT_APPLICABLE_TO_ATOM']);
    expect(
      codes(
        validateCondition(
          {
            schemaVersion: 1,
            fields: { 'agenda.appointment.view.reason': { mask: 'BORRAR' } },
          },
          { effect: 'ALLOW', grantAtoms },
        ),
      ),
    ).toEqual(['CONDITION_VALUE_INVALID']);
  });

  it('devuelve todos los errores juntos, ordenados por ruta', () => {
    const errors = validateCondition(
      {
        schemaVersion: 1,
        zzz: 1,
        time: { windows: [{ days: [1], from: '08:00', to: '08:00' }] },
      },
      CANCEL,
    );
    expect(codes(errors)).toEqual([
      'CONDITION_TIME_EMPTY_WINDOW',
      'CONDITION_UNKNOWN_KEY',
    ]);
  });
});

describe('SEG A-A2 · condiciones sobre permisos escritos como alias', () => {
  const cond = {
    schemaVersion: 1,
    time: {
      timeZone: 'America/La_Paz',
      windows: [{ days: [1, 2, 3, 4, 5], from: '08:00', to: '12:00' }],
    },
  };

  it('rechaza (422 al guardar) una condición del permiso si alguna acción es alias', () => {
    const errors = validateCondition(cond, {
      effect: 'ALLOW',
      grantAtoms: ['schedule.cancel'],
    });
    expect(codes(errors)).toEqual(['CONDITION_NOT_APPLICABLE_TO_ATOM']);
    expect(errors[0].message).toMatch(/códigos antiguos|alias/i);
  });

  it('también si mezcla alias y átomos, y en la condición por átomo', () => {
    expect(
      codes(
        validateCondition(cond, {
          effect: 'ALLOW',
          grantAtoms: ['schedule.cancel', 'agenda.appointment.cancel'],
        }),
      ),
    ).toEqual(['CONDITION_NOT_APPLICABLE_TO_ATOM']);
    expect(
      codes(
        validateCondition(cond, {
          atom: 'agenda.appointment.cancel',
          effect: 'ALLOW',
          grantAtoms: ['schedule.cancel'],
        }),
      ),
    ).toEqual(['CONDITION_NOT_APPLICABLE_TO_ATOM']);
  });

  it('con átomos explícitos la misma condición sigue válida', () => {
    expect(
      validateCondition(cond, {
        effect: 'ALLOW',
        grantAtoms: ['agenda.appointment.cancel'],
      }),
    ).toEqual([]);
  });

  it('una prohibición (DENY) con alias no se rechaza: el motor sí evalúa su condición', () => {
    expect(
      codes(
        validateCondition(
          { schemaVersion: 1, patients: { exclude: { flags: ['VIP'] } } },
          { effect: 'DENY', grantAtoms: ['schedule.cancel'] },
        ),
      ).includes('CONDITION_NOT_APPLICABLE_TO_ATOM'),
    ).toBe(false);
  });
});

describe('SEG A-M5 · device.knownOnly exige la cookie de dispositivo', () => {
  const cond = { schemaVersion: 1, device: { knownOnly: true } };
  const cancel = {
    atom: 'agenda.appointment.cancel',
    effect: 'ALLOW',
  } as const;

  it('con la cookie de dispositivo APAGADA (AUTH_DEVICE_COOKIE_ENABLED=false) se rechaza guardar la condición', () => {
    // Sin cookie la huella es solo User-Agent: no autentica a nadie y un equipo
    // nuevo nace «de confianza»; la condición prometía una protección que no existe.
    const errors = validateCondition(cond, {
      ...cancel,
      deviceCookieEnabled: false,
    });
    expect(codes(errors)).toEqual(['CONDITION_VALUE_INVALID']);
    expect(errors[0].path).toBe('device.knownOnly');
    expect(errors[0].message).toMatch(/cookie de dispositivo/i);
  });

  it('con la cookie ENCENDIDA se acepta', () => {
    expect(
      validateCondition(cond, { ...cancel, deviceCookieEnabled: true }),
    ).toEqual([]);
  });

  it('knownOnly en falso no exige nada, y sin dato (undefined) no se comprueba', () => {
    expect(
      validateCondition(
        { schemaVersion: 1, device: { knownOnly: false } },
        { ...cancel, deviceCookieEnabled: false },
      ),
    ).toEqual([]);
    expect(validateCondition(cond, cancel)).toEqual([]);
  });

  it('deviceCookieEnabledFromEnv lee AUTH_DEVICE_COOKIE_ENABLED como el resto de la API (solo «true»)', () => {
    expect(
      deviceCookieEnabledFromEnv({ AUTH_DEVICE_COOKIE_ENABLED: 'true' }),
    ).toBe(true);
    expect(
      deviceCookieEnabledFromEnv({ AUTH_DEVICE_COOKIE_ENABLED: 'false' }),
    ).toBe(false);
    expect(deviceCookieEnabledFromEnv({})).toBe(false);
  });
});
