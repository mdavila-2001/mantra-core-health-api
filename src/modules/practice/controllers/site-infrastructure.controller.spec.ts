import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { SiteInfrastructureController } from './site-infrastructure.controller';

/**
 * Autorización declarada de `SiteInfrastructureController` (O3-3). La clase
 * autoriza por membresía en el servicio; la única ruta reservada a la
 * plataforma, verificar el SNIS, la declara con `@Roles`.
 */
describe('SiteInfrastructureController — autorización declarada', () => {
  const rolesOf = (handler: keyof SiteInfrastructureController): unknown =>
    Reflect.getMetadata(
      ROLES_KEY,
      Object.getOwnPropertyDescriptor(
        SiteInfrastructureController.prototype,
        handler,
      )!.value as object,
    );

  it('verify-snis exige SECURITY_ADMIN o SUPERADMIN, la regla del servicio', () => {
    expect(rolesOf('verifySnis')).toEqual(['SECURITY_ADMIN', 'SUPERADMIN']);
  });

  it('la clase no declara @Roles: el resto se autoriza por membresía', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, SiteInfrastructureController),
    ).toBeUndefined();
    expect(rolesOf('updateRegulatory')).toBeUndefined();
  });
});
