import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FIX,
  TEST_ADMIN_ID,
  bootstrapTestApp,
  type TestContext,
} from '../harness';
import { SEED } from '../../../src/common';
import { CLIN } from '../../../src/modules/clinical/clinical.concepts';
import { DiagnosticReports } from '../../../src/modules/clinical/entities';
import { DuplicateStudyDetector } from '../../../src/modules/clinical/services/duplicate-study-detector';

/**
 * MCH-029 · la detección de estudios duplicados lee lo que cae en la ventana,
 * no el historial entero del paciente.
 *
 * Se siembra un historial grande del mismo estudio, todo fuera de la ventana,
 * y se cuentan las entidades que el detector dejó en el identity map de un
 * `EntityManager` recién creado: es la medida de «filas cargadas» que no
 * depende de cronometrar nada. Antes el detector traía cada informe del
 * paciente y filtraba en memoria.
 *
 * Cada caso usa un código de estudio propio, así no se pisan entre sí ni con
 * corridas anteriores. Nada se borra al terminar.
 */
describe('MCH-029 · detector de estudios duplicados acotado a la ventana (integración)', () => {
  let ctx: TestContext;
  let detector: DuplicateStudyDetector;
  const paciente = FIX.patPerson;
  const NOW = new Date();
  const DIA = 24 * 60 * 60 * 1000;
  const VENTANA_DIAS = 30;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  /** Un código de estudio propio del caso: un concepto real (FK) de un lote nuevo. */
  async function estudioNuevo(): Promise<string> {
    const id = randomUUID();
    const [plantilla] = await sql<{ code_system_version_id: string }>(
      'select code_system_version_id from terminology.catalog_concepts where id = ?',
      [CLIN.SERVICE_REQUEST_CATEGORY_LAB],
    );
    await sql(
      `insert into terminology.catalog_concepts
         (id, code_system_version_id, code, display, created_at, updated_at)
       values (?, ?, ?, ?, now(), now())`,
      [
        id,
        plantilla.code_system_version_id,
        `MCH029-${id.slice(0, 8)}`,
        'Estudio de prueba MCH-029',
      ],
    );
    return id;
  }

  async function informe(opciones: {
    code: string;
    creadoHaceDias: number;
    actualizadoHaceDias?: number;
    estado?: string;
    serviceRequestId?: string;
  }): Promise<string> {
    const id = randomUUID();
    const creado = new Date(NOW.getTime() - opciones.creadoHaceDias * DIA);
    const actualizado = new Date(
      NOW.getTime() -
        (opciones.actualizadoHaceDias ?? opciones.creadoHaceDias) * DIA,
    );
    await sql(
      `insert into clinical.diagnostic_reports
         (id, custodian_tenant_id, patient_profile_id, code_concept_id,
          lifecycle_status_concept_id, service_request_id, created_at, updated_at, created_by_user_id)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        SEED.tenantId,
        paciente,
        opciones.code,
        opciones.estado ?? CLIN.REPORT_FINAL,
        opciones.serviceRequestId ?? null,
        creado,
        actualizado,
        TEST_ADMIN_ID,
      ],
    );
    return id;
  }

  /** Detector sobre un EntityManager nuevo, para contar lo que cargó. */
  async function buscar(code: string) {
    const em = ctx.orm.em.fork() as EntityManager;
    const match = await detector.findDuplicate(
      em,
      paciente,
      code,
      VENTANA_DIAS,
      NOW,
    );
    // Por nombre y no con `instanceof`: MikroORM descubre las entidades desde
    // `dist/`, así que las filas hidratadas no son instancias de la clase de
    // `src/` que importa este archivo.
    const cargados = em
      .getUnitOfWork()
      .getIdentityMap()
      .values()
      .filter(
        (entidad) => entidad.constructor.name === DiagnosticReports.name,
      ).length;
    return { match, cargados };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    detector = ctx.app.get(DuplicateStudyDetector, { strict: false });
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · con 300 informes viejos y uno reciente, carga sólo el reciente', async () => {
    const code = await estudioNuevo();
    await sql(
      `insert into clinical.diagnostic_reports
         (id, custodian_tenant_id, patient_profile_id, code_concept_id,
          lifecycle_status_concept_id, created_at, updated_at, created_by_user_id)
       select gen_random_uuid(), ?, ?, ?, ?,
              now() - (interval '1 day' * (60 + g)), now() - (interval '1 day' * (60 + g)), ?
         from generate_series(1, 300) g`,
      [SEED.tenantId, paciente, code, CLIN.REPORT_FINAL, TEST_ADMIN_ID],
    );
    const reciente = await informe({ code, creadoHaceDias: 5 });

    const { match, cargados } = await buscar(code);

    expect(match?.report.id).toBe(reciente);
    expect(cargados).toBeLessThanOrEqual(1);
  });

  it('AC01 · con 300 informes viejos y ninguno en la ventana, no carga ninguno', async () => {
    const code = await estudioNuevo();
    await sql(
      `insert into clinical.diagnostic_reports
         (id, custodian_tenant_id, patient_profile_id, code_concept_id,
          lifecycle_status_concept_id, created_at, updated_at, created_by_user_id)
       select gen_random_uuid(), ?, ?, ?, ?,
              now() - (interval '1 day' * (60 + g)), now() - (interval '1 day' * (60 + g)), ?
         from generate_series(1, 300) g`,
      [SEED.tenantId, paciente, code, CLIN.REPORT_FINAL, TEST_ADMIN_ID],
    );

    const { match, cargados } = await buscar(code);

    expect(match).toBeNull();
    expect(cargados).toBe(0);
  });

  it('AC02 · corregir los metadatos de un estudio viejo no lo vuelve reciente', async () => {
    const code = await estudioNuevo();
    // Hecho hace 200 días, corregido hoy: `updated_at` es de hoy.
    await informe({ code, creadoHaceDias: 200, actualizadoHaceDias: 0 });

    const { match } = await buscar(code);

    expect(match).toBeNull();
  });

  it('AC03 · un informe cuya orden se revocó no cuenta, aunque sea reciente', async () => {
    const code = await estudioNuevo();
    const orden = randomUUID();
    await sql(
      `insert into clinical.service_requests
         (id, custodian_tenant_id, patient_profile_id, code_concept_id,
          status_concept_id, created_at, updated_at, created_by_user_id)
       values (?, ?, ?, ?, ?, now(), now(), ?)`,
      [
        orden,
        SEED.tenantId,
        paciente,
        code,
        CLIN.SERVICE_REQUEST_REVOKED,
        TEST_ADMIN_ID,
      ],
    );
    await informe({ code, creadoHaceDias: 3, serviceRequestId: orden });

    const { match } = await buscar(code);

    expect(match).toBeNull();
  });

  it('AC03 · un informe parcial sin liberar no es duplicado, pero sí resultado pendiente', async () => {
    const code = await estudioNuevo();
    await informe({ code, creadoHaceDias: 2, estado: CLIN.REPORT_PARTIAL });

    const { match } = await buscar(code);
    const pendiente = await detector.findPendingReport(
      ctx.orm.em.fork() as EntityManager,
      paciente,
      code,
      VENTANA_DIAS,
      NOW,
    );

    expect(match).toBeNull();
    expect(pendiente).toBe(true);
  });

  it('AC03 · un informe liberado por versión cuenta con la fecha de emisión de la versión', async () => {
    const code = await estudioNuevo();
    // El informe nació hace 90 días como parcial; la versión liberada se
    // emitió hace 10: el estudio es de la ventana.
    const id = await informe({
      code,
      creadoHaceDias: 90,
      estado: CLIN.REPORT_PARTIAL,
    });
    const version = randomUUID();
    const emitida = new Date(NOW.getTime() - 10 * DIA);
    await sql(
      `insert into diagnostics.diagnostic_report_versions
         (id, diagnostic_report_id, version_number, clinical_status_concept_id,
          issued_at, recorded_at, custodian_tenant_id)
       values (?, ?, 1, ?, ?, ?, ?)`,
      [version, id, CLIN.REPORT_FINAL, emitida, emitida, SEED.tenantId],
    );
    await sql(
      'update clinical.diagnostic_reports set current_released_version_id = ? where id = ?',
      [version, id],
    );

    const { match } = await buscar(code);

    expect(match?.report.id).toBe(id);
    expect(match?.resultsAvailable).toBe(true);
    expect(match?.performedAt.getTime()).toBe(emitida.getTime());
  });
});
