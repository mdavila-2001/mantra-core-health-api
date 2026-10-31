import { SUPPORT_ACTIONS, SUPPORT_TEMPLATE_CODES } from './support-actions';
import {
  ATOM_CATEGORIES,
  LEGACY_BUNDLES,
  LEGACY_PRIMARY,
  PERMISSION_ATOMS,
  PERMISSION_ATOM_BY_CODE,
  PERMISSION_ATOM_BY_ID,
  SENSITIVITY_WEIGHT,
  SUPPORT_PERMISSION_INPUT_CODES,
  atomMatchesPattern,
  atomsOfAction,
  atomsOfPermissionId,
  expandAtomPattern,
  expandLegacy,
  isSupportAtom,
  permissionAtomId,
  primaryAtomOf,
} from './support-permission-catalog';
import {
  SUPPORT_TEMPLATE_DEFAULTS_V2,
  TEMPLATE_CEILINGS,
} from './support-template-packages';

/** Anexo A del contrato: id de `authz.permissions` de cada átomo. */
const ANEXO_A_IDS: Readonly<Record<string, string>> = {
  'agenda.appointment.view': 'efeeea20-52a5-5973-a94a-37793ded463a',
  'agenda.appointment.view.patient_name':
    '44941499-4002-5836-bc41-561f86916a91',
  'agenda.appointment.view.patient_phone':
    '8f8287ca-10e7-53a0-8875-62380e5eb760',
  'agenda.appointment.view.patient_document':
    '054f61ed-6c6c-59d7-9cb3-f71ca38bd70b',
  'agenda.appointment.view.reason': '5ed80082-4016-52bc-912d-19b2a6ad9ea4',
  'agenda.appointment.view.insurance': '76de6c5c-ea44-5df2-adb0-6829c3deceea',
  'agenda.appointment.view.price': 'a12067b5-77c5-5659-b5c0-fd8beec2220c',
  'agenda.appointment.create': 'dcb281d5-ade2-548e-a600-94049262bc99',
  'agenda.appointment.create.overbook': 'f7c0aeff-c4b1-5de6-a07c-0b7822233643',
  'agenda.appointment.reschedule': '672e888a-62f7-5dcb-98be-8a584c9c9e00',
  'agenda.appointment.cancel': '1c4a946d-8915-5423-b5f7-6708c207a3aa',
  'agenda.appointment.confirm': 'f4782b09-e8a1-5922-935d-cfecc88d74f3',
  'agenda.appointment.check_in': '3acf14a6-7c28-528b-9db3-6e9c50b99739',
  'agenda.appointment.no_show': 'ef46e334-1617-5bcb-9c20-f16826ef248b',
  'agenda.appointment.walk_in': '662896ab-39d9-5fa6-9200-d6fa6fdd1447',
  'agenda.waitlist.manage': '04e3b714-1b35-540d-b93b-2908e8a8d068',
  'agenda.reminder.send': 'cfac3bbb-b59d-5aa0-9b51-4d09bf5f538a',
  'agenda.block.create': 'e743048f-b7bd-586f-bb3b-b3b47ef4bcf5',
  'agenda.block.remove': '39aa19d5-1fc5-552d-84b8-d23f281dc849',
  'agenda.hours.edit': '378f04dc-abf9-5a86-86c4-3a8447790644',
  'patients.search.exact': '53a5479b-dd19-51c4-802b-7359cd8be359',
  'patients.profile.view_basic': 'a1303ccf-446c-527a-b30b-c8e08b77f4b1',
  'patients.profile.view.phone_full': '1a4b9a3e-7e19-539d-b819-f03b457cbb1d',
  'patients.profile.view.document_full': 'f21f5d57-4e8a-55ec-bd2f-8dc8eee71361',
  'patients.coverage.view': 'b8159666-5b97-5eed-99c8-95692a72bd7b',
  'patients.profile.register': 'b88c1279-bdf5-5c9c-be82-79702a9df31c',
  'patients.guardian.record': '4833c0f0-16d0-5a8d-a440-c6bcbbe10527',
  'patients.profile.edit_contact': '7f7275c2-cd3f-5e6a-9bf7-3371f0223896',
  'patients.profile.edit_verified': '40a94008-6a45-5ec5-b804-70da21395ba5',
  'patients.profile.merge_request': 'ec5dc000-461b-522d-9789-5e080d05cf5d',
  'patients.clinical.request_temporary_access':
    'bac300b0-094c-51e8-8ecc-b20274418873',
  'messages.inbox.view': '42d19611-205f-5380-b51c-b55738727905',
  'messages.conversation.reply_on_behalf':
    '6b674c45-b9ea-58a2-aaac-deb008d63569',
  'messages.conversation.assign': '7a76a3cc-8b12-5015-840e-bdca9a2caa6b',
  'messages.conversation.resolve': 'bb5f9949-5574-5527-8605-6615e6963066',
  'messages.note.create_internal': '5ee0247f-139d-57e1-b662-9584cba0310b',
  'messages.template.use': '36c0f0da-72de-5fc2-9649-07d42c69f134',
  'messages.template.manage': '47050d94-6b22-5581-a41c-f81980e80179',
  'messages.attachment.send': '78f0ffc4-3ace-5bb4-9df3-897a53f7e91f',
  'messages.broadcast.send': '0de6aa11-4f86-50c1-9d8c-511db13346b4',
  'billing.invoice.view': 'f16aed56-f135-5b2e-8538-a4b48b22b351',
  'billing.payment.collect': '72274a1f-c418-5bc6-95a8-374531b64fef',
  'billing.receipt.issue': 'c8887db8-1bf5-5a9f-974d-75eca68d28d7',
  'billing.receipt.void': '004982fe-4f05-55e9-88ba-97d2c816a902',
  'billing.payment.refund': '3406a667-38b9-52d5-890c-130fc059414e',
  'billing.discount.apply': '9e470e06-4266-5c83-b991-86b1b3c10842',
  'billing.cashbox.close': 'c9ab5a01-6f9f-56c7-a143-c11b90d99434',
  'reports.agenda.view': 'e7c33743-ba81-58d9-a2e1-d94db64e7ce7',
  'reports.agenda.export': '604f5d03-1d89-5848-8fb2-c1cee28f26c4',
  'reports.billing.view': '620da2b5-9ba0-58c1-b22f-ef5b58663996',
  'reports.billing.export': '4f9f5386-d36f-52d3-8321-6723c3031bad',
  'team.members.view': '0f600fde-de44-5b9c-9dd2-120c7913f4ea',
  'team.invitations.create': 'd293bde0-9b2d-5650-b0b6-7ac2f3bc230f',
  'team.requests.decide': '3e298c9e-5e8e-58ad-b1d1-4aa176ba6235',
  'team.grants.assign': '9619ea42-4bb9-52cc-b7a3-7f5ec23a5439',
  'team.grants.revoke': '61db4521-3e45-5210-9113-21282d3209f3',
  'team.engagement.recertify': 'd545b48b-53cf-5d15-918a-42a53d3ecc78',
  'team.engagement.suspend': '35b0e156-afca-54bd-8858-0ec806f3da35',
  'team.engagement.reactivate': '76e88531-20eb-5600-b8e3-cfb8e3f36ad7',
  'team.engagement.end': '7030ec19-4f22-5a18-a61a-6918dbad2274',
  'team.handover.execute': '8b2722fe-b1e5-57ac-8fb9-ad7f6ec75def',
  'team.campaigns.review': '15292618-2c42-52d0-b01d-d56c78bd680a',
  'team.campaigns.manage': '67191dca-dba1-5ec7-8d96-646024a96290',
  'team.sod.exception.request': 'a669994d-1f9b-5742-8b2d-5e909c2a1a70',
  'team.templates.manage': 'b20e50c1-ac7f-5468-896d-6defda0a4681',
  'team.guardrails.manage': 'e97fcb81-d554-51e1-a53f-6f4a3874432f',
  'team.sod.manage': 'eff625b4-0370-5446-a021-b3c44764198c',
  'team.sessionpolicy.manage': '48a8e7b7-2f29-5464-8348-288c123b26dd',
  'audit.activity.view_team': 'fbe1d36f-310d-557c-b014-5d81414351ca',
  'audit.activity.view_org': '9cff9315-c54a-58d9-af6c-3fecdd636c9a',
  'audit.activity.export': '9b3bf93d-f02b-5dab-9599-b4bdd568937f',
  'audit.decisions.explain': '9bc38d0f-a05f-5b36-a1f0-6b3f79ca89ad',
  'audit.reports.governance.view': '03936799-b89d-5879-9b6d-47851fb3ac15',
};

/** §2.3 del contrato: lo que cada alias heredado se expande a. */
const ALIAS_EXPANSION: Readonly<Record<string, readonly string[]>> = {
  'schedule.view': [
    'agenda.appointment.view',
    'agenda.appointment.view.patient_name',
  ],
  'schedule.create': [
    'agenda.appointment.create',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.reschedule': [
    'agenda.appointment.reschedule',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.cancel': ['agenda.appointment.cancel'],
  'schedule.confirm': ['agenda.appointment.confirm'],
  'schedule.check_in': [
    'agenda.appointment.check_in',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.walk_in': [
    'agenda.appointment.walk_in',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'schedule.waitlist': ['agenda.waitlist.manage'],
  'schedule.send_reminders': ['agenda.reminder.send'],
  'schedule.block_time': ['agenda.block.create', 'agenda.block.remove'],
  'schedule.edit_hours': ['agenda.hours.edit'],
  'billing.collect': ['billing.payment.collect'],
  'billing.issue_receipt': ['billing.receipt.issue'],
  'patient.register': [
    'patients.profile.register',
    'patients.guardian.record',
    'patients.search.exact',
    'patients.profile.view_basic',
  ],
  'messages.reply_on_behalf': [
    'messages.inbox.view',
    'messages.conversation.reply_on_behalf',
    'messages.conversation.assign',
    'messages.note.create_internal',
    'messages.template.use',
  ],
};

const CATEGORY_IDS: Readonly<Record<string, string>> = {
  SUPPORT_AGENDA: '74102927-61f0-5416-adc3-6ca263a345f8',
  SUPPORT_PATIENTS: 'ba719bcb-3bc6-58a4-a0b8-2f8ed236b413',
  SUPPORT_MESSAGING: '5141711e-b6ed-5020-9015-408c26c03091',
  SUPPORT_BILLING: 'a7cde8bf-fbf8-5632-9517-7f4a67b94570',
  SUPPORT_REPORTS: 'd69897ff-ff51-5675-b8b8-275a5cad1e3d',
  SUPPORT_TEAM: 'c368a0a0-f783-539d-8c90-d271c6d15664',
  SUPPORT_AUDIT: '4956a307-bc81-5b38-a8a5-4143cc416f5c',
};

const count = <T>(items: readonly T[], pick: (item: T) => string) => {
  const out: Record<string, number> = {};
  for (const item of items) out[pick(item)] = (out[pick(item)] ?? 0) + 1;
  return out;
};

describe('AC-2 · catálogo de 73 átomos', () => {
  it('tiene 73 átomos únicos con la forma módulo.recurso.acción[.campo]', () => {
    expect(PERMISSION_ATOMS).toHaveLength(73);
    expect(new Set(PERMISSION_ATOMS.map((a) => a.code)).size).toBe(73);
    for (const atom of PERMISSION_ATOMS) {
      expect(atom.code).toMatch(/^[a-z]+(\.[a-z_]+){2,3}$/);
      expect(atom.code).toBe(atom.code.toLowerCase());
    }
  });

  it('los ids deterministas son los del Anexo A (73)', () => {
    expect(Object.keys(ANEXO_A_IDS)).toHaveLength(73);
    for (const atom of PERMISSION_ATOMS) {
      expect(atom.id).toBe(ANEXO_A_IDS[atom.code]);
      expect(permissionAtomId(atom.code)).toBe(ANEXO_A_IDS[atom.code]);
      expect(PERMISSION_ATOM_BY_ID.get(atom.id)?.code).toBe(atom.code);
    }
  });

  it('las 7 categorías y sus ids son los del Anexo A', () => {
    expect(ATOM_CATEGORIES).toHaveLength(7);
    for (const category of ATOM_CATEGORIES) {
      expect(category.id).toBe(CATEGORY_IDS[category.code]);
    }
  });

  it('los 15 códigos heredados conservan su id (p. ej. schedule.view)', () => {
    expect(permissionAtomId('schedule.view')).toBe(
      '438c578b-e5ea-5c58-86ed-fcf7da71780e',
    );
  });

  it('el resumen del §2.2 se cumple (categorías, sensibilidad, obligaciones)', () => {
    expect(count(PERMISSION_ATOMS, (a) => a.categoryCode)).toEqual({
      SUPPORT_AGENDA: 20,
      SUPPORT_PATIENTS: 11,
      SUPPORT_MESSAGING: 9,
      SUPPORT_BILLING: 7,
      SUPPORT_REPORTS: 4,
      SUPPORT_TEAM: 17,
      SUPPORT_AUDIT: 5,
    });
    expect(count(PERMISSION_ATOMS, (a) => a.sensitivity)).toEqual({
      LOW: 11,
      MEDIUM: 27,
      HIGH: 29,
      CRITICAL: 6,
    });
    expect(PERMISSION_ATOMS.filter((a) => a.requiresReason)).toHaveLength(31);
    expect(PERMISSION_ATOMS.filter((a) => a.requiresStepUp)).toHaveLength(14);
    expect(PERMISSION_ATOMS.filter((a) => a.approvalMode)).toHaveLength(10);
    expect(
      PERMISSION_ATOMS.filter((a) => a.approvalMode === 'DOCTOR'),
    ).toHaveLength(3);
    expect(
      PERMISSION_ATOMS.filter((a) => a.approvalMode === 'SECOND_APPROVER'),
    ).toHaveLength(7);
    expect(PERMISSION_ATOMS.filter((a) => a.isFieldLevel)).toHaveLength(8);
    expect(PERMISSION_ATOMS.filter((a) => !a.supportAssignable)).toHaveLength(
      4,
    );
    const inSomeAlias = new Set(Object.values(LEGACY_BUNDLES).flat());
    expect(inSomeAlias.size).toBe(24);
  });

  it('la categoría de cada átomo sale de su módulo y coincide con el catálogo', () => {
    for (const atom of PERMISSION_ATOMS) {
      expect(ATOM_CATEGORIES.some((c) => c.code === atom.categoryCode)).toBe(
        true,
      );
      expect(atom.module).toBe(atom.code.split('.')[0]);
    }
  });

  it('is_dangerous = sensibilidad ALTA o CRÍTICA y los pesos son 1/2/5/10', () => {
    for (const atom of PERMISSION_ATOMS) {
      expect(atom.isDangerous).toBe(
        atom.sensitivity === 'HIGH' || atom.sensitivity === 'CRITICAL',
      );
    }
    expect(SENSITIVITY_WEIGHT).toEqual({
      LOW: 1,
      MEDIUM: 2,
      HIGH: 5,
      CRITICAL: 10,
    });
  });

  it('GP-1: los cuatro átomos no asignables son los de administración de seguridad', () => {
    expect(
      PERMISSION_ATOMS.filter((a) => !a.supportAssignable).map((a) => a.code),
    ).toEqual([
      'team.templates.manage',
      'team.guardrails.manage',
      'team.sod.manage',
      'team.sessionpolicy.manage',
    ]);
  });

  it('GP-3: ningún átomo clínico fuera de los dos documentados', () => {
    expect(
      PERMISSION_ATOMS.filter((a) => a.touchesClinicalData).map((a) => a.code),
    ).toEqual([
      'agenda.appointment.view.reason',
      'patients.clinical.request_temporary_access',
    ]);
    expect(
      PERMISSION_ATOMS.some((a) =>
        /^(clinical|chart|results|diagnos|notes)/.test(a.code),
      ),
    ).toBe(false);
  });

  it('SUPPORT_PERMISSION_INPUT_CODES son los 73 átomos más los 15 alias', () => {
    expect(SUPPORT_PERMISSION_INPUT_CODES).toHaveLength(88);
    expect(new Set(SUPPORT_PERMISSION_INPUT_CODES).size).toBe(88);
  });
});

describe('AC-2 · los 15 alias se expanden a su paquete (§2.3)', () => {
  it.each(Object.entries(ALIAS_EXPANSION))(
    '%s → paquete del contrato',
    (alias, atoms) => {
      expect(expandLegacy(alias)).toEqual(atoms);
      for (const atom of atoms) expect(isSupportAtom(atom)).toBe(true);
    },
  );

  it('cubre exactamente los 15 códigos actuales', () => {
    expect(Object.keys(ALIAS_EXPANSION).sort()).toEqual(
      [...SUPPORT_ACTIONS].sort(),
    );
    expect(Object.keys(LEGACY_BUNDLES).sort()).toEqual(
      [...SUPPORT_ACTIONS].sort(),
    );
  });

  it('el átomo primario es el primero del paquete, salvo reply_on_behalf', () => {
    for (const code of SUPPORT_ACTIONS) {
      expect(LEGACY_PRIMARY[code]).toBe(
        code === 'messages.reply_on_behalf'
          ? 'messages.conversation.reply_on_behalf'
          : LEGACY_BUNDLES[code][0],
      );
      expect(primaryAtomOf(code)).toBe(LEGACY_PRIMARY[code]);
    }
    expect(primaryAtomOf('billing.receipt.void')).toBe('billing.receipt.void');
    expect(primaryAtomOf('no.existe.esto')).toBeUndefined();
  });

  it('atomsOfAction marca LEGACY para alias y ATOM para átomos', () => {
    expect(atomsOfAction('schedule.cancel')).toEqual([
      { atom: 'agenda.appointment.cancel', origin: 'LEGACY' },
    ]);
    expect(atomsOfAction('agenda.appointment.cancel')).toEqual([
      { atom: 'agenda.appointment.cancel', origin: 'ATOM' },
    ]);
    expect(atomsOfAction('desconocido')).toEqual([]);
  });

  it('un permission_id se resuelve a átomos (alias → LEGACY, átomo → ATOM, otro → ignorado)', () => {
    expect(atomsOfPermissionId('438c578b-e5ea-5c58-86ed-fcf7da71780e')).toEqual(
      [
        { atom: 'agenda.appointment.view', origin: 'LEGACY' },
        { atom: 'agenda.appointment.view.patient_name', origin: 'LEGACY' },
      ],
    );
    expect(atomsOfPermissionId(ANEXO_A_IDS['billing.receipt.void'])).toEqual([
      { atom: 'billing.receipt.void', origin: 'ATOM' },
    ]);
    expect(
      atomsOfPermissionId('00000000-0000-5000-8000-000000000000'),
    ).toBeUndefined();
  });

  it('patients.search.exact y view_basic son implícitos en las 5 acciones de pacientes', () => {
    for (const code of [
      'schedule.create',
      'schedule.reschedule',
      'schedule.check_in',
      'schedule.walk_in',
      'patient.register',
    ] as const) {
      expect(expandLegacy(code)).toContain('patients.search.exact');
      expect(expandLegacy(code)).toContain('patients.profile.view_basic');
    }
    expect(expandLegacy('schedule.view')).not.toContain(
      'patients.search.exact',
    );
  });
});

describe('atomMatchesPattern / expandAtomPattern', () => {
  it.each([
    ['billing.payment.collect', 'billing.*', true],
    ['billing.payment.collect', 'billing.payment.*', true],
    ['billing.payment.collect', 'billing.receipt.*', false],
    ['billing.payment.collect', 'billing.payment.collect', true],
    ['agenda.appointment.view.reason', 'agenda.appointment.*', true],
    ['agenda.appointment.view', 'agenda.appointment.*', true],
    ['agenda.appointment', 'agenda.appointment.*', false],
    ['reports.billing.export', 'reports.*.export', true],
    ['reports.agenda.export', 'reports.*.export', true],
    ['reports.agenda.view', 'reports.*.export', false],
    ['reports.agenda.view.x', 'reports.*.export', false],
    ['team.members.view', 'billing.*', false],
    ['patients.search.exact', 'patients.search.exac', false],
  ])('%s con «%s» → %s', (atom, pattern, expected) => {
    expect(atomMatchesPattern(atom, pattern)).toBe(expected);
  });

  it('expandAtomPattern lista en orden canónico', () => {
    expect(expandAtomPattern('billing.*')).toHaveLength(7);
    expect(expandAtomPattern('reports.*.export')).toEqual([
      'reports.agenda.export',
      'reports.billing.export',
    ]);
    expect(expandAtomPattern('nada.*')).toEqual([]);
  });
});

describe('AC-2 · paquetes por defecto v2 y techos (§2.4)', () => {
  const expectedSize: Record<string, number> = {
    SECRETARY: 20,
    MEDICAL_ASSISTANT: 20,
    NURSING: 7,
    FRONT_DESK: 8,
    BILLING_CASHIER: 5,
    CALL_CENTER: 7,
    ORG_MANAGEMENT: 21,
  };

  it('cada plantilla tiene el tamaño del contrato', () => {
    for (const template of SUPPORT_TEMPLATE_CODES) {
      expect(SUPPORT_TEMPLATE_DEFAULTS_V2[template]).toHaveLength(
        expectedSize[template],
      );
    }
  });

  it('todo paquete por defecto cabe en su techo', () => {
    for (const template of SUPPORT_TEMPLATE_CODES) {
      const ceiling = new Set(TEMPLATE_CEILINGS[template]);
      for (const atom of SUPPORT_TEMPLATE_DEFAULTS_V2[template]) {
        expect({ template, atom, fits: ceiling.has(atom) }).toEqual({
          template,
          atom,
          fits: true,
        });
      }
    }
  });

  it('el paquete v2 incluye todo lo de v1 expandido', () => {
    // v1 por plantilla (support-actions.ts), expandido con los alias.
    const v1: Record<string, readonly string[]> = {
      SECRETARY: [
        'schedule.view',
        'schedule.create',
        'schedule.reschedule',
        'schedule.cancel',
        'schedule.confirm',
        'schedule.check_in',
        'schedule.walk_in',
        'schedule.waitlist',
        'schedule.send_reminders',
        'patient.register',
        'messages.reply_on_behalf',
      ],
      NURSING: ['schedule.view', 'schedule.check_in', 'schedule.waitlist'],
      FRONT_DESK: [
        'schedule.view',
        'schedule.check_in',
        'schedule.walk_in',
        'patient.register',
      ],
      BILLING_CASHIER: [
        'schedule.view',
        'billing.collect',
        'billing.issue_receipt',
      ],
      CALL_CENTER: [
        'schedule.view',
        'schedule.create',
        'schedule.reschedule',
        'schedule.cancel',
      ],
    };
    for (const [template, aliases] of Object.entries(v1)) {
      const defaults = new Set<string>(
        SUPPORT_TEMPLATE_DEFAULTS_V2[
          template as (typeof SUPPORT_TEMPLATE_CODES)[number]
        ],
      );
      for (const alias of aliases) {
        for (const atom of expandLegacy(alias)) {
          expect({ template, atom, has: defaults.has(atom) }).toEqual({
            template,
            atom,
            has: true,
          });
        }
      }
    }
  });

  it('D-01: el motivo de consulta entra solo en secretaría, asistente y enfermería', () => {
    const withReason = SUPPORT_TEMPLATE_CODES.filter((t) =>
      SUPPORT_TEMPLATE_DEFAULTS_V2[t].includes(
        'agenda.appointment.view.reason',
      ),
    );
    expect(withReason).toEqual(['SECRETARY', 'MEDICAL_ASSISTANT', 'NURSING']);
  });

  const allowedIn = (atom: string) =>
    SUPPORT_TEMPLATE_CODES.filter((t) =>
      (TEMPLATE_CEILINGS[t] as readonly string[]).includes(atom),
    );

  it('R1: los 4 team.* de seguridad a ninguna; edit_verified solo a ORG_MANAGEMENT', () => {
    for (const atom of [
      'team.templates.manage',
      'team.guardrails.manage',
      'team.sod.manage',
      'team.sessionpolicy.manage',
    ]) {
      expect(allowedIn(atom)).toEqual([]);
    }
    expect(allowedIn('patients.profile.edit_verified')).toEqual([
      'ORG_MANAGEMENT',
    ]);
  });

  it('R2: anular, devolver, descuentos y cierre de caja solo a caja y gestión', () => {
    for (const atom of [
      'billing.receipt.void',
      'billing.payment.refund',
      'billing.discount.apply',
      'billing.cashbox.close',
    ]) {
      expect(allowedIn(atom)).toEqual(['BILLING_CASHIER', 'ORG_MANAGEMENT']);
    }
  });

  it('R3: cobrar, emitir y ver cobros: caja, gestión, secretaría, asistente y recepción', () => {
    for (const atom of [
      'billing.payment.collect',
      'billing.receipt.issue',
      'billing.invoice.view',
    ]) {
      expect(allowedIn(atom)).toEqual([
        'SECRETARY',
        'MEDICAL_ASSISTANT',
        'FRONT_DESK',
        'BILLING_CASHIER',
        'ORG_MANAGEMENT',
      ]);
    }
  });

  it('R4/R5: exportar solo gestión; team.* y audit.* solo gestión', () => {
    expect(allowedIn('reports.agenda.export')).toEqual(['ORG_MANAGEMENT']);
    expect(allowedIn('reports.billing.export')).toEqual([
      'BILLING_CASHIER',
      'ORG_MANAGEMENT',
    ]);
    expect(allowedIn('reports.agenda.view')).not.toContain('BILLING_CASHIER');
    for (const atom of PERMISSION_ATOMS.filter(
      (a) =>
        a.supportAssignable &&
        (a.code.startsWith('team.') || a.code.startsWith('audit.')),
    )) {
      expect(allowedIn(atom.code)).toEqual(['ORG_MANAGEMENT']);
    }
  });

  it('R6/R7/R8/R9 sobre agenda, clínicos, documentos y mensajes', () => {
    for (const atom of [
      'agenda.hours.edit',
      'agenda.block.create',
      'agenda.block.remove',
      'agenda.appointment.create.overbook',
    ]) {
      expect(allowedIn(atom)).toEqual([
        'SECRETARY',
        'MEDICAL_ASSISTANT',
        'ORG_MANAGEMENT',
      ]);
    }
    for (const atom of [
      'agenda.appointment.view.reason',
      'patients.clinical.request_temporary_access',
    ]) {
      expect(allowedIn(atom)).toEqual([
        'SECRETARY',
        'MEDICAL_ASSISTANT',
        'NURSING',
        'ORG_MANAGEMENT',
      ]);
    }
    for (const atom of [
      'patients.profile.view.document_full',
      'patients.profile.merge_request',
      'agenda.appointment.view.patient_document',
    ]) {
      expect(allowedIn(atom)).toEqual([
        'SECRETARY',
        'MEDICAL_ASSISTANT',
        'FRONT_DESK',
        'ORG_MANAGEMENT',
      ]);
    }
    expect(allowedIn('messages.broadcast.send')).toEqual(['ORG_MANAGEMENT']);
    expect(
      TEMPLATE_CEILINGS.BILLING_CASHIER.some((a) => a.startsWith('messages.')),
    ).toBe(false);
    expect(
      TEMPLATE_CEILINGS.NURSING.filter((a) => a.startsWith('messages.')),
    ).toEqual([
      'messages.inbox.view',
      'messages.note.create_internal',
      'messages.template.use',
    ]);
    expect(allowedIn('messages.attachment.send')).not.toContain('NURSING');
    expect(allowedIn('messages.attachment.send')).not.toContain('CALL_CENTER');
    expect(allowedIn('messages.attachment.send')).not.toContain(
      'BILLING_CASHIER',
    );
  });

  it('ningún techo contiene un átomo no asignable ni un código desconocido', () => {
    for (const template of SUPPORT_TEMPLATE_CODES) {
      for (const code of TEMPLATE_CEILINGS[template]) {
        const atom = PERMISSION_ATOM_BY_CODE.get(code);
        expect(atom?.supportAssignable).toBe(true);
      }
    }
  });
});
