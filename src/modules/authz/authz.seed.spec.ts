import { MetadataStorage } from '@mikro-orm/core';
import { ClinicalNoteVersions } from '../chart/entities';
import {
  Conditions,
  MedicationRequests,
  Observations,
} from '../clinical/entities';
import { deterministicId } from '../../common/constants/concepts';
import { AUD } from '../audit/audit.concepts';
import { AUTHZ } from './authz.concepts';
import {
  PERMISSION_CATEGORY_SEED,
  SUPPORT_STAFF_FIELD_FLOOR,
  PLATFORM_PERMISSION_SEED,
  platformPermissionId,
} from './authz.seed';
import { SUPPORT_ACTIONS } from '../delegated_access/domain/support-actions';

/**
 * Los 73 permisos atómicos y las 7 categorías del catálogo de apoyo
 * (CONTRATO-GOBIERNO §2.2 y Anexo A). Las tablas se copian del contrato: el
 * código que se prueba no calcula su propia respuesta.
 */

/** `código|id|sensibilidad|motivo|paso extra|aprobación|propósito|base legal|clínico|campo|asignable`. */
const ATOMOS: readonly string[] = [
  'agenda.appointment.view|efeeea20-52a5-5973-a94a-37793ded463a|LOW|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.view.patient_name|44941499-4002-5836-bc41-561f86916a91|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|1|1',
  'agenda.appointment.view.patient_phone|8f8287ca-10e7-53a0-8875-62380e5eb760|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|1|1',
  'agenda.appointment.view.patient_document|054f61ed-6c6c-59d7-9cb3-f71ca38bd70b|HIGH|0|0|-|TREATMENT|TREATMENT|0|1|1',
  'agenda.appointment.view.reason|5ed80082-4016-52bc-912d-19b2a6ad9ea4|HIGH|0|0|-|TREATMENT|TREATMENT|1|1|1',
  'agenda.appointment.view.insurance|76de6c5c-ea44-5df2-adb0-6829c3deceea|MEDIUM|0|0|-|PAYMENT|TREATMENT|0|1|1',
  'agenda.appointment.view.price|a12067b5-77c5-5659-b5c0-fd8beec2220c|LOW|0|0|-|PAYMENT|TREATMENT|0|1|1',
  'agenda.appointment.create|dcb281d5-ade2-548e-a600-94049262bc99|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.create.overbook|f7c0aeff-c4b1-5de6-a07c-0b7822233643|HIGH|1|0|DOCTOR|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.reschedule|672e888a-62f7-5dcb-98be-8a584c9c9e00|MEDIUM|1|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.cancel|1c4a946d-8915-5423-b5f7-6708c207a3aa|MEDIUM|1|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.confirm|f4782b09-e8a1-5922-935d-cfecc88d74f3|LOW|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.check_in|3acf14a6-7c28-528b-9db3-6e9c50b99739|LOW|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.no_show|ef46e334-1617-5bcb-9c20-f16826ef248b|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.appointment.walk_in|662896ab-39d9-5fa6-9200-d6fa6fdd1447|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.waitlist.manage|04e3b714-1b35-540d-b93b-2908e8a8d068|LOW|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.reminder.send|cfac3bbb-b59d-5aa0-9b51-4d09bf5f538a|LOW|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'agenda.block.create|e743048f-b7bd-586f-bb3b-b3b47ef4bcf5|MEDIUM|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'agenda.block.remove|39aa19d5-1fc5-552d-84b8-d23f281dc849|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'agenda.hours.edit|378f04dc-abf9-5a86-86c4-3a8447790644|HIGH|1|1|DOCTOR|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'patients.search.exact|53a5479b-dd19-51c4-802b-7359cd8be359|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'patients.profile.view_basic|a1303ccf-446c-527a-b30b-c8e08b77f4b1|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'patients.profile.view.phone_full|1a4b9a3e-7e19-539d-b819-f03b457cbb1d|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|1|1',
  'patients.profile.view.document_full|f21f5d57-4e8a-55ec-bd2f-8dc8eee71361|HIGH|1|0|-|TREATMENT|TREATMENT|0|1|1',
  'patients.coverage.view|b8159666-5b97-5eed-99c8-95692a72bd7b|MEDIUM|0|0|-|PAYMENT|TREATMENT|0|0|1',
  'patients.profile.register|b88c1279-bdf5-5c9c-be82-79702a9df31c|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'patients.guardian.record|4833c0f0-16d0-5a8d-a440-c6bcbbe10527|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'patients.profile.edit_contact|7f7275c2-cd3f-5e6a-9bf7-3371f0223896|MEDIUM|1|0|-|TREATMENT|TREATMENT|0|0|1',
  'patients.profile.edit_verified|40a94008-6a45-5ec5-b804-70da21395ba5|CRITICAL|1|1|SECOND_APPROVER|TREATMENT|LEGAL_OBLIGATION|0|0|1',
  'patients.profile.merge_request|ec5dc000-461b-522d-9789-5e080d05cf5d|HIGH|1|0|SECOND_APPROVER|TREATMENT|TREATMENT|0|0|1',
  'patients.clinical.request_temporary_access|bac300b0-094c-51e8-8ecc-b20274418873|HIGH|1|1|DOCTOR|TREATMENT|CONSENT|1|0|1',
  'messages.inbox.view|42d19611-205f-5380-b51c-b55738727905|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'messages.conversation.reply_on_behalf|6b674c45-b9ea-58a2-aaac-deb008d63569|MEDIUM|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'messages.conversation.assign|7a76a3cc-8b12-5015-840e-bdca9a2caa6b|LOW|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'messages.conversation.resolve|bb5f9949-5574-5527-8605-6615e6963066|LOW|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'messages.note.create_internal|5ee0247f-139d-57e1-b662-9584cba0310b|LOW|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'messages.template.use|36c0f0da-72de-5fc2-9649-07d42c69f134|LOW|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'messages.template.manage|47050d94-6b22-5581-a41c-f81980e80179|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'messages.attachment.send|78f0ffc4-3ace-5bb4-9df3-897a53f7e91f|HIGH|0|0|-|TREATMENT|TREATMENT|0|0|1',
  'messages.broadcast.send|0de6aa11-4f86-50c1-9d8c-511db13346b4|HIGH|1|0|SECOND_APPROVER|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'billing.invoice.view|f16aed56-f135-5b2e-8538-a4b48b22b351|MEDIUM|0|0|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'billing.payment.collect|72274a1f-c418-5bc6-95a8-374531b64fef|HIGH|0|0|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'billing.receipt.issue|c8887db8-1bf5-5a9f-974d-75eca68d28d7|HIGH|0|0|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'billing.receipt.void|004982fe-4f05-55e9-88ba-97d2c816a902|CRITICAL|1|1|SECOND_APPROVER|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'billing.payment.refund|3406a667-38b9-52d5-890c-130fc059414e|CRITICAL|1|1|SECOND_APPROVER|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'billing.discount.apply|9e470e06-4266-5c83-b991-86b1b3c10842|HIGH|1|0|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'billing.cashbox.close|c9ab5a01-6f9f-56c7-a143-c11b90d99434|HIGH|0|1|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'reports.agenda.view|e7c33743-ba81-58d9-a2e1-d94db64e7ce7|LOW|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'reports.agenda.export|604f5d03-1d89-5848-8fb2-c1cee28f26c4|HIGH|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'reports.billing.view|620da2b5-9ba0-58c1-b22f-ef5b58663996|MEDIUM|0|0|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'reports.billing.export|4f9f5386-d36f-52d3-8321-6723c3031bad|HIGH|1|1|-|PAYMENT|LEGAL_OBLIGATION|0|0|1',
  'team.members.view|0f600fde-de44-5b9c-9dd2-120c7913f4ea|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.invitations.create|d293bde0-9b2d-5650-b0b6-7ac2f3bc230f|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.requests.decide|3e298c9e-5e8e-58ad-b1d1-4aa176ba6235|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.grants.assign|9619ea42-4bb9-52cc-b7a3-7f5ec23a5439|HIGH|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.grants.revoke|61db4521-3e45-5210-9113-21282d3209f3|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.engagement.recertify|d545b48b-53cf-5d15-918a-42a53d3ecc78|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.engagement.suspend|35b0e156-afca-54bd-8858-0ec806f3da35|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.engagement.reactivate|76e88531-20eb-5600-b8e3-cfb8e3f36ad7|HIGH|1|0|SECOND_APPROVER|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.engagement.end|7030ec19-4f22-5a18-a61a-6918dbad2274|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.handover.execute|8b2722fe-b1e5-57ac-8fb9-ad7f6ec75def|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.campaigns.review|15292618-2c42-52d0-b01d-d56c78bd680a|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.campaigns.manage|67191dca-dba1-5ec7-8d96-646024a96290|HIGH|1|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.sod.exception.request|a669994d-1f9b-5742-8b2d-5e909c2a1a70|HIGH|1|0|SECOND_APPROVER|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'team.templates.manage|b20e50c1-ac7f-5468-896d-6defda0a4681|HIGH|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|0',
  'team.guardrails.manage|e97fcb81-d554-51e1-a53f-6f4a3874432f|CRITICAL|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|0',
  'team.sod.manage|eff625b4-0370-5446-a021-b3c44764198c|CRITICAL|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|0',
  'team.sessionpolicy.manage|48a8e7b7-2f29-5464-8348-288c123b26dd|CRITICAL|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|0',
  'audit.activity.view_team|fbe1d36f-310d-557c-b014-5d81414351ca|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'audit.activity.view_org|9cff9315-c54a-58d9-af6c-3fecdd636c9a|HIGH|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'audit.activity.export|9b3bf93d-f02b-5dab-9599-b4bdd568937f|HIGH|1|1|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'audit.decisions.explain|9bc38d0f-a05f-5b36-a1f0-6b3f79ca89ad|MEDIUM|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
  'audit.reports.governance.view|03936799-b89d-5879-9b6d-47851fb3ac15|HIGH|0|0|-|OPERATIONS|HEALTHCARE_OPERATIONS|0|0|1',
];

/** `código`, id y nombre de cada categoría. */
const CATEGORIAS: readonly (readonly [string, string, string])[] = [
  ['SUPPORT_AGENDA', '74102927-61f0-5416-adc3-6ca263a345f8', 'Agenda'],
  ['SUPPORT_PATIENTS', 'ba719bcb-3bc6-58a4-a0b8-2f8ed236b413', 'Pacientes'],
  ['SUPPORT_MESSAGING', '5141711e-b6ed-5020-9015-408c26c03091', 'Mensajería'],
  [
    'SUPPORT_BILLING',
    'a7cde8bf-fbf8-5632-9517-7f4a67b94570',
    'Facturación y caja',
  ],
  ['SUPPORT_REPORTS', 'd69897ff-ff51-5675-b8b8-275a5cad1e3d', 'Reportes'],
  ['SUPPORT_TEAM', 'c368a0a0-f783-539d-8c90-d271c6d15664', 'Equipo de apoyo'],
  [
    'SUPPORT_AUDIT',
    '4956a307-bc81-5b38-a8a5-4143cc416f5c',
    'Auditoría y explicación',
  ],
];

/** Átomo primario de cada alias de los 15 códigos actuales (CONTRATO-GOBIERNO §2.3 regla 2) y su sensibilidad. */
const SENSIBILIDAD_ALIAS: Record<string, string> = {
  'schedule.view': 'LOW',
  'schedule.create': 'MEDIUM',
  'schedule.reschedule': 'MEDIUM',
  'schedule.cancel': 'MEDIUM',
  'schedule.confirm': 'LOW',
  'schedule.check_in': 'LOW',
  'schedule.walk_in': 'MEDIUM',
  'schedule.waitlist': 'LOW',
  'schedule.send_reminders': 'LOW',
  'schedule.block_time': 'MEDIUM',
  'schedule.edit_hours': 'HIGH',
  'billing.collect': 'HIGH',
  'billing.issue_receipt': 'HIGH',
  'patient.register': 'MEDIUM',
  'messages.reply_on_behalf': 'MEDIUM',
};

const FILAS = ATOMOS.map((fila) => {
  const [code, id, sens, motivo, mfa, aprob, prop, base, clin, campo, asig] =
    fila.split('|');
  return { code, id, sens, motivo, mfa, aprob, prop, base, clin, campo, asig };
});

const semilla = (code: string) =>
  PLATFORM_PERMISSION_SEED.find((p) => p.code === code);

const SENS = {
  LOW: AUTHZ.SENSITIVITY_LOW,
  MEDIUM: AUTHZ.SENSITIVITY_MEDIUM,
  HIGH: AUTHZ.SENSITIVITY_HIGH,
  CRITICAL: AUTHZ.SENSITIVITY_CRITICAL,
} as Record<string, string>;
const PROPOSITO = {
  TREATMENT: AUTHZ.PURPOSE_TREATMENT,
  PAYMENT: AUTHZ.PURPOSE_PAYMENT,
  OPERATIONS: AUTHZ.PURPOSE_OPERATIONS,
} as Record<string, string>;
const BASE = {
  TREATMENT: AUD.LEGAL_BASIS_TREATMENT,
  CONSENT: AUD.LEGAL_BASIS_CONSENT,
  LEGAL_OBLIGATION: AUD.LEGAL_BASIS_LEGAL_OBLIGATION,
  HEALTHCARE_OPERATIONS: AUD.LEGAL_BASIS_HEALTHCARE_OPERATIONS,
} as Record<string, string>;

describe('catálogo de permisos atómicos de apoyo en la semilla de arranque', () => {
  it('son 73 átomos más los 15 códigos antiguos y los 2 de sistema previos (90)', () => {
    expect(FILAS).toHaveLength(73);
    expect(PLATFORM_PERMISSION_SEED).toHaveLength(
      2 + SUPPORT_ACTIONS.length + 73,
    );
    const codigos = PLATFORM_PERMISSION_SEED.map((p) => p.code);
    expect(new Set(codigos).size).toBe(codigos.length);
    const ids = PLATFORM_PERMISSION_SEED.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(FILAS)('$code: id determinista del Anexo A', ({ code, id }) => {
    expect(platformPermissionId(code)).toBe(
      deterministicId(`seed:authz-permission:${code}`),
    );
    expect(semilla(code)?.id).toBe(id);
  });

  it.each(FILAS)(
    '$code: forma, ámbito y metadatos de gobierno del §2.2',
    (f) => {
      const s = semilla(f.code);
      expect(s).toBeDefined();
      // módulo.recurso.acción[.campo]: 3 o 4 segmentos en minúscula y snake_case.
      expect(f.code).toMatch(/^[a-z_]+(\.[a-z_]+){2,3}$/);
      expect(s?.scope).toBe('TENANT');
      expect(s?.name.trim().length).toBeGreaterThan(5);
      const g = s?.governance;
      expect(g).toBeDefined();
      expect(g?.sensitivity).toBe(SENS[f.sens] ? f.sens : 'x');
      expect(g?.requiresReason).toBe(f.motivo === '1');
      expect(g?.requiresStepUp).toBe(f.mfa === '1');
      expect(g?.approvalMode ?? '-').toBe(f.aprob);
      expect(g?.purposeOfUse).toBe(f.prop);
      expect(g?.legalBasis).toBe(f.base);
      expect(g?.touchesClinicalData).toBe(f.clin === '1');
      expect(s?.fieldLevel).toBe(f.campo === '1');
      expect(g?.supportAssignable).toBe(f.asig === '1');
      // is_dangerous = sensibilidad >= ALTA.
      expect(s?.dangerous).toBe(f.sens === 'HIGH' || f.sens === 'CRITICAL');
      // Un permiso de campo lleva el cuarto segmento (módulo.recurso.acción.campo).
      if (f.campo === '1') expect(f.code.split('.')).toHaveLength(4);
      // Una aprobación exige sensibilidad (ck_permissions_approval_needs_sensitivity).
      if (g?.approvalMode) expect(g.sensitivity).toBeTruthy();
      // La categoría sale del módulo del código.
      const porModulo = {
        agenda: 'SUPPORT_AGENDA',
        patients: 'SUPPORT_PATIENTS',
        messages: 'SUPPORT_MESSAGING',
        billing: 'SUPPORT_BILLING',
        reports: 'SUPPORT_REPORTS',
        team: 'SUPPORT_TEAM',
        audit: 'SUPPORT_AUDIT',
      } as Record<string, string>;
      expect(s?.categoryCode).toBe(porModulo[f.code.split('.')[0]]);
    },
  );

  it('cuadra con el resumen del contrato (sensibilidad, obligaciones, campo, clínicos, no asignables)', () => {
    const atomos = FILAS.map((f) => semilla(f.code)!);
    const cuenta = (pred: (s: (typeof atomos)[number]) => boolean): number =>
      atomos.filter(pred).length;
    const sens = (n: string): number =>
      cuenta((s) => s.governance?.sensitivity === n);
    expect([
      sens('LOW'),
      sens('MEDIUM'),
      sens('HIGH'),
      sens('CRITICAL'),
    ]).toEqual([11, 27, 29, 6]);
    expect(cuenta((s) => s.governance?.requiresReason === true)).toBe(31);
    expect(cuenta((s) => s.governance?.requiresStepUp === true)).toBe(14);
    expect(cuenta((s) => s.governance?.approvalMode === 'DOCTOR')).toBe(3);
    expect(
      cuenta((s) => s.governance?.approvalMode === 'SECOND_APPROVER'),
    ).toBe(7);
    expect(cuenta((s) => s.fieldLevel === true)).toBe(8);
    expect(cuenta((s) => s.governance?.touchesClinicalData === true)).toBe(2);
    expect(cuenta((s) => s.governance?.supportAssignable === false)).toBe(4);
    const noAsignables = atomos
      .filter((s) => s.governance?.supportAssignable === false)
      .map((s) => s.code)
      .sort();
    expect(noAsignables).toEqual([
      'team.guardrails.manage',
      'team.sessionpolicy.manage',
      'team.sod.manage',
      'team.templates.manage',
    ]);
    const porCategoria = (c: string): number =>
      cuenta((s) => s.categoryCode === c);
    expect(
      [
        'SUPPORT_AGENDA',
        'SUPPORT_PATIENTS',
        'SUPPORT_MESSAGING',
        'SUPPORT_BILLING',
        'SUPPORT_REPORTS',
        'SUPPORT_TEAM',
        'SUPPORT_AUDIT',
      ].map(porCategoria),
    ).toEqual([20, 11, 9, 7, 4, 17, 5]);
  });

  it('los conceptos de sensibilidad, propósito y base legal existen en los catálogos de concepto', () => {
    for (const v of Object.values(SENS)) expect(v).toMatch(/^[0-9a-f-]{36}$/);
    for (const v of Object.values(PROPOSITO)) expect(v).toBeDefined();
    for (const v of Object.values(BASE)) expect(v).toBeDefined();
  });

  it('las siete categorías llevan el id del Anexo A y un orden estable', () => {
    expect(PERMISSION_CATEGORY_SEED).toHaveLength(7);
    for (const [code, id, name] of CATEGORIAS) {
      const c = PERMISSION_CATEGORY_SEED.find((x) => x.code === code);
      expect(c?.id).toBe(id);
      expect(c?.id).toBe(
        deterministicId(`seed:authz-permission-category:${code}`),
      );
      expect(c?.name).toBe(
        name === 'Facturación y caja' ? 'Facturación y caja' : name,
      );
    }
    expect(PERMISSION_CATEGORY_SEED.map((c) => c.ordinal)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it('los 15 códigos antiguos conservan su id y quedan asignables a apoyo con la sensibilidad de su átomo primario', () => {
    for (const code of SUPPORT_ACTIONS) {
      const s = semilla(code);
      expect(s?.id).toBe(deterministicId(`seed:authz-permission:${code}`));
      const g = s?.governance;
      expect(g?.supportAssignable).toBe(true);
      expect(g?.sensitivity).toBe(SENSIBILIDAD_ALIAS[code]);
      // Regla de no regresión (§2.3): un alias no gana obligaciones nuevas.
      expect(g?.requiresReason).toBe(false);
      expect(g?.requiresStepUp).toBe(false);
      expect(g?.approvalMode ?? null).toBeNull();
      expect(s?.categoryCode ?? null).toBeNull();
    }
    expect(semilla('schedule.view')?.id).toBe(
      '438c578b-e5ea-5c58-86ed-fcf7da71780e',
    );
  });

  it('los dos permisos de sistema previos no cambian ni se vuelven asignables a apoyo', () => {
    for (const code of [
      'DIAGNOSTIC_RESULT_READ',
      'CLINICAL_RECORD_TEMPORARY_VIEW',
    ]) {
      expect(semilla(code)?.governance).toBeUndefined();
    }
  });

  describe('piso de campos de plataforma para SUPPORT_STAFF (authz.field_permissions)', () => {
    const CLASES = {
      'clinical.conditions': Conditions,
      'chart.clinical_note_versions': ClinicalNoteVersions,
      'clinical.observations': Observations,
      'clinical.medication_requests': MedicationRequests,
    } as Record<string, { name: string }>;

    /** Columnas que mapea la entidad de la tabla, leídas de sus decoradores. */
    function columnas(clase: { name: string }): Set<string> {
      const todas = MetadataStorage.getMetadata() as unknown as Record<
        string,
        { properties: Record<string, { fieldName: string }> }
      >;
      const llave = Object.keys(todas).find((k) =>
        k.startsWith(`${clase.name}-`),
      );
      return new Set(
        Object.values(todas[llave as string].properties).map(
          (p) => p.fieldName,
        ),
      );
    }

    it('no deja leer ni escribir diagnóstico, notas, resultados ni indicación (GP-3)', () => {
      expect(SUPPORT_STAFF_FIELD_FLOOR.length).toBeGreaterThanOrEqual(8);
      for (const f of SUPPORT_STAFF_FIELD_FLOOR) {
        expect(f.canRead).toBe(false);
        expect(f.canWrite).toBe(false);
      }
      const entidades = new Set(SUPPORT_STAFF_FIELD_FLOOR.map((f) => f.entity));
      expect([...entidades].sort()).toEqual(Object.keys(CLASES).sort());
    });

    it('cada fila del piso lleva el id determinista que también escribe el parche SQL', () => {
      for (const f of SUPPORT_STAFF_FIELD_FLOOR) {
        expect(f.id).toBe(
          deterministicId(
            `seed:authz-field-permission:SUPPORT_STAFF:${f.entity}.${f.columnName}`,
          ),
        );
      }
      expect(SUPPORT_STAFF_FIELD_FLOOR[0].id).toBe(
        '31b541e4-bc81-5ba0-9f3f-53f2648d97ed',
      );
      expect(new Set(SUPPORT_STAFF_FIELD_FLOOR.map((f) => f.id)).size).toBe(
        SUPPORT_STAFF_FIELD_FLOOR.length,
      );
    });

    it('cada (entidad, columna) del piso existe de verdad en el modelo', () => {
      for (const f of SUPPORT_STAFF_FIELD_FLOOR) {
        expect({
          f,
          existe: columnas(CLASES[f.entity]).has(f.columnName),
        }).toEqual({
          f,
          existe: true,
        });
      }
      const claves = SUPPORT_STAFF_FIELD_FLOOR.map(
        (f) => `${f.entity}.${f.columnName}`,
      );
      expect(new Set(claves).size).toBe(claves.length);
    });
  });
});
