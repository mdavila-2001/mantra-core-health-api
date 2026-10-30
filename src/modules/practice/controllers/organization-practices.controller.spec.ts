import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ParseUUIDPipe } from '@nestjs/common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { OrganizationPracticesController } from './organization-practices.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'user-1', roles: ['USER'] } as any;

describe('OrganizationPracticesController', () => {
  it('delega en el servicio con el tenant de la ruta y el actor', async () => {
    const provisioning = {
      provision: mockFn().mockResolvedValue({
        practiceId: 'pr-1',
        practiceSiteId: 'site-1',
      }),
    };
    const controller = new OrganizationPracticesController(provisioning as any);
    const dto = { name: 'Centro', site: {} } as any;

    const res = await controller.create('tenant-1', dto, actor);

    expect(provisioning.provision).toHaveBeenCalledWith('tenant-1', dto, actor);
    expect(res).toEqual({ practiceId: 'pr-1', practiceSiteId: 'site-1' });
  });

  it('mapea POST tenants/:tenantId/practices', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, OrganizationPracticesController),
    ).toBe('tenants');
    const handler: object = Reflect.get(
      OrganizationPracticesController.prototype,
      'create',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      ':tenantId/practices',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
  });

  it('valida tenantId como uuid', () => {
    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      OrganizationPracticesController,
      'create',
    );
    const param = Object.entries(args).find(([key]) =>
      key.startsWith(`${RouteParamtypes.PARAM}:`),
    )?.[1] as { pipes: unknown[] };
    expect(param.pipes).toContain(ParseUUIDPipe);
  });

  it('no declara @Roles: la regla es la membresía de esa organización', () => {
    const handler: object = Reflect.get(
      OrganizationPracticesController.prototype,
      'create',
    );
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
    expect(
      Reflect.getMetadata(ROLES_KEY, OrganizationPracticesController),
    ).toBeUndefined();
  });
});
