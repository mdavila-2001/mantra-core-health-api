import { InMemoryBatchRepository } from './clinical-import.adapters';
import { runBatch, type RunnerDeps } from './clinical-import.runner';
import { ClinicalImportService } from './clinical-import.service';
import {
  FakeAudit,
  FakeCodes,
  FakePatients,
  FakePractitioners,
  FakeWriter,
  ManualScheduler,
  TestTimeoutError,
  testGuard,
} from './clinical-import.testing';
import { TransientPortError } from './clinical-import.types';

/* Trabajo asíncrono: plazo, reintento, fallo parcial. Dobles declarados; datos SINTÉTICOS. */

const NOW = new Date('2026-10-30T12:00:00Z');
const TENANT = '11111111-1111-4111-8111-111111111111';
const ACTOR = { userId: 'user-admin-1' };
const DECLARATION = {
  sourceOrganization: 'Organización sintética',
  legalBasis: 'Convenio de ejemplo',
  loadedAt: '2026-10-30',
};
const HEADER =
  'documentNumber,birthDate,sourceRecordId,substanceSystem,substanceCode';

function montar(filas = 4, guardAttempts = 3) {
  const repo = new InMemoryBatchRepository();
  const patients = new FakePatients();
  for (let i = 1; i <= filas; i += 1)
    patients.add(`SINT-${i}000`, '1990-01-15', {
      status: 'FOUND',
      patientProfileId: `patient-${i}`,
      consentRevoked: false,
    });
  const writer = new FakeWriter();
  const audit = new FakeAudit();
  const scheduler = new ManualScheduler();
  const guard = testGuard(guardAttempts);
  const ports = {
    patients,
    codes: new FakeCodes(),
    practitioners: new FakePractitioners(),
  };
  const service = new ClinicalImportService({
    repo,
    ports,
    writer,
    audit,
    scheduler,
    guard,
    now: () => NOW,
    newId: () => 'lote-1',
  });
  const archivo = [
    HEADER,
    ...Array.from(
      { length: filas },
      (_, i) => `SINT-${i + 1}000,1990-01-15,O-${i + 1},sistema-demo,SINT-0001`,
    ),
  ].join('\n');
  const preparar = async () => {
    const lote = await service.create(ACTOR, TENANT, {
      kind: 'hc-alergia',
      fileName: 'c.csv',
      bytes: Buffer.from(archivo),
      declaration: DECLARATION,
    });
    await service.confirm(ACTOR, TENANT, lote.id, 'clave-1');
    return { lote, job: scheduler.queue.shift()! };
  };
  const deps = (over: Partial<RunnerDeps> = {}): RunnerDeps => ({
    repo,
    ports,
    writer,
    audit,
    guard,
    now: () => NOW.getTime(),
    log: () => undefined,
    batchTimeoutMs: 60_000,
    ...over,
  });
  return { repo, patients, writer, audit, service, preparar, deps };
}

const informe = async (t: ReturnType<typeof montar>) =>
  t.service.report(TENANT, 'lote-1');

describe('ejecutor: una fila mala no aborta el resto', () => {
  it('camino feliz: todas CREADA, lote COMPLETADO, progreso completo', async () => {
    const t = montar();
    const { job } = await t.preparar();
    await runBatch(t.deps(), job);
    const lote = await t.service.get(TENANT, 'lote-1');
    expect(lote.status).toBe('COMPLETADO');
    expect(lote.progress).toEqual({ processed: 4, total: 4 });
    expect((await informe(t)).totals).toMatchObject({ CREADA: 4, FALLIDA: 0 });
  });

  it('un error permanente de una fila la deja FALLIDA y las demás se procesan', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.writer.failures.set('O-2', [new Error('violación de restricción')]);
    await runBatch(t.deps(), job);
    const r = await informe(t);
    expect(r.totals).toMatchObject({ CREADA: 3, FALLIDA: 1 });
    expect(r.rows.find((x) => x.outcome === 'FALLIDA')).toMatchObject({
      row: 2,
      reason: 'WRITE_FAILED',
    });
    expect(JSON.stringify(r)).not.toContain('violación');
    expect((await t.service.get(TENANT, 'lote-1')).status).toBe('COMPLETADO');
  });

  it('el paciente cambió entre la vista previa y la confirmación: la fila se rechaza al escribir', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.patients.table.delete('SINT-3000|1990-01-15');
    await runBatch(t.deps(), job);
    const r = await informe(t);
    expect(r.rows.find((x) => x.row === 3)).toMatchObject({
      outcome: 'RECHAZADA',
      reason: 'PATIENT_NOT_FOUND',
    });
    expect(r.totals).toMatchObject({ CREADA: 3, RECHAZADA: 1 });
  });
});

describe('ejecutor: reintento y plazo por fila', () => {
  it('un fallo transitorio se reintenta y la fila termina CREADA (sin duplicar)', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.writer.failures.set('O-1', [
      new TransientPortError(),
      new TransientPortError(),
    ]);
    await runBatch(t.deps(), job);
    expect((await informe(t)).totals).toMatchObject({ CREADA: 4 });
    expect(t.writer.rows.size).toBe(4);
    expect(t.writer.attempts).toBe(6);
  });

  it('transitorio que no se cura: agota los intentos y queda FALLIDA', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.writer.failures.set('O-1', [
      new TransientPortError(),
      new TransientPortError(),
      new TransientPortError(),
    ]);
    await runBatch(t.deps(), job);
    const r = await informe(t);
    expect(r.rows.find((x) => x.row === 1)).toMatchObject({
      outcome: 'FALLIDA',
      reason: 'WRITE_FAILED',
    });
    expect(r.totals).toMatchObject({ CREADA: 3, FALLIDA: 1 });
  });

  it('un plazo vencido en TODOS los intentos queda FALLIDA con ROW_TIMEOUT', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.writer.failures.set('O-2', [
      new TestTimeoutError(),
      new TestTimeoutError(),
      new TestTimeoutError(),
    ]);
    await runBatch(t.deps(), job);
    expect((await informe(t)).rows.find((x) => x.row === 2)).toMatchObject({
      outcome: 'FALLIDA',
      reason: 'ROW_TIMEOUT',
    });
  });

  it('el plazo vence DESPUÉS de escribir: el reintento reconoce lo suyo y lo informa y audita como CREADA', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.writer.failAfterWrite.add('O-1');
    await runBatch(t.deps(), job);
    const r = await informe(t);
    expect(r.rows.find((x) => x.row === 1)?.outcome).toBe('CREADA');
    expect(t.writer.rows.size).toBe(4);
    expect(
      t.audit.events.filter(
        (e) => e.action === 'CLINICAL_IMPORT_RECORD_ADDED' && e.row === 1,
      ),
    ).toHaveLength(1);
  });
});

describe('ejecutor: plazo del lote', () => {
  it('al agotarse, lo que falta queda NO_PROCESADA y el lote FALLIDO con BATCH_TIMEOUT', async () => {
    const t = montar();
    const { job } = await t.preparar();
    let reloj = NOW.getTime();
    // Cada lectura del reloj avanza 30 s: con un tope de 60 s alcanza para unas filas, no para todas.
    await runBatch(
      t.deps({ now: () => (reloj += 30_000), batchTimeoutMs: 60_000 }),
      job,
    );
    const lote = await t.service.get(TENANT, 'lote-1');
    expect(lote.status).toBe('FALLIDO');
    expect(lote.failureReason).toBe('BATCH_TIMEOUT');
    const r = await informe(t);
    expect(r.totals['NO_PROCESADA']).toBeGreaterThan(0);
    expect(r.totals['CREADA']! + r.totals['NO_PROCESADA']!).toBe(4);
    expect(
      r.rows
        .filter((x) => x.outcome === 'NO_PROCESADA')
        .every((x) => x.reason === 'BATCH_TIMEOUT'),
    ).toBe(true);
    expect(t.writer.rows.size).toBe(r.totals['CREADA']);
  });
});

describe('ejecutor: auditoría de escritura', () => {
  it('cada alta deja actor, lote, fila y destino; y NADA de contenido', async () => {
    const t = montar();
    const { job } = await t.preparar();
    await runBatch(t.deps(), job);
    const altas = t.audit.events.filter(
      (e) => e.action === 'CLINICAL_IMPORT_RECORD_ADDED',
    );
    expect(altas).toHaveLength(4);
    for (const e of altas) {
      expect(e).toMatchObject({
        tenantId: TENANT,
        actorUserId: ACTOR.userId,
        batchId: 'lote-1',
        kind: 'hc-alergia',
      });
      expect(e.targetId).toBeTruthy();
      expect(Object.keys(e).sort()).toEqual([
        'action',
        'actorUserId',
        'batchId',
        'kind',
        'row',
        'targetId',
        'tenantId',
      ]);
    }
    expect(t.audit.events.at(-1)?.action).toBe(
      'CLINICAL_IMPORT_BATCH_FINISHED',
    );
    expect(JSON.stringify(t.audit.events)).not.toMatch(
      /SINT-|1990-01-15|sistema-demo/,
    );
  });

  it('sin rastro no se sigue escribiendo: el lote queda FALLIDO y lo que falta, NO_PROCESADA', async () => {
    const t = montar();
    const { job } = await t.preparar();
    t.audit.failing = true;
    await runBatch(t.deps(), job);
    const lote = await t.service.get(TENANT, 'lote-1');
    expect(lote.status).toBe('FALLIDO');
    expect(lote.failureReason).toBe('AUDIT_UNAVAILABLE');
    expect(t.writer.rows.size).toBe(1);
    expect((await informe(t)).totals).toMatchObject({
      CREADA: 1,
      NO_PROCESADA: 3,
    });
  });
});

describe('ejecutor: tomar el lote es compare-and-set', () => {
  it('dos ejecutores del mismo lote: el segundo no hace nada', async () => {
    const t = montar();
    const { job } = await t.preparar();
    await Promise.all([runBatch(t.deps(), job), runBatch(t.deps(), job)]);
    expect(t.writer.rows.size).toBe(4);
    expect(
      t.audit.events.filter(
        (e) => e.action === 'CLINICAL_IMPORT_BATCH_FINISHED',
      ),
    ).toHaveLength(1);
  });

  it('un lote que no está EN_COLA no se toca', async () => {
    const t = montar();
    const { lote } = await t.preparar();
    await runBatch(t.deps(), {
      tenantId: TENANT,
      batchId: lote.id,
      actorUserId: ACTOR.userId,
    });
    const intento = await runBatch(t.deps(), {
      tenantId: TENANT,
      batchId: lote.id,
      actorUserId: ACTOR.userId,
    });
    expect(intento).toBeUndefined();
    expect(t.writer.rows.size).toBe(4);
  });

  it('un lote de otro tenant no se procesa', async () => {
    const t = montar();
    const { lote } = await t.preparar();
    await runBatch(t.deps(), {
      tenantId: '99999999-9999-4999-8999-999999999999',
      batchId: lote.id,
      actorUserId: 'x',
    });
    expect(t.writer.rows.size).toBe(0);
    expect((await t.service.get(TENANT, lote.id)).status).toBe('EN_COLA');
  });
});
