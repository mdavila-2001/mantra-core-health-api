import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  encodeKeysetCursor,
} from '../../../../common';
import { IamErrorReason } from '../../iam.error-reasons';
import { IamUsersService } from './iam-users.service';
import { commonRecords } from './iam-registration.testing';

// Fábrica de mocks con tipos sueltos: lo que se prueba es el contrato del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const USER_ID = 'user-1';
const REASON = 'Revisión trimestral de accesos';

type Last = 'SUSPEND' | 'REACTIVATE' | 'DEACTIVATE' | null;

/**
 * Arma el servicio con repositorios dobles. La cuenta nace en `status` y su última acción de
 * ciclo de vida es `last`. `otherAdmins` es cuántas otras cuentas administran accesos.
 */
function build(
  opts: {
    status?: string;
    last?: Last;
    user?: boolean;
    transition?: boolean;
    grants?: string[];
    otherAdmins?: number;
  } = {},
) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const user =
    opts.user === false
      ? null
      : {
          id: USER_ID,
          statusConceptId: opts.status ?? CONCEPTS.USER_ACTIVE,
        };
  const usersRepo = {
    findById: mockFn().mockResolvedValue(user),
    findByIdForUpdate: mockFn().mockResolvedValue(user),
    transitionStatus: mockFn().mockResolvedValue(opts.transition ?? true),
    lockAccessAdminChanges: mockFn().mockResolvedValue(undefined),
  };
  const credentialsRepo = { revokeAllForUser: mockFn().mockResolvedValue(1) };
  const rolesRepo = {
    findActiveForUser: mockFn().mockResolvedValue(
      (opts.grants ?? [CONCEPTS.ROLE_USER]).map((roleConceptId) => ({
        roleConceptId,
      })),
    ),
    countOtherActiveHolders: mockFn().mockResolvedValue(opts.otherAdmins ?? 1),
    revokeAllForUser: mockFn().mockResolvedValue(1),
  };
  const sessionsRepo = {
    activeSessionIdsForUser: mockFn().mockResolvedValue(['s-1', 's-2']),
    revokeAllActiveForUser: mockFn().mockResolvedValue(2),
  };
  const refreshRepo = {
    revokeActiveBySessionIds: mockFn().mockResolvedValue(2),
  };
  const lockoutsRepo = {
    create: mockFn(),
    findActiveForUser: mockFn().mockResolvedValue(null),
    releaseActiveForUser: mockFn().mockResolvedValue(true),
  };
  const eventsRepo = {
    record: mockFn(),
    latestLifecycleAction: mockFn().mockResolvedValue(opts.last ?? null),
    lifecycleHistory: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IamUsersService(
    em as any,
    usersRepo as any,
    credentialsRepo as any,
    rolesRepo as any,
    sessionsRepo as any,
    refreshRepo as any,
    lockoutsRepo as any,
    eventsRepo as any,
    commonRecords({ contactPoints: { create: mockFn() } }),
    logger as any,
  );
  return {
    service,
    tx,
    em,
    usersRepo,
    credentialsRepo,
    rolesRepo,
    sessionsRepo,
    refreshRepo,
    lockoutsRepo,
    eventsRepo,
    logger,
  };
}

/** Nada se escribió: ni estado, ni bloqueo, ni sesiones, ni bitácora. */
function expectNoWrites(d: ReturnType<typeof build>) {
  expect(d.usersRepo.transitionStatus).not.toHaveBeenCalled();
  expect(d.lockoutsRepo.create).not.toHaveBeenCalled();
  expect(d.lockoutsRepo.releaseActiveForUser).not.toHaveBeenCalled();
  expect(d.sessionsRepo.revokeAllActiveForUser).not.toHaveBeenCalled();
  expect(d.credentialsRepo.revokeAllForUser).not.toHaveBeenCalled();
  expect(d.eventsRepo.record).not.toHaveBeenCalled();
}

describe('IamUsersService — ciclo de vida de la cuenta (H5)', () => {
  describe('correcto', () => {
    it('suspender: precondición ACTIVE en la escritura, bloqueo, sesiones cerradas y bitácora con motivo', async () => {
      const d = build();
      const r = await d.service.suspend(USER_ID, REASON, ACTOR);

      expect(r).toEqual({
        id: USER_ID,
        state: 'SUSPENDED',
        changed: true,
        revokedSessions: 2,
      });
      expect(d.usersRepo.findByIdForUpdate).toHaveBeenCalledWith(d.tx, USER_ID);
      expect(d.usersRepo.transitionStatus).toHaveBeenCalledWith(
        d.tx,
        USER_ID,
        [CONCEPTS.USER_ACTIVE],
        CONCEPTS.USER_LOCKED,
        'admin-1',
      );
      expect(d.lockoutsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          userId: USER_ID,
          reasonConceptId: CONCEPTS.LOCK_REASON_MANUAL,
        }),
      );
      expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
        d.tx,
        ['s-1', 's-2'],
      );
      expect(d.credentialsRepo.revokeAllForUser).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(d.tx, {
        eventTypeConceptId: CONCEPTS.SEC_ACCOUNT_LOCK,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: USER_ID,
        recordedByUserId: 'admin-1',
        detailJson: { action: 'SUSPEND', reason: REASON, source: 'manual' },
      });
    });

    it('reactivar una cuenta suspendida: libera el bloqueo y no toca las sesiones', async () => {
      const d = build({ status: CONCEPTS.USER_LOCKED, last: 'SUSPEND' });
      const r = await d.service.reactivate(USER_ID, REASON, ACTOR);

      expect(r).toEqual({
        id: USER_ID,
        state: 'ACTIVE',
        changed: true,
        revokedSessions: 0,
      });
      expect(d.usersRepo.transitionStatus).toHaveBeenCalledWith(
        d.tx,
        USER_ID,
        [CONCEPTS.USER_LOCKED],
        CONCEPTS.USER_ACTIVE,
        'admin-1',
      );
      expect(d.lockoutsRepo.releaseActiveForUser).toHaveBeenCalledWith(
        d.tx,
        USER_ID,
        'admin-1',
      );
      expect(d.sessionsRepo.revokeAllActiveForUser).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          detailJson: {
            action: 'REACTIVATE',
            reason: REASON,
            source: 'manual',
          },
        }),
      );
    });

    it('dar de baja: no borra nada y revoca credenciales, roles globales y sesiones', async () => {
      const d = build();
      const r = await d.service.deactivate(USER_ID, REASON, ACTOR);

      expect(r).toEqual({
        id: USER_ID,
        state: 'DEACTIVATED',
        changed: true,
        revokedSessions: 2,
      });
      expect(d.credentialsRepo.revokeAllForUser).toHaveBeenCalledWith(
        d.tx,
        USER_ID,
      );
      expect(d.rolesRepo.revokeAllForUser).toHaveBeenCalledWith(d.tx, USER_ID);
      expect(d.tx).not.toHaveProperty('removeAndFlush');
      expect(d.tx).not.toHaveProperty('nativeDelete');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          detailJson: {
            action: 'DEACTIVATE',
            reason: REASON,
            source: 'manual',
          },
        }),
      );
    });

    it('la baja también se aplica a una cuenta suspendida', async () => {
      const d = build({ status: CONCEPTS.USER_LOCKED, last: 'SUSPEND' });
      const r = await d.service.deactivate(USER_ID, REASON, ACTOR);

      expect(r.state).toBe('DEACTIVATED');
      expect(d.usersRepo.transitionStatus).toHaveBeenCalledWith(
        d.tx,
        USER_ID,
        [CONCEPTS.USER_LOCKED],
        CONCEPTS.USER_LOCKED,
        'admin-1',
      );
    });
  });

  describe('límite', () => {
    it.each([
      ['suspend', CONCEPTS.USER_LOCKED, 'SUSPEND', 'SUSPENDED'],
      ['reactivate', CONCEPTS.USER_ACTIVE, null, 'ACTIVE'],
      ['deactivate', CONCEPTS.USER_LOCKED, 'DEACTIVATE', 'DEACTIVATED'],
    ] as const)(
      'idempotencia: %s sobre la cuenta que ya está en ese estado responde sin escribir nada',
      async (op, status, last, state) => {
        const d = build({ status, last });
        const r = await d.service[op](USER_ID, REASON, ACTOR);

        expect(r).toEqual({
          id: USER_ID,
          state,
          changed: false,
          revokedSessions: 0,
        });
        expectNoWrites(d);
      },
    );

    it('repetir una suspensión dos veces escribe una sola vez', async () => {
      const d = build();
      await d.service.suspend(USER_ID, REASON, ACTOR);
      // la segunda lectura ve la cuenta ya bloqueada
      d.usersRepo.findByIdForUpdate.mockResolvedValue({
        id: USER_ID,
        statusConceptId: CONCEPTS.USER_LOCKED,
      });
      d.eventsRepo.latestLifecycleAction.mockResolvedValue('SUSPEND');
      const second = await d.service.suspend(USER_ID, REASON, ACTOR);

      expect(second.changed).toBe(false);
      expect(d.usersRepo.transitionStatus).toHaveBeenCalledTimes(1);
      expect(d.eventsRepo.record).toHaveBeenCalledTimes(1);
    });

    it('una cuenta bloqueada sin marca de ciclo de vida (bloqueo legado) cuenta como suspendida', async () => {
      const d = build({ status: CONCEPTS.USER_LOCKED, last: null });
      const r = await d.service.reactivate(USER_ID, REASON, ACTOR);

      expect(r.state).toBe('ACTIVE');
      expect(r.changed).toBe(true);
    });

    it('la cuenta que administra accesos se puede suspender si queda otra que los administra', async () => {
      const d = build({
        grants: [CONCEPTS.ROLE_SECURITY_ADMIN],
        otherAdmins: 1,
      });
      const r = await d.service.suspend(USER_ID, REASON, ACTOR);

      expect(r.changed).toBe(true);
      expect(d.usersRepo.lockAccessAdminChanges).toHaveBeenCalledWith(d.tx);
      expect(d.rolesRepo.countOtherActiveHolders).toHaveBeenCalledWith(
        d.tx,
        [CONCEPTS.ROLE_SECURITY_ADMIN, CONCEPTS.ROLE_SUPERADMIN],
        USER_ID,
      );
    });

    it('una cuenta sin rol de administración no toma el cerrojo de administradores', async () => {
      const d = build();
      await d.service.suspend(USER_ID, REASON, ACTOR);

      expect(d.usersRepo.lockAccessAdminChanges).not.toHaveBeenCalled();
    });

    it('si ya hay un bloqueo activo no se crea otro', async () => {
      const d = build();
      d.lockoutsRepo.findActiveForUser.mockResolvedValue({ id: 'l-1' });
      await d.service.suspend(USER_ID, REASON, ACTOR);

      expect(d.lockoutsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('inválido', () => {
    it('la cuenta no existe: 404 USER_NOT_FOUND y nada se escribe', async () => {
      const d = build({ user: false });
      const e = await d.service
        .suspend(USER_ID, REASON, ACTOR)
        .catch((x: unknown) => x);

      expect(e).toBeInstanceOf(ResourceNotFoundException);
      expect((e as any).reason).toBe(IamErrorReason.USER_NOT_FOUND);
      expectNoWrites(d);
    });

    it.each([
      ['suspend', CONCEPTS.USER_LOCKED, 'DEACTIVATE'],
      ['reactivate', CONCEPTS.USER_LOCKED, 'DEACTIVATE'],
      ['suspend', CONCEPTS.USER_ANONYMIZED, null],
      ['reactivate', CONCEPTS.USER_ANONYMIZED, null],
      ['deactivate', CONCEPTS.USER_ANONYMIZED, null],
    ] as const)(
      '%s desde un estado que no lo admite (%s / última %s): 409 y nada se escribe',
      async (op, status, last) => {
        const d = build({ status, last });
        const e = await d.service[op](USER_ID, REASON, ACTOR).catch(
          (x: unknown) => x,
        );

        expect(e).toBeInstanceOf(ConflictException);
        expect((e as any).reason).toBe(
          IamErrorReason.USER_LIFECYCLE_TRANSITION_INVALID,
        );
        expectNoWrites(d);
      },
    );

    it('estado de cuenta desconocido: 409, no se adivina', async () => {
      const d = build({ status: 'concepto-desconocido' });
      await expect(
        d.service.suspend(USER_ID, REASON, ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
      expectNoWrites(d);
    });

    it('la cuenta cambió entre la lectura y la escritura: la precondición falla con 409 y no deja rastro', async () => {
      const d = build({ transition: false });
      const e = await d.service
        .suspend(USER_ID, REASON, ACTOR)
        .catch((x: unknown) => x);

      expect(e).toBeInstanceOf(ConflictException);
      expect((e as any).reason).toBe(
        IamErrorReason.USER_LIFECYCLE_TRANSITION_INVALID,
      );
      expect(d.lockoutsRepo.create).not.toHaveBeenCalled();
      expect(d.sessionsRepo.revokeAllActiveForUser).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it.each(['suspend', 'deactivate'] as const)(
      '%s sobre la propia cuenta: 412 USER_SELF_LIFECYCLE_FORBIDDEN, sin abrir transacción',
      async (op) => {
        const d = build();
        const e = await d.service[op](ACTOR.id, REASON, ACTOR).catch(
          (x: unknown) => x,
        );

        expect(e).toBeInstanceOf(PreconditionFailedException);
        expect((e as any).reason).toBe(
          IamErrorReason.USER_SELF_LIFECYCLE_FORBIDDEN,
        );
        expect(d.em.transactional).not.toHaveBeenCalled();
      },
    );

    it.each(['suspend', 'deactivate'] as const)(
      '%s de la última cuenta que administra accesos: 412 USER_LAST_SECURITY_ADMIN',
      async (op) => {
        const d = build({
          grants: [CONCEPTS.ROLE_SUPERADMIN],
          otherAdmins: 0,
        });
        const e = await d.service[op](USER_ID, REASON, ACTOR).catch(
          (x: unknown) => x,
        );

        expect(e).toBeInstanceOf(PreconditionFailedException);
        expect((e as any).reason).toBe(IamErrorReason.USER_LAST_SECURITY_ADMIN);
        expectNoWrites(d);
      },
    );

    it('el motivo no se escribe en el log estructurado', async () => {
      const d = build();
      await d.service.suspend(USER_ID, REASON, ACTOR);

      const logged = JSON.stringify(d.logger.info.mock.calls);
      expect(logged).not.toContain(REASON);
    });
  });

  describe('lifecycleOf (historia paginada)', () => {
    const row = (n: number) => ({
      id: `e-${n}`,
      action: 'SUSPEND',
      reason: REASON,
      recorded_by_user_id: 'admin-1',
      recorded_at: `2026-10-0${n}T10:00:00.000000Z`,
    });

    it('devuelve el estado y la página; con una fila de más emite cursor', async () => {
      const d = build({ status: CONCEPTS.USER_LOCKED, last: 'SUSPEND' });
      d.eventsRepo.lifecycleHistory.mockResolvedValue([row(3), row(2), row(1)]);
      const v = await d.service.lifecycleOf(USER_ID, { limit: 2 });

      expect(v.state).toBe('SUSPENDED');
      expect(v.items.map((i) => i.id)).toEqual(['e-3', 'e-2']);
      expect(v.limit).toBe(2);
      expect(v.nextCursor).toBe(
        encodeKeysetCursor({ t: row(2).recorded_at, i: 'e-2' }),
      );
      expect(d.eventsRepo.lifecycleHistory).toHaveBeenCalledWith(
        d.tx,
        USER_ID,
        { limit: 2, after: undefined },
      );
    });

    it('la última página no lleva cursor; el tope por defecto es 20', async () => {
      const d = build();
      d.eventsRepo.lifecycleHistory.mockResolvedValue([row(1)]);
      const v = await d.service.lifecycleOf(USER_ID, {});

      expect(v.nextCursor).toBeNull();
      expect(v.limit).toBe(20);
      expect(v.state).toBe('ACTIVE');
    });

    it('un cursor con otra forma: 400', async () => {
      const d = build();
      await expect(
        d.service.lifecycleOf(USER_ID, {
          cursor: encodeKeysetCursor({ x: 'y' }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('la cuenta no existe: 404', async () => {
      const d = build({ user: false });
      await expect(d.service.lifecycleOf(USER_ID, {})).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
