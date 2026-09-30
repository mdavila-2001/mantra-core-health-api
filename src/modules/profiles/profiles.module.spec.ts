import { ProfilesModule } from './profiles.module';
import { ProfilesPractitionersController } from './controllers';

/**
 * Que el controlador exista y esté importado no publica sus rutas: si no entra
 * en `controllers`, Nest no mapea ni una y la API responde 404 a todas —el
 * «existe pero da 404» que ninguna prueba del servicio ve—.
 */
describe('ProfilesModule', () => {
  it('publica ProfilesPractitionersController (especialidades y matrículas propias)', () => {
    const controladores = (Reflect.getMetadata(
      'controllers',
      ProfilesModule as object,
    ) ?? []) as readonly unknown[];
    expect(controladores).toContain(ProfilesPractitionersController);
  });
});
