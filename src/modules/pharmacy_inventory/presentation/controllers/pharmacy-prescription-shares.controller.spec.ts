import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_LOGGED_KEY } from '../../../../common';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { PharmacyPrescriptionSharesController } from './pharmacy-prescription-shares.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'user-ph', roles: ['PHARMACY_STAFF'] } as any;

describe('PharmacyPrescriptionSharesController (FAR-02)', () => {
  const handler = (
    PharmacyPrescriptionSharesController.prototype as never as Record<
      string,
      object
    >
  ).open;

  it('is only for pharmacy staff: patient, doctor and clinic admin are left to the 403 of the roles guard', () => {
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['PHARMACY_STAFF']);
  });

  it.each([
    ['patient', ['PATIENT']],
    ['doctor', ['PRACTITIONER']],
    ['clinic admin', ['SCHEDULING_ADMIN']],
  ])('the roles guard answers 403 to a %s', (_who, roles) => {
    const guard = new RolesGuard(new Reflector());
    const context = {
      getHandler: () => handler,
      getClass: () => PharmacyPrescriptionSharesController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles }, resolvedTenantId: 'tenant-1' }),
      }),
    };
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it('the roles guard lets pharmacy staff in', () => {
    const guard = new RolesGuard(new Reflector());
    const context = {
      getHandler: () => handler,
      getClass: () => PharmacyPrescriptionSharesController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles: ['PHARMACY_STAFF'] },
          resolvedTenantId: 'tenant-ph',
        }),
      }),
    };
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('logs the access, without the token as resource id', () => {
    expect(Reflect.getMetadata(ACCESS_LOGGED_KEY, handler)).toEqual({
      resourceType: 'PRESCRIPTION_SHARE',
    });
  });

  it('serves the route of the contract', () => {
    expect(
      Reflect.getMetadata('path', PharmacyPrescriptionSharesController),
    ).toBe('pharmacy/prescription-shares');
    expect(Reflect.getMetadata('path', handler)).toBe(':token');
  });

  it('passes the token as is, the actor and the request origin to the use case', async () => {
    const openShare = { execute: mockFn(async () => ({ shareId: 'share-1' })) };
    const controller = new PharmacyPrescriptionSharesController(
      openShare as any,
    );
    await expect(
      controller.open('tok_en-1', ACTOR, '10.0.0.1', 'UA'),
    ).resolves.toEqual({ shareId: 'share-1' });
    expect(openShare.execute).toHaveBeenCalledWith('tok_en-1', 'user-ph', {
      sourceIp: '10.0.0.1',
      userAgent: 'UA',
    });
  });

  it('sends nulls when the request has no IP or user agent', async () => {
    const openShare = { execute: mockFn(async () => ({})) };
    const controller = new PharmacyPrescriptionSharesController(
      openShare as any,
    );
    await controller.open('tok', ACTOR);
    expect(openShare.execute).toHaveBeenCalledWith('tok', 'user-ph', {
      sourceIp: null,
      userAgent: null,
    });
  });
});
