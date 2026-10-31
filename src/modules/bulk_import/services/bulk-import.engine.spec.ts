import { describe, expect, it } from '@jest/globals';
import {
  BULK_IMPORT_LIMITS,
  BULK_IMPORT_PERMISSIONS,
  BulkImportStatus,
  RowOutcome,
} from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import { codedPairs } from '../schema/clinical-kinds';
import { exampleRow, type KindSchema } from '../schema/field-schema';
import { findKindSchema } from '../schema/registry';
import { buildEngine, actor, TENANT_A, TENANT_B } from '../testing/harness';
import { canonicalRowHash } from './bulk-import.processor';
import { sha256Hex } from './validation.service';

/**
 * El motor completo —validación, vista previa, confirmación, procesamiento e
 * informe— ejercitado contra DOBLES DECLARADOS (`testing/fakes.ts`) de la
 * persistencia, del alta de usuarios, de la escritura clínica y de los
 * resolutores. Prueba el motor; no prueba a ningún colaborador real.
 */

const PATIENT = findKindSchema('usuario-paciente') as KindSchema;
const STAFF = findKindSchema('usuario-personal-organizacion') as KindSchema;
const DX = findKindSchema('hc-diagnostico') as KindSchema;
const USERS_DECLARATION = { reason: 'Incorporación de prueba (sintética)' };
const CLINICAL_DECLARATION = {
  sourceOrganization: 'Organización de origen sintética',
  legalBasis: 'Convenio de prueba (sintético)',
  loadedAt: '2026-10-31',
};

function staffRows(n: number): Record<string, string>[] {
  return Array.from({ length: n }, (_, i) => ({
    ...exampleRow(STAFF),
    displayName: `Persona ${i}`,
    email: `personal${i}@ejemplo.invalid`,
  }));
}

function dxRow(
  i: number,
  over: Record<string, string> = {},
): Record<string, string> {
  return {
    ...exampleRow(DX),
    nationalId: `SINT-${1000 + i}`,
    sourceRecordId: `ORIGEN-${i}`,
    diagnosisCode: `SINT-DX-${i}`,
    ...over,
  };
}

function seedClinical(e: ReturnType<typeof buildEngine>, n: number): void {
  for (let i = 0; i < n; i += 1) {
    e.patients.add(`SINT-${1000 + i}`, '1990-05-17');
    e.codes.add('sistema-demo', `SINT-DX-${i}`);
  }
}

describe('crear lote · vista previa', () => {
  it('correcto: filas válidas dejan el lote VALIDADO y no escriben nada', async () => {
    const e = buildEngine();
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(3) },
    });
    expect(view.status).toBe(BulkImportStatus.VALIDATED);
    expect(view.counts).toEqual({ total: 3, valid: 3, rejected: 0 });
    expect(view.issues).toEqual({ total: 0, truncated: false, items: [] });
    expect(e.users.created).toHaveLength(0);
  });

  it('vista previa por fila y campo, sin PII en los mensajes', async () => {
    const e = buildEngine();
    const SENTINEL = 'dato.personal.9931';
    const rows = [
      ...staffRows(2),
      {
        ...exampleRow(STAFF),
        email: `${SENTINEL}-sin-arroba`,
        displayName: SENTINEL,
        role: SENTINEL,
      },
    ];
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows },
    });
    expect(view.status).toBe(BulkImportStatus.VALIDATED);
    expect(view.counts).toEqual({ total: 3, valid: 2, rejected: 1 });
    expect(
      view.issues.items.map((i) => `${i.row}:${i.field}:${i.code}`).sort(),
    ).toEqual(['3:email:INVALID_FORMAT', '3:role:NOT_ALLOWED_VALUE']);
    expect(JSON.stringify(view)).not.toContain(SENTINEL);
  });

  it('todas inválidas → RECHAZADO; sin filas almacenadas', async () => {
    const e = buildEngine();
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: [{ email: 'x' }] },
    });
    expect(view.status).toBe(BulkImportStatus.REJECTED);
    expect((await e.repo.findById(TENANT_A, view.id))?.rows).toEqual([]);
  });

  it('archivo con columna ajena o faltante → RECHAZADO con hallazgos del archivo', async () => {
    const e = buildEngine();
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: {
        file: {
          buffer: Buffer.from('displayName,rara\nA,b\n'),
          fileName: 'a.csv',
        },
      },
    });
    expect(view.status).toBe(BulkImportStatus.REJECTED);
    expect(view.fileIssues.map((i) => i.code).sort()).toEqual([
      'COLUMN_MISSING',
      'UNKNOWN_FIELD',
    ]);
  });

  it('correo repetido dentro del archivo → DUPLICATE_IN_FILE en la segunda fila', async () => {
    const e = buildEngine();
    const [a] = staffRows(1);
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: {
        rows: [
          a,
          { ...a, displayName: 'Otra' },
          { ...a, email: 'A@EJEMPLO.INVALID'.replace('A@', 'personal0@') },
        ],
      },
    });
    expect(view.issues.items.map((i) => `${i.row}:${i.code}`)).toEqual([
      '2:DUPLICATE_IN_FILE',
      '3:DUPLICATE_IN_FILE',
    ]);
    expect(view.counts.valid).toBe(1);
  });

  it('el tope de hallazgos de la vista previa es 200, con el total real', async () => {
    const e = buildEngine();
    const rows: Record<string, string>[] = Array.from({ length: 450 }, () => ({
      ...exampleRow(STAFF),
      email: 'malo',
    }));
    rows.push(...staffRows(1));
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows },
    });
    expect(view.issues.items).toHaveLength(BULK_IMPORT_LIMITS.maxPreviewIssues);
    expect(view.issues.total).toBe(450);
    expect(view.issues.truncated).toBe(true);
    expect(view.counts).toEqual({ total: 451, valid: 1, rejected: 450 });
  });

  it('declaración: usuarios exigen motivo; historia exige origen, base legal y fecha', async () => {
    const e = buildEngine();
    const run = (kind: string, declaration: object) =>
      e.service.create(e.admin, TENANT_A, {
        kind,
        declaration,
        source: { rows: [] },
      });
    await expect(run(STAFF.kind, {})).rejects.toMatchObject({
      reason: BulkImportReason.DECLARATION_INVALID,
    });
    await expect(
      run(STAFF.kind, { reason: 'x', legalBasis: 'y' }),
    ).rejects.toMatchObject({
      reason: BulkImportReason.DECLARATION_INVALID,
    });
    for (const bad of [
      { ...CLINICAL_DECLARATION, sourceOrganization: undefined },
      { ...CLINICAL_DECLARATION, legalBasis: 'ab' },
      { ...CLINICAL_DECLARATION, loadedAt: undefined },
      { ...CLINICAL_DECLARATION, loadedAt: '31/10/2026' },
      { ...CLINICAL_DECLARATION, loadedAt: '2999-01-01' },
      { ...CLINICAL_DECLARATION, loadedAt: '2026-02-30' },
      { ...CLINICAL_DECLARATION, reason: 'sobra' },
    ]) {
      await expect(run(DX.kind, bad)).rejects.toMatchObject({
        reason: BulkImportReason.DECLARATION_INVALID,
      });
    }
  });

  it('archivo y filas a la vez, o ninguno → SOURCE_AMBIGUOUS; tipo inexistente → 404', async () => {
    const e = buildEngine();
    const file = { buffer: Buffer.from('a'), fileName: 'a.csv' };
    for (const source of [{ file, rows: [] }, {}]) {
      await expect(
        e.service.create(e.admin, TENANT_A, {
          kind: STAFF.kind,
          declaration: USERS_DECLARATION,
          source,
        }),
      ).rejects.toMatchObject({ reason: BulkImportReason.SOURCE_AMBIGUOUS });
    }
    await expect(
      e.service.create(e.admin, TENANT_A, {
        kind: 'nope',
        declaration: {},
        source: { rows: [] },
      }),
    ).rejects.toMatchObject({ reason: BulkImportReason.KIND_UNKNOWN });
  });

  it('el logger no registra datos de las filas', async () => {
    const e = buildEngine();
    const SENTINEL = 'correo.sensible.4471';
    await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: {
        rows: [
          {
            ...exampleRow(STAFF),
            email: `${SENTINEL}@ejemplo.invalid`,
            displayName: SENTINEL,
          },
        ],
      },
    });
    expect(e.logger.lines.length).toBeGreaterThan(0);
    expect(e.logger.lines.join('\n')).not.toContain(SENTINEL);
  });
});

describe('historia clínica · resolución de paciente y de códigos (0 / 1 / >1)', () => {
  async function preview(
    e: ReturnType<typeof buildEngine>,
    rows: Record<string, string>[],
  ) {
    return e.service.create(e.admin, TENANT_A, {
      kind: DX.kind,
      declaration: CLINICAL_DECLARATION,
      source: { rows },
    });
  }

  it('1 coincidencia → fila válida; 0 → PATIENT_NOT_FOUND; >1 → PATIENT_AMBIGUOUS; nunca se adivina', async () => {
    const e = buildEngine();
    e.patients.add('SINT-1000', '1990-05-17');
    e.patients.add('SINT-1001', '1990-05-17');
    e.patients.add('SINT-1001', '1990-05-17'); // homónimo exacto
    for (let i = 0; i < 3; i += 1) e.codes.add('sistema-demo', `SINT-DX-${i}`);
    const view = await preview(e, [
      dxRow(0), // 1 coincidencia
      dxRow(1), // 2 coincidencias
      dxRow(2), // 0 coincidencias (SINT-1002 no existe)
    ]);
    expect(view.counts).toEqual({ total: 3, valid: 1, rejected: 2 });
    expect(
      view.issues.items.map((i) => `${i.row}:${i.field}:${i.code}`),
    ).toEqual([
      '2:nationalId:PATIENT_AMBIGUOUS',
      '3:nationalId:PATIENT_NOT_FOUND',
    ]);
  });

  it('mismo documento con otra fecha de nacimiento no coincide', async () => {
    const e = buildEngine();
    seedClinical(e, 1);
    const view = await preview(e, [dxRow(0, { birthDate: '1990-05-18' })]);
    expect(view.status).toBe(BulkImportStatus.REJECTED);
    expect(view.issues.items[0].code).toBe(BulkImportReason.PATIENT_NOT_FOUND);
  });

  it('consentimiento revocado → CONSENT_REVOKED', async () => {
    const e = buildEngine();
    e.patients.add('SINT-1000', '1990-05-17', true);
    e.codes.add('sistema-demo', 'SINT-DX-0');
    const view = await preview(e, [dxRow(0)]);
    expect(view.issues.items[0].code).toBe(BulkImportReason.CONSENT_REVOKED);
  });

  it('código inexistente → CODE_NOT_FOUND en la columna del código; ambiguo → CODE_AMBIGUOUS', async () => {
    const e = buildEngine();
    e.patients.add('SINT-1000', '1990-05-17');
    e.patients.add('SINT-1001', '1990-05-17');
    e.codes.add('sistema-demo', 'SINT-DX-1', 2);
    const view = await preview(e, [dxRow(0), dxRow(1)]);
    expect(
      view.issues.items.map((i) => `${i.row}:${i.field}:${i.code}`),
    ).toEqual([
      '1:diagnosisCode:CODE_NOT_FOUND',
      '2:diagnosisCode:CODE_AMBIGUOUS',
    ]);
  });

  it('resolutor caído → la fila se rechaza con RESOLUTION_UNAVAILABLE, no revienta el lote', async () => {
    const e = buildEngine();
    e.patients.failWith = new Error('padrón caído');
    const view = await preview(e, [dxRow(0)]);
    expect(view.status).toBe(BulkImportStatus.REJECTED);
    expect(view.issues.items[0].code).toBe(
      BulkImportReason.RESOLUTION_UNAVAILABLE,
    );
  });

  it('el documento y la fecha de nacimiento no aparecen en vista previa ni en logs', async () => {
    const e = buildEngine();
    await preview(e, [
      dxRow(0, { nationalId: 'DOC-9988-77', birthDate: '1971-02-03' }),
    ]);
    const view = await preview(e, [
      dxRow(0, { nationalId: 'DOC-9988-77', birthDate: '1971-02-03' }),
    ]);
    expect(JSON.stringify(view)).not.toMatch(/DOC-9988-77|1971-02-03/);
    expect(e.logger.lines.join('\n')).not.toMatch(/DOC-9988-77|1971-02-03/);
  });

  it('un paciente repetido en varias filas se consulta una sola vez', async () => {
    const e = buildEngine();
    e.patients.add('SINT-1000', '1990-05-17');
    e.codes.add('sistema-demo', 'SINT-DX-0');
    await preview(e, [dxRow(0), dxRow(0, { sourceRecordId: 'ORIGEN-X' })]);
    expect(e.patients.calls).toBe(1);
  });
});

describe('autorización y aislamiento', () => {
  it('sin el permiso fino → 403 PERMISSION_REQUIRED en crear, confirmar, consultar, informe y listar', async () => {
    const e = buildEngine();
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(1) },
    });
    const sinPermiso = actor('admin-sin-permiso');
    const denied = {
      reason: BulkImportReason.PERMISSION_REQUIRED,
      status: 403,
    };
    await expect(
      e.service.create(sinPermiso, TENANT_A, {
        kind: STAFF.kind,
        declaration: USERS_DECLARATION,
        source: { rows: [] },
      }),
    ).rejects.toMatchObject(denied);
    await expect(
      e.service.confirm(sinPermiso, TENANT_A, view.id, 'k1'),
    ).rejects.toMatchObject(denied);
    await expect(
      e.service.get(sinPermiso, TENANT_A, view.id),
    ).rejects.toMatchObject(denied);
    await expect(
      e.service.report(sinPermiso, TENANT_A, view.id),
    ).rejects.toMatchObject(denied);
    await expect(
      e.service.list(sinPermiso, TENANT_A, 10),
    ).rejects.toMatchObject(denied);
  });

  it('el permiso de usuarios no sirve para historia clínica, y al revés', async () => {
    const e = buildEngine();
    const soloUsuarios = actor('solo-usuarios');
    const soloClinica = actor('solo-clinica');
    e.policy.grant(soloUsuarios.id, BULK_IMPORT_PERMISSIONS.users);
    e.policy.grant(soloClinica.id, BULK_IMPORT_PERMISSIONS.clinical);
    await expect(
      e.service.create(soloUsuarios, TENANT_A, {
        kind: DX.kind,
        declaration: CLINICAL_DECLARATION,
        source: { rows: [] },
      }),
    ).rejects.toMatchObject({ reason: BulkImportReason.PERMISSION_REQUIRED });
    await expect(
      e.service.create(soloClinica, TENANT_A, {
        kind: STAFF.kind,
        declaration: USERS_DECLARATION,
        source: { rows: [] },
      }),
    ).rejects.toMatchObject({ reason: BulkImportReason.PERMISSION_REQUIRED });
  });

  it('otra organización → 404 (igual que inexistente), aun con el permiso fino', async () => {
    const e = buildEngine();
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(1) },
    });
    const notFound = {
      reason: BulkImportReason.BATCH_NOT_AVAILABLE,
      status: 404,
    };
    await expect(
      e.service.get(e.admin, TENANT_B, view.id),
    ).rejects.toMatchObject(notFound);
    await expect(
      e.service.report(e.admin, TENANT_B, view.id),
    ).rejects.toMatchObject(notFound);
    await expect(
      e.service.confirm(e.admin, TENANT_B, view.id, 'k1'),
    ).rejects.toMatchObject(notFound);
    await expect(
      e.service.get(e.admin, TENANT_A, '00000000-0000-4000-8000-00000000dead'),
    ).rejects.toMatchObject(notFound);
    expect(await e.service.list(e.admin, TENANT_B, 10)).toEqual([]);
    expect(
      (await e.service.list(e.admin, TENANT_A, 10)).map((b) => b.id),
    ).toEqual([view.id]);
  });

  it('ni siquiera sin permiso se revela que el lote ajeno existe: primero 404, no 403', async () => {
    const e = buildEngine();
    const view = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(1) },
    });
    await expect(
      e.service.get(actor('intruso'), TENANT_B, view.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('listar sólo muestra los lotes de los grupos que el actor puede ver', async () => {
    const e = buildEngine();
    seedClinical(e, 1);
    const users = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(1) },
    });
    const clin = await e.service.create(e.admin, TENANT_A, {
      kind: DX.kind,
      declaration: CLINICAL_DECLARATION,
      source: { rows: [dxRow(0)] },
    });
    const soloUsuarios = actor('solo-usuarios');
    e.policy.grant(soloUsuarios.id, BULK_IMPORT_PERMISSIONS.users);
    expect(
      (await e.service.list(soloUsuarios, TENANT_A, 10)).map((b) => b.id),
    ).toEqual([users.id]);
    expect(
      (await e.service.list(e.admin, TENANT_A, 10)).map((b) => b.id).sort(),
    ).toEqual([users.id, clin.id].sort());
  });
});

describe('confirmar · idempotencia y estados', () => {
  async function validated(e: ReturnType<typeof buildEngine>, n = 3) {
    return e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(n) },
    });
  }

  it('exige clave de idempotencia válida', async () => {
    const e = buildEngine();
    const v = await validated(e);
    for (const key of [undefined, '', 'con espacio', 'x'.repeat(129)]) {
      await expect(
        e.service.confirm(e.admin, TENANT_A, v.id, key),
      ).rejects.toMatchObject({
        reason: BulkImportReason.IDEMPOTENCY_KEY_REQUIRED,
        status: 400,
      });
    }
  });

  it('confirmar encola (EN_COLA) y procesa de forma asíncrona hasta COMPLETADO', async () => {
    const e = buildEngine();
    const v = await validated(e);
    const queued = await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    expect(queued.status).toBe(BulkImportStatus.QUEUED);
    expect(e.users.created).toHaveLength(0); // todavía no escribió: la respuesta no espera al trabajo
    await e.processor.drain();
    const done = await e.service.get(e.admin, TENANT_A, v.id);
    expect(done.status).toBe(BulkImportStatus.COMPLETED);
    expect(done.progress).toEqual({ processed: 3, total: 3 });
    expect(e.users.created).toHaveLength(3);
  });

  it('el mismo lote confirmado dos veces con la misma clave NO duplica', async () => {
    const e = buildEngine();
    const v = await validated(e);
    const first = await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    const second = await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    expect(second.id).toBe(first.id);
    await e.processor.drain();
    const third = await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1'); // ya completado
    expect(third.status).toBe(BulkImportStatus.COMPLETED);
    expect(e.users.created).toHaveLength(3);
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.totals[RowOutcome.CREATED]).toBe(3);
  });

  it('dos confirmaciones simultáneas con la misma clave escriben una sola vez', async () => {
    const e = buildEngine();
    const v = await validated(e);
    const results = await Promise.all([
      e.service.confirm(e.admin, TENANT_A, v.id, 'key-1'),
      e.service.confirm(e.admin, TENANT_A, v.id, 'key-1'),
    ]);
    expect(results.map((r) => r.id)).toEqual([v.id, v.id]);
    await e.processor.drain();
    expect(e.users.created).toHaveLength(3);
  });

  it('otra clave sobre un lote ya confirmado → 409; clave de otro lote → 409', async () => {
    const e = buildEngine();
    const a = await validated(e);
    const b = await validated(e);
    await e.service.confirm(e.admin, TENANT_A, a.id, 'key-1');
    await expect(
      e.service.confirm(e.admin, TENANT_A, a.id, 'key-2'),
    ).rejects.toMatchObject({
      reason: BulkImportReason.BATCH_ALREADY_CONFIRMED,
      status: 409,
    });
    await expect(
      e.service.confirm(e.admin, TENANT_A, b.id, 'key-1'),
    ).rejects.toMatchObject({
      reason: BulkImportReason.IDEMPOTENCY_KEY_REUSED,
      status: 409,
    });
    await e.processor.drain();
  });

  it('un lote RECHAZADO no se confirma', async () => {
    const e = buildEngine();
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: [{ email: 'x' }] },
    });
    await expect(
      e.service.confirm(e.admin, TENANT_A, v.id, 'key-1'),
    ).rejects.toMatchObject({
      reason: BulkImportReason.BATCH_NOT_CONFIRMABLE,
    });
  });

  it('el informe de un lote que no terminó → 409 REPORT_NOT_READY', async () => {
    const e = buildEngine();
    const v = await validated(e);
    await expect(
      e.service.report(e.admin, TENANT_A, v.id),
    ).rejects.toMatchObject({
      reason: BulkImportReason.REPORT_NOT_READY,
    });
  });

  it('dos procesadores sobre el mismo lote: sólo uno lo toma', async () => {
    const e = buildEngine();
    const v = await validated(e);
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await Promise.all([
      e.processor.process(TENANT_A, v.id, e.admin),
      e.processor.process(TENANT_A, v.id, e.admin),
    ]);
    await e.processor.drain();
    expect(e.users.created).toHaveLength(3);
  });
});

describe('procesamiento · fallo parcial, plazos e idempotencia por fila', () => {
  it('una fila que falla no aborta el resto y queda FALLIDA con su motivo', async () => {
    const e = buildEngine();
    e.users.failOnEmails.add('personal1@ejemplo.invalid');
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(3) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.status).toBe(BulkImportStatus.COMPLETED);
    expect(report.totals[RowOutcome.CREATED]).toBe(2);
    expect(report.totals[RowOutcome.FAILED]).toBe(1);
    expect(report.rows.find((r) => r.row === 2)).toMatchObject({
      outcome: RowOutcome.FAILED,
      reason: BulkImportReason.WRITE_FAILED,
    });
  });

  it('una llamada colgada agota el plazo de la fila (ROW_TIMEOUT) y el lote sigue', async () => {
    const e = buildEngine({ rowMs: 40, batchMs: 30_000, rowAttempts: 2 });
    e.users.hangOnEmails.add('personal0@ejemplo.invalid');
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(2) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.rows[0]).toMatchObject({
      outcome: RowOutcome.FAILED,
      reason: BulkImportReason.ROW_TIMEOUT,
    });
    expect(report.rows[1].outcome).toBe(RowOutcome.CREATED);
  });

  it('plazo del lote agotado → FALLIDO con BATCH_TIMEOUT y las filas restantes NO_PROCESADA', async () => {
    const e = buildEngine({ rowMs: 2_000, batchMs: 60, rowAttempts: 1 });
    e.users.delayMs = 40;
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(6) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const done = await e.service.get(e.admin, TENANT_A, v.id);
    expect(done.status).toBe(BulkImportStatus.FAILED);
    expect(done.failureReason).toBe(BulkImportReason.BATCH_TIMEOUT);
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.totals[RowOutcome.NOT_PROCESSED]).toBeGreaterThan(0);
    expect(
      report.totals[RowOutcome.CREATED] +
        report.totals[RowOutcome.NOT_PROCESSED],
    ).toBe(6);
  });

  it('reintenta una vez ante un error transitorio y después escribe', async () => {
    const e = buildEngine({ rowMs: 5_000, batchMs: 30_000, rowAttempts: 2 });
    let calls = 0;
    const original = e.users.provision.bind(e.users);
    e.users.provision = async (input) => {
      calls += 1;
      if (calls === 1)
        throw Object.assign(new Error('reset'), { code: 'ECONNRESET' });
      return original(input);
    };
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(1) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    expect(calls).toBe(2);
    expect(e.users.created).toHaveLength(1);
  });

  it('el mismo contenido en un lote nuevo no duplica: las filas salen OMITIDA', async () => {
    const e = buildEngine();
    const make = async (key: string) => {
      const v = await e.service.create(e.admin, TENANT_A, {
        kind: STAFF.kind,
        declaration: USERS_DECLARATION,
        source: { rows: staffRows(3) },
      });
      await e.service.confirm(e.admin, TENANT_A, v.id, key);
      await e.processor.drain();
      return e.service.report(e.admin, TENANT_A, v.id);
    };
    const first = await make('key-1');
    const second = await make('key-2');
    expect(first.totals[RowOutcome.CREATED]).toBe(3);
    expect(second.totals[RowOutcome.CREATED]).toBe(0);
    expect(second.totals[RowOutcome.SKIPPED]).toBe(3);
    expect(second.rows[0]).toMatchObject({
      outcome: RowOutcome.SKIPPED,
      reason: BulkImportReason.ALREADY_LOADED,
    });
    expect(e.users.created).toHaveLength(3);
  });

  it('una cuenta preexistente se omite y no se toca', async () => {
    const e = buildEngine();
    e.users.preexisting('personal1@ejemplo.invalid');
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(3) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.totals[RowOutcome.CREATED]).toBe(2);
    expect(report.totals[RowOutcome.SKIPPED]).toBe(1);
  });

  it('la clave de fila es estable e independiente del orden y del lote, y distinta por tenant', async () => {
    const e = buildEngine();
    const keysOf = async (tenant: string, rows: Record<string, string>[]) => {
      const v = await e.service.create(e.admin, tenant, {
        kind: STAFF.kind,
        declaration: USERS_DECLARATION,
        source: { rows },
      });
      return (
        (await e.repo.findById(tenant, v.id))?.rows.map((r) => r.rowKey) ?? []
      );
    };
    const rows = staffRows(2);
    const a = await keysOf(TENANT_A, rows);
    const reversed = await keysOf(TENANT_A, [...rows].reverse());
    const other = await keysOf(TENANT_B, rows);
    expect([...a].sort()).toEqual([...reversed].sort());
    expect(other[0]).not.toBe(a[0]);
    expect(sha256Hex('x')).toHaveLength(64);
  });

  it('al terminar, el lote no conserva las filas (datos personales) y el informe no los repite', async () => {
    const e = buildEngine();
    const SENTINEL = 'unico.marcador.5521';
    const rows = [
      {
        ...exampleRow(STAFF),
        displayName: SENTINEL,
        email: `${SENTINEL}@ejemplo.invalid`,
      },
    ];
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows },
    });
    expect((await e.repo.findById(TENANT_A, v.id))?.rows).toHaveLength(1);
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    expect((await e.repo.findById(TENANT_A, v.id))?.rows).toEqual([]);
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(JSON.stringify(report)).not.toContain(SENTINEL);
    expect(
      JSON.stringify(await e.service.get(e.admin, TENANT_A, v.id)),
    ).not.toContain(SENTINEL);
    expect(e.logger.lines.join('\n')).not.toContain(SENTINEL);
    expect(e.service.reportCsv(report).content.toString()).not.toContain(
      SENTINEL,
    );
  });

  it('cada alta deja auditoría con actor y lote, sin contenido', async () => {
    const e = buildEngine();
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(2) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    expect(e.audit.events.filter((x) => x.action === 'ROW_WRITTEN')).toEqual([
      expect.objectContaining({
        actorId: e.admin.id,
        batchId: v.id,
        tenantId: TENANT_A,
        row: 1,
      }),
      expect.objectContaining({
        actorId: e.admin.id,
        batchId: v.id,
        tenantId: TENANT_A,
        row: 2,
      }),
    ]);
    expect(JSON.stringify(e.audit.events)).not.toContain('@ejemplo.invalid');
  });

  it('informe en CSV: encabezado fijo, una fila por resultado, nombre con el id del lote', async () => {
    const e = buildEngine();
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: [...staffRows(1), { email: 'x' }] },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const csv = e.service.reportCsv(
      await e.service.report(e.admin, TENANT_A, v.id),
    );
    expect(csv.fileName).toBe(`informe-${v.id}.csv`);
    const lines = csv.content.toString().trim().split('\n');
    expect(lines[0]).toBe('row,outcome,reason,field,message');
    expect(lines).toHaveLength(3);
    expect(lines.some((l) => l.startsWith('1,CREADA'))).toBe(true);
    expect(lines.some((l) => l.startsWith('2,RECHAZADA,'))).toBe(true);
  });

  it('el informe de un lote RECHAZADO existe y lista los hallazgos del archivo', async () => {
    const e = buildEngine();
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { file: { buffer: Buffer.from('rara\nx\n'), fileName: 'a.csv' } },
    });
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.status).toBe(BulkImportStatus.REJECTED);
    expect(report.fileIssues.length).toBeGreaterThan(0);
  });

  it('con el ejecutor «no conectado» el informe NO dice creados: dice rechazadas por EXECUTOR_NOT_CONNECTED', async () => {
    const e = buildEngine();
    e.users.provision = () =>
      Promise.resolve({
        status: 'REJECTED' as const,
        reason: BulkImportReason.EXECUTOR_NOT_CONNECTED,
      });
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(2) },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.totals[RowOutcome.CREATED]).toBe(0);
    expect(report.totals[RowOutcome.REJECTED]).toBe(2);
    expect(report.rows[0].reason).toBe(BulkImportReason.EXECUTOR_NOT_CONNECTED);
  });
});

describe('historia clínica · sólo agregar, con procedencia', () => {
  async function run(
    e: ReturnType<typeof buildEngine>,
    rows: Record<string, string>[],
    key: string,
  ) {
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: DX.kind,
      declaration: CLINICAL_DECLARATION,
      source: { rows },
    });
    await e.service.confirm(e.admin, TENANT_A, v.id, key);
    await e.processor.drain();
    return { v, report: await e.service.report(e.admin, TENANT_A, v.id) };
  }

  it('agrega con procedencia (origen, lote, fecha, base legal) y conceptos resueltos', async () => {
    const e = buildEngine();
    seedClinical(e, 2);
    const { v, report } = await run(e, [dxRow(0), dxRow(1)], 'key-1');
    expect(report.totals[RowOutcome.CREATED]).toBe(2);
    expect(e.clinical.appended[0].provenance).toEqual({
      ...CLINICAL_DECLARATION,
      batchId: v.id,
      sourceRecordId: 'ORIGEN-0',
    });
    expect(e.clinical.appended[0].concepts.diagnosis).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(e.clinical.appended[0].contentHash).toBe(
      canonicalRowHash(e.clinical.appended[0].row),
    );
  });

  it('segunda corrida del mismo contenido: no inserta nada (OMITIDA)', async () => {
    const e = buildEngine();
    seedClinical(e, 2);
    const first = await run(e, [dxRow(0), dxRow(1)], 'key-1');
    const second = await run(e, [dxRow(0), dxRow(1)], 'key-2');
    expect(first.report.totals[RowOutcome.CREATED]).toBe(2);
    expect(second.report.totals[RowOutcome.CREATED]).toBe(0);
    expect(second.report.totals[RowOutcome.SKIPPED]).toBe(2);
    expect(e.clinical.appended).toHaveLength(2);
  });

  it('mismo sourceRecordId con otro contenido → CONFLICTO, y no se sobrescribe', async () => {
    const e = buildEngine();
    seedClinical(e, 1);
    await run(e, [dxRow(0)], 'key-1');
    const { report } = await run(
      e,
      [dxRow(0, { noteText: 'texto distinto' })],
      'key-2',
    );
    expect(report.totals[RowOutcome.CONFLICT]).toBe(1);
    expect(report.rows[0]).toMatchObject({
      outcome: RowOutcome.CONFLICT,
      reason: BulkImportReason.CONTENT_CONFLICT,
    });
    expect(e.clinical.appended).toHaveLength(1);
  });

  it('el consentimiento revocado DESPUÉS de la vista previa rechaza la fila al procesar', async () => {
    const e = buildEngine();
    seedClinical(e, 2);
    const v = await e.service.create(e.admin, TENANT_A, {
      kind: DX.kind,
      declaration: CLINICAL_DECLARATION,
      source: { rows: [dxRow(0), dxRow(1)] },
    });
    expect(v.counts.valid).toBe(2);
    // El padrón cambia entre validar y confirmar: se reemplaza la resolución del paciente 0.
    const original = e.patients.resolve.bind(e.patients);
    e.patients.resolve = async (t, n, b) => {
      const r = await original(t, n, b);
      return n === 'SINT-1000' && r.status === 'FOUND'
        ? { ...r, consentRevoked: true }
        : r;
    };
    await e.service.confirm(e.admin, TENANT_A, v.id, 'key-1');
    await e.processor.drain();
    const report = await e.service.report(e.admin, TENANT_A, v.id);
    expect(report.rows[0]).toMatchObject({
      outcome: RowOutcome.REJECTED,
      reason: BulkImportReason.CONSENT_REVOKED,
    });
    expect(report.rows[1].outcome).toBe(RowOutcome.CREATED);
    expect(e.clinical.appended).toHaveLength(1);
  });

  it('una fila que falla al escribir no aborta las demás', async () => {
    const e = buildEngine();
    seedClinical(e, 3);
    e.clinical.failOnSourceIds.add('ORIGEN-1');
    const { report } = await run(e, [dxRow(0), dxRow(1), dxRow(2)], 'key-1');
    expect(report.totals[RowOutcome.CREATED]).toBe(2);
    expect(report.totals[RowOutcome.FAILED]).toBe(1);
  });

  it('el informe no trae documentos, fechas de nacimiento, códigos ni textos clínicos', async () => {
    const e = buildEngine();
    seedClinical(e, 1);
    const { v, report } = await run(
      e,
      [dxRow(0, { noteText: 'texto-clinico-confidencial-77' })],
      'key-1',
    );
    const everything =
      JSON.stringify([report, await e.service.get(e.admin, TENANT_A, v.id)]) +
      e.service.reportCsv(report).content.toString() +
      e.logger.lines.join('\n') +
      JSON.stringify(e.audit.events);
    expect(everything).not.toMatch(
      /SINT-1000|1990-05-17|SINT-DX-0|texto-clinico-confidencial-77/,
    );
  });

  it('auditoría: escritura por fila y lectura del lote y del informe (sólo historia clínica)', async () => {
    const e = buildEngine();
    seedClinical(e, 1);
    const { v } = await run(e, [dxRow(0)], 'key-1');
    await e.service.get(e.admin, TENANT_A, v.id);
    const actions = e.audit.events.map((x) => x.action);
    expect(actions).toContain('ROW_WRITTEN');
    expect(actions).toEqual(
      expect.arrayContaining(['REPORT_READ', 'BATCH_READ']),
    );
    expect(
      e.audit.events.every(
        (x) =>
          x.actorId === e.admin.id &&
          x.batchId === v.id &&
          x.group === 'CLINICAL',
      ),
    ).toBe(true);

    const users = buildEngine();
    const uv = await users.service.create(users.admin, TENANT_A, {
      kind: STAFF.kind,
      declaration: USERS_DECLARATION,
      source: { rows: staffRows(1) },
    });
    await users.service.get(users.admin, TENANT_A, uv.id);
    expect(users.audit.events).toEqual([]);
  });

  it('cada tipo de historia clínica resuelve todos sus pares sistema+código', async () => {
    const e = buildEngine();
    const kinds = [
      'hc-encuentro',
      'hc-diagnostico',
      'hc-medicacion',
      'hc-alergia',
      'hc-signo-vital',
      'hc-resultado',
      'hc-nota',
    ];
    e.patients.add('SINT-0001', '1990-05-17');
    for (const kind of kinds) {
      const schema = findKindSchema(kind) as KindSchema;
      for (const pair of codedPairs(schema)) {
        const row = exampleRow(schema);
        e.codes.add(row[pair.system], row[pair.code]);
      }
    }
    for (const kind of kinds) {
      const schema = findKindSchema(kind) as KindSchema;
      const view = await e.service.create(e.admin, TENANT_A, {
        kind,
        declaration: CLINICAL_DECLARATION,
        source: { rows: [exampleRow(schema)] },
      });
      expect({ kind, status: view.status, issues: view.issues.items }).toEqual({
        kind,
        status: BulkImportStatus.VALIDATED,
        issues: [],
      });
    }
  });
});

describe('plantillas y catálogo', () => {
  it('el catálogo lista los diez tipos con sus topes y declara el estado del motor', () => {
    const e = buildEngine();
    const catalog = e.service.catalog();
    expect(catalog.templates).toHaveLength(10);
    expect(catalog.limits).toEqual(BULK_IMPORT_LIMITS);
    expect(catalog.engine.persistence.durable).toBe(false);
    expect(
      catalog.templates.every((t) => t.formats.join() === 'csv,json'),
    ).toBe(true);
  });

  it('plantilla: tipo inexistente → 404; formato inválido → 400', () => {
    const e = buildEngine();
    expect(() => e.service.template('nope', 'csv')).toThrow(
      expect.objectContaining({ reason: BulkImportReason.KIND_UNKNOWN }),
    );
    expect(() => e.service.template(PATIENT.kind, 'xlsx')).toThrow(
      expect.objectContaining({ reason: BulkImportReason.FORMAT_UNSUPPORTED }),
    );
    expect(e.service.template(PATIENT.kind, 'json').fileName).toBe(
      'plantilla-usuario-paciente-v1.json',
    );
  });
});
