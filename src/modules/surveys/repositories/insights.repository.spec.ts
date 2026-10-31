import { jest } from '@jest/globals';
import { InsightsRepository } from './insights.repository';
import { SURVEYS } from '../surveys.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const scope = {
  tenantId: 'ten-1',
  practitionerProfileId: 'hp-1',
};

/** `em` falso que registra el SQL y los parámetros de cada consulta. */
function build(rows: unknown[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  const em = { getConnection: () => ({ execute }) } as any;
  return { em, execute, repo: new InsightsRepository() };
}

/** Cuántos `?` tiene el SQL. */
const placeholders = (sql: string): number => (sql.match(/\?/g) ?? []).length;

/** La lista de columnas del SELECT que sigue al `WITH scope AS (...)`. */
const outerSelectList = (sql: string): string => {
  const outer = sql.slice(sql.search(/\)\s+SELECT\s/));
  return outer.slice(outer.indexOf('SELECT'), outer.search(/\sFROM\s/));
};

describe('InsightsRepository', () => {
  const calls: Array<
    [string, (b: ReturnType<typeof build>) => Promise<unknown>]
  > = [
    [
      'countInvitationsByBucket',
      ({ repo, em }) => repo.countInvitationsByBucket(em, scope, 'week'),
    ],
    [
      'countAnswersByQuestion',
      ({ repo, em }) => repo.countAnswersByQuestion(em, scope, 'week'),
    ],
    [
      'countAnswerValues',
      ({ repo, em }) => repo.countAnswerValues(em, scope, 'week'),
    ],
    [
      'listRecentComments',
      ({ repo, em }) => repo.listRecentComments(em, scope),
    ],
  ];

  it.each(calls)(
    '%s: acota al tenant y al profesional, con tantos parámetros como `?`',
    async (_name, call) => {
      const b = build();
      await call(b);
      const [sql, params] = b.execute.mock.calls[0] as [string, unknown[]];

      expect(placeholders(sql)).toBe(params.length);
      // El tenant se exige sobre la invitación y sobre la plantilla.
      expect(params.filter((p) => p === 'ten-1').length).toBeGreaterThanOrEqual(
        2,
      );
      expect(sql).toContain('i.tenant_id = ?');
      expect(sql).toContain('t.tenant_id = ?');
      // El profesional: por plantilla propia, por la agenda de la atención o por
      // ser el dueño de la extensión que viaja detrás de la base.
      expect(params.filter((p) => p === 'hp-1')).toHaveLength(3);
      expect(sql).toContain('t.owner_practitioner_id = ?');
      expect(sql).toContain('et.owner_practitioner_id = ?');
      // «Plantilla de sistema» es el dueño tipado de la base con owner_id = tenant,
      // no cualquier plantilla sin dueño profesional.
      expect(sql).not.toContain('owner_practitioner_id IS NULL');
      expect(sql).toContain('t.owner_type_concept_id IN (?, ?)');
      expect(sql).toContain('t.owner_id = i.tenant_id');
      expect(params).toEqual(
        expect.arrayContaining([
          SURVEYS.SYSTEM_BASE_CONSULTATION,
          SURVEYS.SYSTEM_BASE_SERVICE,
        ]),
      );
      expect(sql).toContain('r.resource_ref_id = ?');
      // La reserva y el recurso también se acotan al tenant.
      expect(sql).toContain('b.tenant_id = i.tenant_id');
      expect(sql).toContain('r.tenant_id = i.tenant_id');
      expect(params).toContain(SURVEYS.INVITATION_ANSWERED);
    },
  );

  it.each(calls)(
    '%s: ninguna columna identificatoria sale en el SELECT',
    async (_name, call) => {
      const b = build();
      await call(b);
      const [sql] = b.execute.mock.calls[0] as [string];
      const out = outerSelectList(sql);

      expect(sql).not.toContain('patient_profile_id');
      expect(out).not.toContain('appointment_booking_id');
      expect(out).not.toMatch(/survey_response_id|subject_id|invitation_id/);
      expect(out).not.toMatch(/submitted_at(?! AT TIME ZONE)/);
    },
  );

  it('los comentarios salen sólo con el texto, sin ninguna fecha, con tope de 20 y sin orden cronológico', async () => {
    const b = build([{ text: 'hola' }]);
    const result = await b.repo.listRecentComments(b.em, scope);
    const [sql, params] = b.execute.mock.calls[0] as [string, unknown[]];

    // La fecha del envío no se selecciona: ni día, ni mes, ni hora.
    expect(outerSelectList(sql)).not.toMatch(/submitted_at|to_char/);
    expect(sql).toMatch(/LIMIT \?/);
    expect(params.at(-1)).toBe(20);
    // Orden estable por hash, no cronológico: no se puede correlacionar con una cita.
    expect(sql).toContain('ORDER BY md5(a.id::text)');
    expect(sql).not.toMatch(/ORDER BY[^\n]*submitted_at/);
    expect(params).toContain(SURVEYS.ANSWER_TYPE_TEXT);
    expect(result).toEqual([{ text: 'hola' }]);
  });

  it('el periodo y el servicio se agregan como parámetros, en el orden del SQL', async () => {
    const b = build();
    const from = new Date('2026-10-01');
    const toExclusive = new Date('2026-10-29');
    await b.repo.countInvitationsByBucket(
      b.em,
      { ...scope, from, toExclusive, serviceId: 'svc-1' },
      'day',
    );
    const [sql, params] = b.execute.mock.calls[0] as [string, unknown[]];

    expect(placeholders(sql)).toBe(params.length);
    expect(sql).toContain('i.issued_at >= ?');
    expect(sql).toContain('i.issued_at < ?');
    expect(params.slice(0, 6)).toEqual([
      // El profesional dueño de la extensión (primer `?` del SELECT).
      'hp-1',
      SURVEYS.INVITATION_ANSWERED,
      'ten-1',
      'ten-1',
      from,
      toExclusive,
    ]);
    expect(params.slice(-3)).toEqual([
      'svc-1',
      SURVEYS.TARGET_SERVICE,
      'svc-1',
    ]);
    expect(sql).toContain('po.service_catalog_id = ?');
  });

  it('la unidad del tramo sólo puede ser day, week o month', async () => {
    for (const unit of ['day', 'week', 'month'] as const) {
      const b = build();
      await b.repo.countInvitationsByBucket(b.em, scope, unit);
      expect(b.execute.mock.calls[0][0]).toContain(`date_trunc('${unit}'`);
    }
  });

  it('una opción múltiple aporta una fila por opción: las cuentas llegan como números', async () => {
    const b = build([
      {
        questionId: 'q',
        bucket: '2026-10-01',
        valueNumber: '4',
        valueBoolean: null,
        choice: null,
        count: '3',
      },
    ]);
    const rows = await b.repo.countAnswerValues(b.em, scope, 'day');
    expect(rows[0]).toMatchObject({ valueNumber: 4, count: 3 });
  });
});
