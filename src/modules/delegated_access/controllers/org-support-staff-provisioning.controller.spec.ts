import 'reflect-metadata';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { OrgSupportStaffProvisioningController } from './org-support-staff-provisioning.controller';

describe('OrgSupportStaffProvisioningController', () => {
  it('POST org/support-staff declara `@Roles()` vacío: la autorización por organización la decide el servicio', () => {
    const handler = Object.getOwnPropertyDescriptor(
      OrgSupportStaffProvisioningController.prototype,
      'create',
    )?.value as object;
    const roles: unknown = Reflect.getMetadata(ROLES_KEY, handler);
    expect(roles).toEqual([]);
  });
});
