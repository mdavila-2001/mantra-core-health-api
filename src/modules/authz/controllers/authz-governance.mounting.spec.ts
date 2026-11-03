import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { PlatformAdminScopeGuard } from '../../../common/auth/platform-admin-scope.guard';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AuthzGovernanceController } from './authz-governance.controller';
import { AuthzGovernanceExtController } from './authz-governance-ext.controller';

/**
 * Montaje del gobierno de acceso. Ocultar un botón no protege nada y un olvido de decorador pasa
 * la compilación: estas pruebas fijan, sobre los metadatos reales de Nest, qué exige cada ruta.
 *
 * - `AuthzGovernanceController` (quién puede qué, revisiones, simulador) atraviesa usuarios de TODA
 *   la plataforma: exige `PlatformAdminScopeGuard` y `SECURITY_ADMIN` en cada ruta.
 * - `AuthzGovernanceExtController` admite al administrador con alcance de organización, así que NO
 *   lleva ese guard —su servicio acota cada operación al tenant—, pero sí `SECURITY_ADMIN`.
 */
const reflector = new Reflector();

const rutas = (ctrl: { prototype: object }): string[] =>
  Object.getOwnPropertyNames(ctrl.prototype).filter(
    (n) =>
      n !== 'constructor' &&
      typeof (ctrl.prototype as Record<string, unknown>)[n] === 'function',
  );

const rolesDe = (ctrl: { prototype: object }, ruta: string): unknown =>
  reflector.get(
    ROLES_KEY,
    (ctrl.prototype as Record<string, (...a: never[]) => unknown>)[ruta],
  );

describe('AuthzGovernanceController · montaje', () => {
  it('exige administrador de plataforma a nivel de controlador', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AuthzGovernanceController),
    ).toEqual(expect.arrayContaining([PlatformAdminScopeGuard]));
  });

  it('declara SECURITY_ADMIN en todas sus rutas', () => {
    const todas = rutas(AuthzGovernanceController);
    expect(todas.length).toBeGreaterThanOrEqual(9);
    for (const r of todas)
      expect([r, rolesDe(AuthzGovernanceController, r)]).toEqual([
        r,
        ['SECURITY_ADMIN'],
      ]);
  });
});

describe('AuthzGovernanceExtController · montaje', () => {
  it('declara SECURITY_ADMIN en todas sus rutas', () => {
    const todas = rutas(AuthzGovernanceExtController);
    expect(todas.sort()).toEqual([
      'endScopeGrant',
      'fieldPermissions',
      'scopeGrants',
    ]);
    for (const r of todas)
      expect([r, rolesDe(AuthzGovernanceExtController, r)]).toEqual([
        r,
        ['SECURITY_ADMIN'],
      ]);
  });

  it('no usa el guard de plataforma: el alcance lo impone el servicio', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AuthzGovernanceExtController) ?? [],
    ).not.toContain(PlatformAdminScopeGuard);
  });
});
