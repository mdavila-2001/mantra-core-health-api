import { jest } from '@jest/globals';
import { MyDataAccessService } from './my-data-access.service';
import { AUD } from '../audit.concepts';
import { AuditErrorReason } from '../audit.error-reasons';
import type {
  PatientAccessFilter,
  PatientAccessRow,
} from '../repositories/patient-access-log.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const DOCTOR_USER = '33333333-3333-4333-8333-333333333333';
const CLERK_USER = '44444444-4444-4444-8444-444444444444';
const PERSON_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PERSON_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const actor = (id: string) => ({ id, roles: ['PATIENT'] }) as any;

const row = (
  id: string,
  patient: string,
  over: Partial<PatientAccessRow> = {},
): PatientAccessRow & { patient: string } => ({
  id,
  patient,
  user_id: DOCTOR_USER,
  action_concept_id: AUD.ACTION_READ,
  resource_type: 'DIAGNOSTIC_RESULTS',
  purpose: 'TREATMENT',
  recorded_at: '2026-10-20T10:00:00.000000Z',
  accessor_name: 'Dra. Ana Pérez',
  accessor_is_practitioner: true,
  ...over,
});

/** Dos pacientes con su propia historia de accesos. */
const LOG = [
  row('a1', PERSON_A, { recorded_at: '2026-10-21T10:00:00.000000Z' }),
  row('a2', PERSON_A, {
    user_id: CLERK_USER,
    accessor_name: null,
    accessor_is_practitioner: false,
    purpose: 'OPERATIONS',
    recorded_at: '2026-10-20T10:00:00.000000Z',
  }),
  row('a3', PERSON_A, {
    user_id: USER_A,
    accessor_name: 'Paciente A',
    accessor_is_practitioner: false,
    purpose: 'PATIENT_ACCESS',
    recorded_at: '2026-10-19T10:00:00.000000Z',
  }),
  row('b1', PERSON_B, { recorded_at: '2026-10-21T11:00:00.000000Z' }),
  row('b2', PERSON_B, { recorded_at: '2026-10-18T11:00:00.000000Z' }),
];

function build() {
  const em: any = { fork: mockFn(() => em) };
  const accountLinksRepo = {
    findActiveByUser: mockFn(async (_em: any, userId: string) => {
      if (userId === USER_A) return { personId: PERSON_A };
      if (userId === USER_B) return { personId: PERSON_B };
      return null;
    }),
  };
  const patientProfilesRepo = {
    findById: mockFn(async (_em: any, id: string) =>
      id === PERSON_A || id === PERSON_B ? { profileId: id } : null,
    ),
  };
  const accessLog = {
    // Un doble fiel de la consulta: acota por paciente, ordena y corta como el SQL.
    accessesTo: mockFn(async (_em: any, f: PatientAccessFilter) =>
      LOG.filter((r) => r.patient === f.patientProfileId)
        .filter((r) => !f.excludeUserId || r.user_id !== f.excludeUserId)
        .filter((r) => !f.from || r.recorded_at >= f.from.toISOString())
        .filter((r) => !f.to || r.recorded_at < f.to.toISOString())
        .filter((r) => !f.cursor || r.recorded_at < f.cursor.t)
        .sort((x, y) => (x.recorded_at < y.recorded_at ? 1 : -1))
        .slice(0, f.limit + 1),
    ),
  };
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const service = new MyDataAccessService(
    em,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    accessLog as any,
    logger as any,
  );
  return { service, accessLog, accountLinksRepo, logger };
}

describe('MyDataAccessService (PAC-HIST-004/005)', () => {
  it('cada titular ve sólo los accesos a su propia historia', async () => {
    const d = build();

    const a = await d.service.list(actor(USER_A), {});
    const b = await d.service.list(actor(USER_B), {});

    expect(a.items.map((i) => i.id)).toEqual(['a1', 'a2', 'a3']);
    expect(b.items.map((i) => i.id)).toEqual(['b1', 'b2']);
    expect(
      d.accessLog.accessesTo.mock.calls.map(
        (c: any[]) => c[1].patientProfileId,
      ),
    ).toEqual([PERSON_A, PERSON_B]);
  });

  it('el paciente se resuelve desde la cuenta de la sesión y no desde el cliente', async () => {
    const d = build();

    // Un cliente que intenta colar el paciente ajeno en los filtros no lo consigue.
    await d.service.list(actor(USER_A), {
      patientProfileId: PERSON_B,
      userId: USER_B,
    } as any);

    const filter = d.accessLog.accessesTo.mock
      .calls[0][1] as PatientAccessFilter;
    expect(filter.patientProfileId).toBe(PERSON_A);
    expect(JSON.stringify(filter)).not.toContain(PERSON_B);
  });

  it('devuelve quién, cuándo, tipo de dato y finalidad, y nada más', async () => {
    const d = build();

    const page = await d.service.list(actor(USER_A), {});

    expect(page.items[0]).toEqual({
      id: 'a1',
      accessedAt: '2026-10-21T10:00:00.000000Z',
      accessor: { kind: 'PRACTITIONER', displayName: 'Dra. Ana Pérez' },
      operation: 'READ',
      resourceType: 'DIAGNOSTIC_RESULTS',
      purpose: 'TREATMENT',
    });
    expect(page.items[1].accessor).toEqual({
      kind: 'OTHER',
      displayName: null,
    });
    expect(page.items[1].purpose).toBe('OPERATIONS');
    // No filtra la cuenta de quien accedió ni datos que la especificación no pide.
    for (const item of page.items) {
      expect(Object.keys(item).sort()).toEqual([
        'accessedAt',
        'accessor',
        'id',
        'operation',
        'purpose',
        'resourceType',
      ]);
      expect(JSON.stringify(item)).not.toContain(DOCTOR_USER);
      expect(JSON.stringify(item)).not.toContain(CLERK_USER);
    }
  });

  it('marca como SELF los accesos del propio titular, sin su nombre', async () => {
    const d = build();

    const page = await d.service.list(actor(USER_A), {});

    expect(page.items[2].accessor).toEqual({ kind: 'SELF', displayName: null });
    expect(page.items[2].purpose).toBe('PATIENT_ACCESS');
  });

  it('excludeOwn deja fuera los accesos del propio titular', async () => {
    const d = build();

    const page = await d.service.list(actor(USER_A), { excludeOwn: true });

    expect(page.items.map((i) => i.id)).toEqual(['a1', 'a2']);
    expect(
      (d.accessLog.accessesTo.mock.calls[0][1] as PatientAccessFilter)
        .excludeUserId,
    ).toBe(USER_A);
  });

  it('pagina por cursor: pide uno de más y entrega nextCursor sólo si hay otra página', async () => {
    const d = build();

    const first = await d.service.list(actor(USER_A), { limit: 2 });
    expect(first.items.map((i) => i.id)).toEqual(['a1', 'a2']);
    expect(first.nextCursor).toEqual(expect.any(String));
    expect(first.limit).toBe(2);

    const second = await d.service.list(actor(USER_A), {
      limit: 2,
      cursor: first.nextCursor as string,
    });
    expect(second.items.map((i) => i.id)).toEqual(['a3']);
    expect(second.nextCursor).toBeNull();
  });

  it('una cuenta sin persona vinculada recibe un 404 con el motivo del módulo', async () => {
    const d = build();

    await expect(
      d.service.list(actor('sin-persona'), {}),
    ).rejects.toMatchObject({
      status: 404,
      reason: AuditErrorReason.PATIENT_PROFILE_NOT_FOUND,
    });
    expect(d.accessLog.accessesTo).not.toHaveBeenCalled();
  });

  it('una persona sin perfil de paciente recibe el mismo 404', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'persona-no-paciente',
    });

    await expect(d.service.list(actor(USER_A), {})).rejects.toMatchObject({
      status: 404,
      reason: AuditErrorReason.PATIENT_PROFILE_NOT_FOUND,
    });
    expect(d.accessLog.accessesTo).not.toHaveBeenCalled();
  });

  it('rechaza un rango invertido y un cursor inválido con 400, antes de consultar', async () => {
    const d = build();

    await expect(
      d.service.list(actor(USER_A), {
        from: '2026-10-21T00:00:00.000Z',
        to: '2026-10-20T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      d.service.list(actor(USER_A), { cursor: 'no-es-un-cursor' }),
    ).rejects.toMatchObject({ status: 400 });
    expect(d.accessLog.accessesTo).not.toHaveBeenCalled();
  });

  it('no registra contenido: el log del rechazo lleva sólo el identificador de la cuenta', async () => {
    const d = build();

    await expect(
      d.service.list(actor('sin-persona'), {}),
    ).rejects.toBeDefined();

    expect(d.logger.warn).toHaveBeenCalledWith(
      { operation: 'audit.me.data-access.denied', userId: 'sin-persona' },
      expect.any(String),
    );
  });
});
