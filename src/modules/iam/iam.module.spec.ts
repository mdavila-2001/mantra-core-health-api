import { IamModule } from './iam.module';
import {
  IamAccountSecurityController,
  IamAuthController,
  IamUsersController,
} from './controllers';

/**
 * Los controladores que el módulo declara, leídos de su metadata.
 *
 * @returns Las clases registradas en `controllers`.
 */
function controladoresDe(modulo: unknown): readonly unknown[] {
  return (Reflect.getMetadata('controllers', modulo as object) ??
    []) as readonly unknown[];
}

/**
 * Importar un controlador no lo publica: si no entra en `controllers`, Nest no
 * mapea sus rutas y la API responde 404 (ver `community.module.spec.ts`).
 */
describe('IamModule', () => {
  it('publica los controladores de sesión y cuenta', () => {
    const controladores = controladoresDe(IamModule);
    expect(controladores).toContain(IamAuthController);
    expect(controladores).toContain(IamUsersController);
    expect(controladores).toContain(IamAccountSecurityController);
  });
});
