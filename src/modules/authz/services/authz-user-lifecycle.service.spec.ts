import { jest } from '@jest/globals';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { RefreshTokens, SecurityEvents, Sessions, Users } from '../../iam/entities';
import { AUTHZ_GOVERNANCE } from '../authz-governance.concepts';
import { AuthzGovernanceErrorReason as Reason } from '../authz-governance.error-reasons';
import { UserRoleAssignments } from '../entities';
import { AuthzUserLifecycleService } from './authz-user-lifecycle.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

interface Escena {
  status?: string | null;
  /** Último evento de ciclo de vida (más reciente primero). */
  events?: { eventTypeConceptId: string; detailJson?: unknown }[];
  /** Filas que afecta el UPDATE condicional de `iam.users`. */
  usersAffected?: number;
  revokedAssignments?: number;
}

function armar(e: Escena) {
  const tx: any = {
    findOne: mockFn(async (entity: unknown) =>
      entity === Users && e.status !== null
        ? { id: 'u-1', statusConceptId: e.status ?? CONCEPTS.USER_ACTIVE }
        : null,
    ),
    find: mockFn(async (entity: unknown) => {
      if (entity === SecurityEvents)
        return (e.events ?? []).map((x, i) => ({
          id: `ev-${i}`,
          recordedByUserId: 'admin-0',
          recordedAt: new Date(0),
          ...x,
        }));
      if (entity === Sessions) return [{ id: 's-1' }];
      return [];
    }),
    nativeUpdate: mockFn(async (entity: unknown) => {
      if (entity === Users) return e.usersAffected ?? 1;
      if (entity === UserRoleAssignments) return e.revokedAssignments ?? 0;
      return 1;
    }),
    create: mockFn((_entity: unknown, data: unknown) => data),
    flush: mockFn(async () => undefined),
  };
  const em: any = {
    ...tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new AuthzUserLifecycleService(em, logger as never);
  return { service, tx };
}

describe('AuthzUserLifecycleService', () => {
  it('suspende una cuenta activa: condiciona el UPDATE al estado, corta sesiones y deja el motivo', async () => {
    const { service, tx } = armar({});
    const r = await service.suspend('u-1', { reason: 'Licencia sin goce de sueldo' }, ACTOR);
    expect(r).toMatchObject({ userId: 'u-1', state: 'SUSPENDED', revokedAssignments: 0 });
    expect(tx.nativeUpdate).toHaveBeenCalledWith(
      Users,
      { id: 'u-1', statusConceptId: { $in: [CONCEPTS.USER_ACTIVE] } },
      expect.objectContaining({ statusConceptId: CONCEPTS.USER_LOCKED }),
    );
    expect(tx.nativeUpdate).toHaveBeenCalledWith(Sessions, expect.anything(), expect.anything());
    expect(tx.nativeUpdate).toHaveBeenCalledWith(RefreshTokens, expect.anything(), expect.anything());
    expect(tx.create).toHaveBeenCalledWith(
      SecurityEvents,
      expect.objectContaining({
        eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
        recordedByUserId: 'admin-1',
        detailJson: expect.objectContaining({ reason: 'Licencia sin goce de sueldo' }),
      }),
      { partial: true },
    );
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });

  it('nadie se suspende a sí mismo', async () => {
    const { service, tx } = armar({});
    await expect(
      service.suspend('admin-1', { reason: 'me quiero ir un rato' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_SELF_ACTION });
    expect(tx.nativeUpdate).not.toHaveBeenCalled();
  });

  it('si otro cambió el estado entre la lectura y la escritura, el UPDATE no afecta nada y es 409', async () => {
    const { service, tx } = armar({ usersAffected: 0 });
    const result = service.suspend('u-1', { reason: 'Investigación en curso' }, ACTOR);
    await expect(result).rejects.toBeInstanceOf(ConflictException);
    await expect(result).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_NOT_ACTIVE });
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('suspender una cuenta que ya no está activa es 409 y no escribe', async () => {
    const { service, tx } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED }],
      usersAffected: 0,
    });
    await expect(
      service.suspend('u-1', { reason: 'Investigación en curso' }, ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.create).not.toHaveBeenCalled();
  });

  it('reactiva sólo lo que quedó suspendido por este servicio', async () => {
    const { service } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED }],
    });
    const r = await service.reactivate('u-1', { reason: 'Volvió de su licencia' }, ACTOR);
    expect(r.state).toBe('ACTIVE');
  });

  it('una cuenta bloqueada por otra causa no se reactiva aquí (NOT_SUSPENDED)', async () => {
    const { service } = armar({ status: CONCEPTS.USER_LOCKED, events: [] });
    await expect(
      service.reactivate('u-1', { reason: 'Quiero que entre ya' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_NOT_SUSPENDED });
  });

  it('una baja no se reactiva', async () => {
    const { service } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED }],
    });
    await expect(
      service.reactivate('u-1', { reason: 'Me arrepentí de la baja' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_ALREADY_OFFBOARDED });
  });

  it('la baja bloquea, corta sesiones, revoca todos los roles activos y lo cuenta', async () => {
    const { service, tx } = armar({ revokedAssignments: 3 });
    const r = await service.offboard('u-1', { reason: 'Terminó su contrato' }, ACTOR);
    expect(r).toMatchObject({ state: 'OFFBOARDED', revokedAssignments: 3 });
    expect(tx.nativeUpdate).toHaveBeenCalledWith(
      UserRoleAssignments,
      { userId: 'u-1', statusConceptId: CONCEPTS.STATE_ACTIVE },
      expect.objectContaining({ statusConceptId: CONCEPTS.STATE_REVOKED }),
    );
  });

  it('dar de baja dos veces es 409', async () => {
    const { service } = armar({
      status: CONCEPTS.USER_LOCKED,
      events: [{ eventTypeConceptId: AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED }],
    });
    await expect(
      service.offboard('u-1', { reason: 'Terminó su contrato' }, ACTOR),
    ).rejects.toMatchObject({ reason: Reason.USER_LIFECYCLE_ALREADY_OFFBOARDED });
  });

  it('una cuenta anonimizada no admite transiciones (422)', async () => {
    const { service } = armar({ status: CONCEPTS.USER_ANONYMIZED });
    await expect(
      service.suspend('u-1', { reason: 'Ya no debería importar' }, ACTOR),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('un usuario inexistente es 404 con su motivo', async () => {
    const { service } = armar({ status: null });
    await expect(
      service.suspend('u-1', { reason: 'No existe esa cuenta' }, ACTOR),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('el estado se lee del último evento: bloqueada sin eventos es LOCKED_OTHER', async () => {
    const { service } = armar({ status: CONCEPTS.USER_LOCKED, events: [] });
    const r = await service.lifecycleOf('u-1');
    expect(r.state).toBe('LOCKED_OTHER');
  });
});
