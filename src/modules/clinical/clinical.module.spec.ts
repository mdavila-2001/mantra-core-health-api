import { ClinicalModule } from './clinical.module';
import {
  ClinicalEncountersController,
  ClinicalMedicalAspectsController,
  ClinicalRecordsController,
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
 * Que un controlador exista y esté importado **no** lo publica: si no entra en
 * el arreglo `controllers` del módulo, Nest no mapea ni una de sus rutas y la
 * API responde 404 a todas. Mismo patrón que `community.module.spec.ts`.
 */
describe('ClinicalModule', () => {
  it('publica ClinicalMedicalAspectsController (GET|PUT /clinical/me/medical-aspects, D-B)', () => {
    expect(controladoresDe(ClinicalModule)).toContain(
      ClinicalMedicalAspectsController,
    );
  });

  it('publica los controladores que reciben los adjuntos clínicos (P25)', () => {
    const controladores = controladoresDe(ClinicalModule);
    expect(controladores).toContain(ClinicalRecordsController);
    expect(controladores).toContain(ClinicalEncountersController);
  });
});
