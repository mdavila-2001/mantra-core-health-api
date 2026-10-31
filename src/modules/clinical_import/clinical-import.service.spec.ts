import { InMemoryBatchRepository } from './clinical-import.adapters';
import {
  ClinicalImportService,
  ImportError,
  LIMITS,
  reportToCsv,
} from './clinical-import.service';
import { buildTemplate } from './clinical-import.template';
import {
  FakeAudit,
  FakeCodes,
  FakePatients,
  FakePractitioners,
  FakeWriter,
  ManualScheduler,
  testGuard,
} from './clinical-import.testing';

/* Doble declarado: la integración contra la base real sigue pendiente (ver REPORTE). Datos SINTÉTICOS. */

const NOW = new Date('2026-10-30T12:00:00Z');
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const ACTOR = { userId: 'user-admin-1' };
const DECLARATION = {
  sourceOrganization: 'Organización sintética',
  legalBasis: 'Convenio de traspaso de ejemplo',
  loadedAt: '2026-10-30',
};

function montar() {
  const repo = new InMemoryBatchRepository();
  const patients = new FakePatients()
    .add('SINT-0001', '1990-01-15', {
      status: 'FOUND',
      patientProfileId: 'patient-1',
      consentRevoked: false,
    })
    .add('SINT-0002', '1985-03-02', {
      status: 'FOUND',
      patientProfileId: 'patient-2',
      consentRevoked: false,
    })
    .add('SINT-0003', '1970-07-07', { status: 'AMBIGUOUS' })
    .add('SINT-0004', '1999-09-09', {
      status: 'FOUND',
      patientProfileId: 'patient-4',
      consentRevoked: true,
    });
  const codes = new FakeCodes();
  const writer = new FakeWriter();
  const audit = new FakeAudit();
  const scheduler = new ManualScheduler();
  let counter = 0;
  const service = new ClinicalImportService({
    repo,
    ports: { patients, codes, practitioners: new FakePractitioners() },
    writer,
    audit,
    scheduler,
    guard: testGuard(),
    now: () => NOW,
    newId: () => `batch-${(counter += 1)}`,
  });
  return { service, repo, patients, codes, writer, audit, scheduler };
}

const HEADER =
  'documentNumber,birthDate,sourceRecordId,substanceSystem,substanceCode';
const alergia = (...filas: [string, string, string][]) =>
  [
    HEADER,
    ...filas.map(
      ([doc, nac, id]) => `${doc},${nac},${id},sistema-demo,SINT-0001`,
    ),
  ].join('\n');
const subir = (
  service: ClinicalImportService,
  contenido: string,
  tenant = TENANT_A,
  declaration: object = DECLARATION,
) =>
  service.create(ACTOR, tenant, {
    kind: 'hc-alergia',
    fileName: 'carga.csv',
    bytes: Buffer.from(contenido),
    declaration,
  });

const rechazo = async (promesa: Promise<unknown>) => {
  try {
    await promesa;
  } catch (e) {
    return e as ImportError;
  }
  throw new Error('no falló');
};

describe('vista previa: solo a pacientes existentes, coincidencia única', () => {
  it('válido: una coincidencia única deja el lote VALIDADO y no escribe nada', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(
        ['SINT-0001', '1990-01-15', 'O-1'],
        ['SINT-0002', '1985-03-02', 'O-2'],
      ),
    );
    expect(lote.status).toBe('VALIDADO');
    expect(lote.counts).toEqual({ total: 2, valid: 2, rejected: 0 });
    expect(t.writer.rows.size).toBe(0);
    expect(t.writer.attempts).toBe(0);
  });

  it('0 coincidencias, >1 coincidencias y consentimiento revocado: rechazo con motivo, sin datos', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(
        ['SINT-9999', '1990-01-15', 'O-1'], // no existe
        ['SINT-0001', '2000-01-01', 'O-2'], // existe con OTRA fecha: indistinguible de «no existe»
        ['SINT-0003', '1970-07-07', 'O-3'], // ambiguo
        ['SINT-0004', '1999-09-09', 'O-4'], // consentimiento revocado
        ['SINT-0001', '1990-01-15', 'O-5'], // ok
      ),
    );
    expect(lote.status).toBe('VALIDADO');
    expect(lote.counts).toEqual({ total: 5, valid: 1, rejected: 4 });
    expect(lote.issues.items.map((i) => [i.row, i.field, i.code])).toEqual([
      [1, 'documentNumber', 'PATIENT_NOT_FOUND'],
      [2, 'documentNumber', 'PATIENT_NOT_FOUND'],
      [3, 'documentNumber', 'PATIENT_AMBIGUOUS'],
      [4, 'documentNumber', 'CONSENT_REVOKED'],
    ]);
    const texto = JSON.stringify(lote);
    for (const dato of [
      'SINT-9999',
      'SINT-0003',
      'SINT-0004',
      '1970-07-07',
      '1999-09-09',
      'patient-',
    ]) {
      expect(texto).not.toContain(dato);
    }
  });

  it('un código que no existe en la terminología rechaza la fila (nunca se escribe a mano)', async () => {
    const t = montar();
    t.codes.fallback = { status: 'NOT_FOUND' };
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    expect(lote.status).toBe('RECHAZADO');
    expect(lote.issues.items[0]).toMatchObject({
      row: 1,
      field: 'substanceCode',
      code: 'CODE_NOT_FOUND',
    });
  });

  it('si el padrón no responde, la fila no se da por buena: RESOLUTION_UNAVAILABLE', async () => {
    const t = montar();
    t.patients.failWith = new Error('padrón caído');
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    expect(lote.status).toBe('RECHAZADO');
    expect(lote.issues.items[0]).toMatchObject({
      code: 'RESOLUTION_UNAVAILABLE',
    });
    expect(JSON.stringify(lote)).not.toContain('padrón caído');
  });

  it('con los colaboradores reales sin conectar el lote nace RECHAZADO (nada se adivina)', async () => {
    const t = montar();
    t.patients.failWith = new Error('x');
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    expect(lote.counts.valid).toBe(0);
  });

  it('archivo roto: lote RECHAZADO con el motivo del archivo, sin filas', async () => {
    const t = montar();
    const lote = await subir(t.service, 'a,b\n1,2');
    expect(lote.status).toBe('RECHAZADO');
    expect(lote.fileIssues.map((i) => i.code)).toContain('COLUMN_MISSING');
    expect(lote.issues.items).toEqual([]);
  });

  it('tope de filas y de bytes: 413 con su motivo', async () => {
    const t = montar();
    const filas = Array.from(
      { length: LIMITS.maxRows + 1 },
      (_, i) => `SINT-0001,1990-01-15,O-${i},sistema-demo,SINT-0001`,
    );
    const e1 = await rechazo(subir(t.service, [HEADER, ...filas].join('\n')));
    expect([e1.kind, e1.reason]).toEqual([
      'PAYLOAD_TOO_LARGE',
      'ROW_LIMIT_EXCEEDED',
    ]);
    const e2 = await rechazo(
      t.service.create(ACTOR, TENANT_A, {
        kind: 'hc-alergia',
        fileName: 'x.csv',
        bytes: {
          length: LIMITS.maxBytes + 1,
        } as Buffer /* sin reservar 20 MB: el servicio mide `length` antes de leer */,
        declaration: DECLARATION,
      }),
    );
    expect(e2.reason).toBe('FILE_TOO_LARGE');
  });

  it('en el tope exacto de filas el lote se acepta', async () => {
    const t = montar();
    const filas = Array.from(
      { length: LIMITS.maxRows },
      (_, i) => `SINT-0001,1990-01-15,O-${i},sistema-demo,SINT-0001`,
    );
    const lote = await subir(t.service, [HEADER, ...filas].join('\n'));
    expect(lote.counts.total).toBe(LIMITS.maxRows);
    expect(lote.issues.truncated).toBe(false);
  });

  it('tipo desconocido: 404 KIND_UNKNOWN', async () => {
    const t = montar();
    const e = await rechazo(
      t.service.create(ACTOR, TENANT_A, {
        kind: 'hc-otra-cosa',
        fileName: 'x.csv',
        bytes: Buffer.from('a'),
        declaration: DECLARATION,
      }),
    );
    expect([e.kind, e.reason]).toEqual(['NOT_FOUND', 'KIND_UNKNOWN']);
  });
});

describe('declaración de origen, base legal y fecha: sin ella no hay lote que confirmar', () => {
  it.each([
    [
      'sin origen',
      { ...DECLARATION, sourceOrganization: '' },
      'sourceOrganization',
    ],
    ['sin base legal', { ...DECLARATION, legalBasis: undefined }, 'legalBasis'],
    ['sin fecha', { ...DECLARATION, loadedAt: undefined }, 'loadedAt'],
    ['fecha futura', { ...DECLARATION, loadedAt: '2026-12-31' }, 'loadedAt'],
  ])(
    '%s: 400 DECLARATION_INVALID y no se crea ningún lote',
    async (_caso, declaracion, campo) => {
      const t = montar();
      const e = await rechazo(
        subir(
          t.service,
          alergia(['SINT-0001', '1990-01-15', 'O-1']),
          TENANT_A,
          declaracion,
        ),
      );
      expect([e.kind, e.reason, e.details]).toEqual([
        'BAD_REQUEST',
        'DECLARATION_INVALID',
        { field: campo },
      ]);
      expect(await t.service.list(TENANT_A, 10)).toEqual([]);
    },
  );

  it('un lote con la declaración incompleta (mala escritura) no se confirma', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    const guardado = (await t.repo.find(TENANT_A, lote.id))!;
    await t.repo.create({
      ...guardado,
      view: {
        ...guardado.view,
        declaration: { ...guardado.view.declaration, legalBasis: '' },
      },
    });
    const e = await rechazo(
      t.service.confirm(ACTOR, TENANT_A, lote.id, 'clave-1'),
    );
    expect([e.kind, e.reason]).toEqual(['CONFLICT', 'DECLARATION_INVALID']);
    expect(t.scheduler.queue).toEqual([]);
  });
});

describe('confirmar: idempotente, con estados validados', () => {
  it('encola una sola vez aunque se confirme dos veces con la misma clave', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    const a = await t.service.confirm(ACTOR, TENANT_A, lote.id, 'clave-1');
    const b = await t.service.confirm(ACTOR, TENANT_A, lote.id, 'clave-1');
    expect(a.status).toBe('EN_COLA');
    expect(b.status).toBe('EN_COLA');
    expect(t.scheduler.queue).toHaveLength(1);
  });

  it('otra clave sobre un lote ya confirmado: 409; la misma clave en otro lote: 409', async () => {
    const t = montar();
    const uno = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    const dos = await subir(
      t.service,
      alergia(['SINT-0002', '1985-03-02', 'O-2']),
    );
    await t.service.confirm(ACTOR, TENANT_A, uno.id, 'clave-1');
    expect(
      (await rechazo(t.service.confirm(ACTOR, TENANT_A, uno.id, 'clave-2')))
        .reason,
    ).toBe('BATCH_ALREADY_CONFIRMED');
    expect(
      (await rechazo(t.service.confirm(ACTOR, TENANT_A, dos.id, 'clave-1')))
        .reason,
    ).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('clave ausente, vacía, larga o con caracteres raros: 400', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    for (const clave of [undefined, '', 'a'.repeat(129), 'con espacio']) {
      expect(
        (await rechazo(t.service.confirm(ACTOR, TENANT_A, lote.id, clave)))
          .reason,
      ).toBe('IDEMPOTENCY_KEY_REQUIRED');
    }
    expect(
      (await t.service.confirm(ACTOR, TENANT_A, lote.id, 'a'.repeat(128)))
        .status,
    ).toBe('EN_COLA');
  });

  it('un lote RECHAZADO no se confirma (409), tampoco uno ya terminado', async () => {
    const t = montar();
    const malo = await subir(
      t.service,
      alergia(['SINT-9999', '1990-01-15', 'O-1']),
    );
    expect(malo.status).toBe('RECHAZADO');
    expect(
      (await rechazo(t.service.confirm(ACTOR, TENANT_A, malo.id, 'clave-9')))
        .reason,
    ).toBe('BATCH_NOT_CONFIRMABLE');
  });
});

describe('aislamiento entre organizaciones', () => {
  it('otro tenant ve «no existe» en todo: lote, confirmación, informe y lo cargado', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    for (const operacion of [
      () => t.service.get(TENANT_B, lote.id),
      () => t.service.confirm(ACTOR, TENANT_B, lote.id, 'clave-1'),
      () => t.service.report(TENANT_B, lote.id),
      () => t.service.loaded(TENANT_B, lote.id),
    ]) {
      const e = await rechazo(operacion());
      expect([e.kind, e.reason]).toEqual(['NOT_FOUND', 'BATCH_NOT_AVAILABLE']);
    }
    expect(await t.service.list(TENANT_B, 10)).toEqual([]);
    expect(t.scheduler.queue).toEqual([]);
  });
});

describe('solo agregar, idempotente: la segunda corrida no inserta', () => {
  async function correr(
    t: ReturnType<typeof montar>,
    contenido: string,
    clave: string,
  ) {
    const lote = await subir(t.service, contenido);
    await t.service.confirm(ACTOR, TENANT_A, lote.id, clave);
    const trabajo = t.scheduler.queue.shift()!;
    await t.service.process(trabajo);
    return { lote, informe: await t.service.report(TENANT_A, lote.id) };
  }

  it('el mismo archivo en dos lotes: la primera crea, la segunda omite y no duplica', async () => {
    const t = montar();
    const archivo = alergia(
      ['SINT-0001', '1990-01-15', 'O-1'],
      ['SINT-0002', '1985-03-02', 'O-2'],
    );
    const primera = await correr(t, archivo, 'clave-1');
    expect(primera.informe.totals).toMatchObject({
      total: 2,
      CREADA: 2,
      OMITIDA: 0,
    });
    expect(t.writer.rows.size).toBe(2);

    const segunda = await correr(t, archivo, 'clave-2');
    expect(segunda.informe.totals).toMatchObject({
      total: 2,
      CREADA: 0,
      OMITIDA: 2,
    });
    expect(
      segunda.informe.rows.every((r) => r.reason === 'ALREADY_LOADED'),
    ).toBe(true);
    expect(t.writer.rows.size).toBe(2);
    expect(
      t.audit.events.filter((e) => e.action === 'CLINICAL_IMPORT_RECORD_ADDED'),
    ).toHaveLength(2);
  });

  it('el mismo registro de origen con OTRO contenido: conflicto, no se sobrescribe', async () => {
    const t = montar();
    await correr(t, alergia(['SINT-0001', '1990-01-15', 'O-1']), 'clave-1');
    const [antes] = [...t.writer.rows.values()];
    const cambiado = [
      HEADER,
      'SINT-0001,1990-01-15,O-1,sistema-demo,SINT-0002',
    ].join('\n');
    const segunda = await correr(t, cambiado, 'clave-2');
    expect(segunda.informe.totals).toMatchObject({ CREADA: 0, CONFLICTO: 1 });
    expect(segunda.informe.rows[0]).toMatchObject({
      outcome: 'CONFLICTO',
      reason: 'CONTENT_CONFLICT',
    });
    expect(t.writer.rows.size).toBe(1);
    expect([...t.writer.rows.values()][0]!.record.contentHash).toBe(
      antes!.record.contentHash,
    );
  });

  it('el mismo id de origen para OTRO paciente es otro registro; el mismo id de OTRA organización de origen también', async () => {
    const t = montar();
    await correr(t, alergia(['SINT-0001', '1990-01-15', 'O-1']), 'clave-1');
    const otroPaciente = await correr(
      t,
      alergia(['SINT-0002', '1985-03-02', 'O-1']),
      'clave-2',
    );
    expect(otroPaciente.informe.totals).toMatchObject({ CREADA: 1 });
    const lote = await t.service.create(ACTOR, TENANT_A, {
      kind: 'hc-alergia',
      fileName: 'c.csv',
      bytes: Buffer.from(alergia(['SINT-0001', '1990-01-15', 'O-1'])),
      declaration: {
        ...DECLARATION,
        sourceOrganization: 'Otra organización sintética',
      },
    });
    await t.service.confirm(ACTOR, TENANT_A, lote.id, 'clave-3');
    await t.service.process(t.scheduler.queue.shift()!);
    expect(t.writer.rows.size).toBe(3);
  });

  it('el escritor solo recibe «agregar»: ninguna actualización ni borrado', async () => {
    const t = montar();
    await correr(t, alergia(['SINT-0001', '1990-01-15', 'O-1']), 'clave-1');
    await correr(t, alergia(['SINT-0001', '1990-01-15', 'O-1']), 'clave-2');
    expect(new Set(t.writer.operations)).toEqual(new Set(['appendIfAbsent']));
  });

  it('el archivo original no se conserva al terminar; sí el informe', async () => {
    const t = montar();
    const { lote } = await correr(
      t,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
      'clave-1',
    );
    const guardado = (await t.repo.find(TENANT_A, lote.id))!;
    expect(guardado.pending).toEqual([]);
    expect(guardado.view.status).toBe('COMPLETADO');
  });
});

describe('informe y lo cargado', () => {
  it('el informe no trae datos clínicos ni de pacientes, solo fila, resultado y motivo', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(
        ['SINT-0001', '1990-01-15', 'O-1'],
        ['SINT-9999', '1990-01-15', 'O-2'],
      ),
    );
    await t.service.confirm(ACTOR, TENANT_A, lote.id, 'clave-1');
    await t.service.process(t.scheduler.queue.shift()!);
    const informe = await t.service.report(TENANT_A, lote.id);
    expect(informe.totals).toMatchObject({ total: 2, CREADA: 1, RECHAZADA: 1 });
    const csv = reportToCsv(informe);
    for (const salida of [JSON.stringify(informe), csv]) {
      for (const dato of [
        'SINT-0001',
        'SINT-9999',
        '1990-01-15',
        'O-1',
        'sistema-demo',
      ])
        expect(salida).not.toContain(dato);
    }
    expect(csv.split('\n')[0]).toBe('row,outcome,reason,field,message');
  });

  it('antes de terminar no hay informe ni listado de lo cargado (409)', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    expect((await rechazo(t.service.report(TENANT_A, lote.id))).reason).toBe(
      'REPORT_NOT_READY',
    );
    expect((await rechazo(t.service.loaded(TENANT_A, lote.id))).reason).toBe(
      'REPORT_NOT_READY',
    );
  });

  it('lo cargado lista solo identificadores: entidad, fila y destino', async () => {
    const t = montar();
    const lote = await subir(
      t.service,
      alergia(['SINT-0001', '1990-01-15', 'O-1']),
    );
    await t.service.confirm(ACTOR, TENANT_A, lote.id, 'clave-1');
    await t.service.process(t.scheduler.queue.shift()!);
    const cargado = await t.service.loaded(TENANT_A, lote.id);
    expect(cargado.records).toEqual([
      expect.objectContaining({
        row: 1,
        kind: 'hc-alergia',
        entity: 'fake.entity',
      }),
    ]);
    expect(Object.keys(cargado.records[0]!).sort()).toEqual([
      'entity',
      'kind',
      'row',
      'targetId',
    ]);
  });
});

describe('catálogo y plantillas', () => {
  it('el catálogo declara qué NO está conectado (nada se supone)', () => {
    const t = montar();
    const c = t.service.catalog();
    expect(c.kinds).toHaveLength(7);
    expect(c.engine.persistence.connected).toBe(true);
    expect(c.engine.resolvers.patients.adapter).toContain('doble de prueba');
    expect(c.formats).toEqual(['csv', 'json']);
  });

  it('plantilla: formato inválido 400, tipo desconocido 404, y las dos existen por tipo', () => {
    const t = montar();
    expect(() => t.service.template('hc-nota', 'xlsx')).toThrow(ImportError);
    expect(() => t.service.template('nada', 'csv')).toThrow(ImportError);
    for (const k of t.service.catalog().kinds) {
      expect(t.service.template(k.kind, 'csv').content).toBe(
        buildTemplate(k.kind, 'csv')!.content,
      );
      expect(t.service.template(k.kind, 'json').fileName).toMatch(/\.json$/);
    }
  });
});
