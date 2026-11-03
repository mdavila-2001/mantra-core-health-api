import { ConsentModule } from './consent.module';
import {
  ConsentMeController,
  EncounterInformedConsentsController,
} from './controllers';
import { AuthzModule } from '../authz/authz.module';
import { AuthzMeController } from '../authz/controllers';

/**
 * Importar un controlador no lo publica: si no entra en `controllers`, Nest no
 * mapea sus rutas (ver `community.module.spec.ts`).
 */
function controllers(module: unknown): readonly unknown[] {
  return (Reflect.getMetadata('controllers', module as object) ??
    []) as readonly unknown[];
}

describe('ConsentModule / AuthzModule (BR-20)', () => {
  it('publica las lecturas del titular y la ruta del consentimiento informado del médico', () => {
    const declaredControllers = controllers(ConsentModule);
    expect(declaredControllers).toContain(ConsentMeController);
    expect(declaredControllers).toContain(EncounterInformedConsentsController);
  });

  it('publica «Quién ve mi historia»', () => {
    expect(controllers(AuthzModule)).toContain(AuthzMeController);
  });
});
