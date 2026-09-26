import { DiagnosticsModule } from './diagnostics.module';
import { DiagnosticsPatientResultsController } from './controllers';

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
        DiagnosticsPatientResultsController.prototype.getOwnResultFileContent,
      ),
    ).toBe('me/:reportId/files/:fileId/content');
  });
});
