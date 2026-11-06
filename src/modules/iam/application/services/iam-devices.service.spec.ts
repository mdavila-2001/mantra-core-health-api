import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { IamDevicesService } from './iam-devices.service';
import { CONCEPTS, ResourceNotFoundException } from '../../../../common';
import { APP_DEVICE_PREFIX, appDeviceFingerprint } from '../../domain';

const actor = { id: 'u1', roles: ['USER'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const usersRepo = { findById: mockFn() };
  const devicesRepo = {
    create: mockFn(),
    findByUser: mockFn(),
    findByFingerprint: mockFn(async () => null),
    findOwnByFingerprint: mockFn(async () => null),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamDevicesService(
    em as any,
    usersRepo as any,
    devicesRepo as any,
    eventsRepo as any,
    logger as any,
  );
  return { service, tx, usersRepo, devicesRepo, eventsRepo };
}

describe('IamDevicesService (UC-01-05)', () => {
  it('registers a device without recording a trust event when not trusted', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    d.devicesRepo.create.mockReturnValue({ id: 'dev1' });

    const res = await d.service.register(
      'u1',
      { deviceFingerprint: 'fp' },
      actor,
    );

    expect(res).toEqual({ id: 'dev1', userId: 'u1', trusted: false });
    expect(d.eventsRepo.record).not.toHaveBeenCalled();
  });

  it('records a trust event when the device is trusted (business rule)', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    d.devicesRepo.create.mockReturnValue({ id: 'dev1' });

    const res = await d.service.register(
      'u1',
      { deviceFingerprint: 'fp', platform: 'IOS', trust: true },
      actor,
    );

    expect(res.trusted).toBe(true);
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventTypeConceptId: CONCEPTS.SEC_DEVICE_TRUST,
      }),
    );
  });

  it('throws when the user does not exist', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.register('u1', { deviceFingerprint: 'fp' }, actor as any),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  describe('titularidad de la cuenta', () => {
    it('rechaza con 403 que otra sesión registre un dispositivo de confianza en la cuenta ajena', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u2' });
      await expect(
        d.service.register(
          'u2',
          { deviceFingerprint: 'fp', trust: true },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.usersRepo.findById).not.toHaveBeenCalled();
      expect(d.devicesRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
      'deja que %s registre un dispositivo en una cuenta ajena',
      async (role) => {
        const d = build();
        d.usersRepo.findById.mockResolvedValue({ id: 'u2' });
        d.devicesRepo.create.mockReturnValue({ id: 'dev2' });
        const res = await d.service.register(
          'u2',
          { deviceFingerprint: 'fp' },
          { id: 'admin', roles: [role] } as any,
        );
        expect(res).toEqual({ id: 'dev2', userId: 'u2', trusted: false });
      },
    );
  });

  describe('huella ya registrada (teléfono compartido)', () => {
    it('guarda la huella derivada por cuenta, nunca el valor del cliente', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.devicesRepo.create.mockReturnValue({ id: 'dev1' });

      await d.service.register('u1', { deviceFingerprint: 'fp' }, actor);

      expect(d.devicesRepo.findOwnByFingerprint).toHaveBeenCalledWith(
        d.tx,
        'u1',
        appDeviceFingerprint('u1', 'fp'),
      );
      expect(d.devicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          userId: 'u1',
          deviceFingerprint: appDeviceFingerprint('u1', 'fp'),
        }),
      );
      expect(d.devicesRepo.findByFingerprint).not.toHaveBeenCalled();
    });

    it('otra cuenta con la misma huella obtiene su propia fila: nada se reasigna', async () => {
      // The attack: u2 replays u1's install key (or a login / web push
      // fingerprint). The derived value differs per account, so u1's row is
      // never looked up nor touched.
      const victim = appDeviceFingerprint('u1', 'fp');
      const attacker = appDeviceFingerprint('u2', 'fp');
      expect(attacker).not.toBe(victim);
      expect(attacker.startsWith(APP_DEVICE_PREFIX)).toBe(true);

      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u2' });
      d.devicesRepo.create.mockReturnValue({ id: 'dev2' });

      const res = await d.service.register(
        'u2',
        { deviceFingerprint: 'fp', platform: 'ANDROID' },
        { id: 'u2', roles: ['USER'] },
      );

      expect(res).toEqual({ id: 'dev2', userId: 'u2', trusted: false });
      expect(d.devicesRepo.findOwnByFingerprint).toHaveBeenCalledWith(
        d.tx,
        'u2',
        attacker,
      );
      expect(d.devicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ userId: 'u2', deviceFingerprint: attacker }),
      );
    });

    it('es idempotente para el mismo dueño: conserva token y confianza', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      const row: any = {
        id: 'dev1',
        userId: 'u1',
        trusted: true,
        pushTokenEncrypted: 'sealed',
      };
      d.devicesRepo.findOwnByFingerprint.mockResolvedValue(row);

      const res = await d.service.register(
        'u1',
        { deviceFingerprint: 'fp', platform: 'ANDROID', name: 'Android' },
        actor,
      );

      expect(d.devicesRepo.create).not.toHaveBeenCalled();
      expect(res).toEqual({ id: 'dev1', userId: 'u1', trusted: true });
      expect(row).toMatchObject({
        userId: 'u1',
        platformConceptId: CONCEPTS.PLATFORM_ANDROID,
        name: 'Android',
        pushTokenEncrypted: 'sealed',
        updatedByUserId: 'u1',
      });
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });
  });
});
