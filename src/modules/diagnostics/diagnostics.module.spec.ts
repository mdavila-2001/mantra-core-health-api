import { DiagnosticsModule } from './diagnostics.module';
import {
  DiagnosticsPatientResultsController,
  DiagnosticsSpecimensController,
} from './controllers';

/**
 * Importar un controlador no lo publica: si no entra en `controllers`, Nest no
 * mapea sus rutas (ver `community.module.spec.ts`).
 */
describe('DiagnosticsModule', () => {
  it('publica DiagnosticsPatientResultsController (incluye la descarga del resultado propio)', () => {
    const controladores = (Reflect.getMetadata(
      'controllers',
      DiagnosticsModule,
    ) ?? []) as readonly unknown[];
    expect(controladores).toContain(DiagnosticsPatientResultsController);
  });

  it('la ruta de contenido del resultado propio está declarada', () => {
    const rutas = Object.getOwnPropertyNames(
      DiagnosticsPatientResultsController.prototype,
    );
    expect(rutas).toContain('getOwnResultFileContent');
    expect(
      Reflect.getMetadata(
        'path',
        Reflect.get(
          DiagnosticsPatientResultsController.prototype,
          'getOwnResultFileContent',
        ) as object,
      ),
    ).toBe('me/:reportId/files/:fileId/content');
  });

  it('CL-47: las lecturas de acesión y espécimen están declaradas', () => {
    const rutas = Object.getOwnPropertyNames(
      DiagnosticsSpecimensController.prototype,
    );
    expect(rutas).toContain('getAccession');
    expect(rutas).toContain('getSpecimen');
    expect(
      Reflect.getMetadata(
        'path',
        Reflect.get(
          DiagnosticsSpecimensController.prototype,
          'getAccession',
        ) as object,
      ),
    ).toBe('accessions/:id');
    expect(
      Reflect.getMetadata(
        'path',
        Reflect.get(
          DiagnosticsSpecimensController.prototype,
          'getSpecimen',
        ) as object,
      ),
    ).toBe('specimens/:id');
  });
});
