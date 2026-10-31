import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { AuthenticationCredentials } from '../../iam/entities';
import { PROF } from '../../profiles/profiles.concepts';
import { SupportInboxRepository } from './support-inbox.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('SupportInboxRepository: listas vacías', () => {
  const repo = new SupportInboxRepository();
  const em = () => ({ execute: mockFn(), find: mockFn() }) as any;

  it('sin elementos no consulta (una lista vacía en `in (?)` sería SQL inválido)', async () => {
    const d = em();
    expect((await repo.doctorInfo(d, [])).size).toBe(0);
    expect((await repo.tenantNames(d, [])).size).toBe(0);
    expect((await repo.userNames(d, [])).size).toBe(0);
    expect(await repo.findByDoctors(d, [], 10)).toEqual([]);
    expect(await repo.findConversation(d, 'c-1', [])).toBeNull();
    expect(await repo.findAssignments(d, [])).toEqual([]);
    expect(d.execute).not.toHaveBeenCalled();
    expect(d.find).not.toHaveBeenCalled();
  });

  it('con elementos pasa la lista como un solo parámetro de `in (?)`', async () => {
    const d = em();
    d.execute.mockResolvedValue([]);
    await repo.tenantNames(d, ['t-1', 't-2', 't-1']);
    expect(d.execute.mock.calls[0][1]).toEqual([['t-1', 't-2']]);
  });
});

describe('SupportInboxRepository.emailOfUser (N11: solo direcciones verificadas con credencial activa)', () => {
  const repo = new SupportInboxRepository();
  const ACTIVE = CONCEPTS.STATE_ACTIVE;

  /** `em.find` mínimo: aplica los filtros por igualdad y `$ne: null` que usa la consulta. */
  const emWith = (rows: {
    credentials?: Record<string, unknown>[];
    verifications?: Record<string, unknown>[];
  }) =>
    ({
      find: mockFn((entity: unknown, where: Record<string, any>) => {
        const source =
          entity === AuthenticationCredentials
            ? (rows.credentials ?? [])
            : (rows.verifications ?? []);
        return Promise.resolve(
          source.filter((row) =>
            Object.entries(where).every(([key, expected]) =>
              expected !== null &&
              typeof expected === 'object' &&
              '$ne' in expected
                ? row[key] !== expected.$ne && row[key] !== undefined
                : row[key] === expected,
            ),
          ),
        );
      }),
    }) as any;

  const credential = (over: Record<string, unknown> = {}) => ({
    userId: 'u-1',
    stateConceptId: ACTIVE,
    externalSubject: 'maria@example.com',
    ...over,
  });
  const verification = (over: Record<string, unknown> = {}) => ({
    userId: 'u-1',
    email: 'maria@example.com',
    stateConceptId: CONCEPTS.STATE_VERIFIED,
    consumedAt: new Date('2026-10-01T10:00:00Z'),
    ...over,
  });

  it('con credencial activa y verificación consumida devuelve esa dirección', async () => {
    const em = emWith({
      credentials: [credential()],
      verifications: [verification()],
    });
    expect(await repo.emailOfUser(em, 'u-1')).toBe('maria@example.com');
  });

  it('una credencial REVOCADA con correo como usuario de acceso no sirve de destino', async () => {
    const em = emWith({
      credentials: [
        credential({
          stateConceptId: CONCEPTS.STATE_REVOKED,
          externalSubject: 'ajeno@example.com',
        }),
      ],
      verifications: [],
    });
    expect(await repo.emailOfUser(em, 'u-1')).toBeNull();
  });

  it('un correo que el titular escribió y nunca confirmó (sin consumir) no se usa', async () => {
    const em = emWith({
      credentials: [credential({ externalSubject: 'usuario-sin-correo' })],
      verifications: [
        verification({
          email: 'sin-confirmar@example.com',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          consumedAt: undefined,
        }),
      ],
    });
    expect(await repo.emailOfUser(em, 'u-1')).toBeNull();
  });

  it('una verificación consumida sin credencial activa tampoco', async () => {
    const em = emWith({
      credentials: [credential({ stateConceptId: CONCEPTS.STATE_REVOKED })],
      verifications: [verification()],
    });
    expect(await repo.emailOfUser(em, 'u-1')).toBeNull();
  });

  it('entre varias verificadas gana la del usuario de acceso, y luego la más reciente', async () => {
    const em = emWith({
      credentials: [credential({ externalSubject: 'Acceso@Example.com' })],
      verifications: [
        verification({ email: 'reciente@example.com' }),
        verification({ email: 'acceso@example.com' }),
      ],
    });
    expect(await repo.emailOfUser(em, 'u-1')).toBe('acceso@example.com');
    const sinAcceso = emWith({
      credentials: [credential({ externalSubject: 'otra-cosa' })],
      verifications: [verification({ email: 'reciente@example.com' })],
    });
    expect(await repo.emailOfUser(sinAcceso, 'u-1')).toBe(
      'reciente@example.com',
    );
  });
});

describe('SupportInboxRepository.patientContext (B7a: el vínculo cuenta ↔ persona es ACCOUNT_LINK_ACTIVE)', () => {
  const repo = new SupportInboxRepository();
  const data = {
    tenantId: 't-1',
    practitionerProfileId: 'd-1',
    patientUserId: 'u-1',
  };

  it('busca el vínculo con `profiles:ACCOUNT_LINK_ACTIVE` (el estado con que lo crea PersonAccountLinksRepository), no con state:active', async () => {
    const execute = mockFn().mockResolvedValue([]);
    expect(await repo.patientContext({ execute } as any, data)).toEqual({});
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][1]).toEqual(['u-1', PROF.ACCOUNT_LINK_ACTIVE]);
    expect(execute.mock.calls[0][1]).not.toContain(CONCEPTS.STATE_ACTIVE);
  });

  it('con vínculo resuelve el perfil de paciente y trae el motivo de la última cita con ese doctor', async () => {
    const execute = mockFn()
      .mockResolvedValueOnce([{ person_id: 'p-9' }])
      .mockResolvedValueOnce([{ reason_text: 'Control de presión' }]);
    expect(await repo.patientContext({ execute } as any, data)).toEqual({
      patientProfileId: 'p-9',
      reasonText: 'Control de presión',
    });
    expect(execute.mock.calls[1][1]).toEqual(['t-1', 'p-9', 'd-1']);
  });
});
