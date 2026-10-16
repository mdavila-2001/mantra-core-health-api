import { CommunityModule } from './community.module';
import {
  CommunityPublicController,
  CommunityReviewsController,
  PatientReviewsController,
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
 * Que un controlador exista y esté importado **no** lo publica: si no entra en
 * el arreglo `controllers` del módulo, Nest no mapea ni una de sus rutas y la
 * API responde 404 a todas.
 *
 * Es un hueco que ninguna prueba del servicio ni del controlador puede ver
 * —las dos instancian la clase a mano— y que sólo se nota arrancando la
 * aplicación y leyendo qué rutas quedaron mapeadas. Pasó con
 * `PatientReviewsController`: estaba escrito, probado e importado, y
 * `POST /patients/me/reviews` devolvía 404 porque faltaba esta línea.
 */
describe('CommunityModule', () => {
  it('publica PatientReviewsController: importarlo no alcanza para mapear sus rutas', () => {
    expect(controllers(CommunityModule)).toContain(PatientReviewsController);
  });

  it('publica los controladores de reseñas, con sesión y sin ella', () => {
    const declaredControllers = controllers(CommunityModule);
    expect(declaredControllers).toContain(CommunityReviewsController);
    expect(declaredControllers).toContain(CommunityPublicController);
  });
});
