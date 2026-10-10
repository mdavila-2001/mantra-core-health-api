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
function controllers(module: unknown): readonly unknown[] {
  return (Reflect.getMetadata('controllers', module as object) ??
    []) as readonly unknown[];
}

/**
 * Importar un controlador no lo publica: si no entra en `controllers`, Nest no
 * mapea sus rutas y la API responde 404 (ver `community.module.spec.ts`).
 */
describe('IamModule', () => {
  it('publica los controladores de sesión y cuenta', () => {
    const declaredControllers = controllers(IamModule);
    expect(declaredControllers).toContain(IamAuthController);
    expect(declaredControllers).toContain(IamUsersController);
    expect(declaredControllers).toContain(IamAccountSecurityController);
  });
});
