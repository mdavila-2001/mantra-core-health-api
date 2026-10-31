import { IamModule } from './iam.module';
import {
  IamAccessRescueController,
  IamAccountSecurityController,
  IamAuthController,
  IamStepUpController,
  IamUsersController,
} from './presentation/controllers';
import { STEP_UP_PORT } from './application/ports/step-up.port';
import {
  IamTotpService,
  NetworkProxyCheckService,
} from './application/services';

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

  it('N2: publica la ruta de rescate de plataforma', () => {
    expect(controllers(IamModule)).toContain(IamAccessRescueController);
  });

  it('N6/N8: registra el TOTP de un solo uso y la comprobación de TRUST_PROXY_HOPS', () => {
    const providers = (Reflect.getMetadata('providers', IamModule) ??
      []) as readonly unknown[];
    expect(providers).toContain(IamTotpService);
    expect(providers).toContain(NetworkProxyCheckService);
  });

  it('B5: publica /iam/me/step-up y exporta el puerto STEP_UP_PORT para delegated_access', () => {
    expect(controllers(IamModule)).toContain(IamStepUpController);
    const exported = (Reflect.getMetadata('exports', IamModule) ??
      []) as readonly unknown[];
    expect(exported).toContain(STEP_UP_PORT);
  });
});
