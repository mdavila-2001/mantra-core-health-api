import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../common/auth/public.decorator';
import { PublicCatalogController } from './controllers/public-catalog.controller';
import { PublicCatalogPageQueryDto } from './dto/public-catalog.dto';
import { PublicCatalogModule } from './public.module';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * El cableado de las fichas públicas (M4 · H2): que el módulo registre el
 * controlador, que las dos rutas sean exactamente las que llama el front, que
 * sean `@Public()` (sin sesión) y que la query se valide en vez de ignorarse.
 *
 * El arranque real (`Mapped {/public/profiles/o/:slug/services, GET}` en el log)
 * lo verifica M1 con la API levantada.
 */
describe('PublicCatalogModule (M4 · H2)', () => {
  it('registra el controlador de las fichas', () => {
    const controllers = Reflect.getMetadata('controllers', PublicCatalogModule);
    expect(controllers).toContain(PublicCatalogController);
  });

  it.each([
    ['organizationServices', 'public/profiles/o/:slug/services'],
    ['pharmacyProducts', 'public/profiles/f/:slug/products'],
  ])('%s es GET %s y @Public()', (metodo, ruta) => {
    const handler = (PublicCatalogController.prototype as any)[metodo];
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(ruta);
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
  });

  it('el controlador delega en el servicio con el slug y la página', async () => {
    const service = {
      organizationServices: mockFn().mockResolvedValue({ items: [] }),
      pharmacyProducts: mockFn().mockResolvedValue({ items: [] }),
    };
    const controller = new PublicCatalogController(service as any);

    await controller.organizationServices('clinica-norte', { limit: 5 });
    await controller.pharmacyProducts('farmacia-central', { cursor: 'abc' });

    expect(service.organizationServices).toHaveBeenCalledWith('clinica-norte', {
      limit: 5,
    });
    expect(service.pharmacyProducts).toHaveBeenCalledWith('farmacia-central', {
      cursor: 'abc',
    });
  });

  describe('la query se valida como en main.ts (400, no se ignora)', () => {
    const PIPE = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const META: ArgumentMetadata = {
      type: 'query',
      metatype: PublicCatalogPageQueryDto,
      data: '',
    };
    const valida = async (query: Record<string, unknown>) => {
      try {
        return await PIPE.transform(query, META);
      } catch {
        return 'rechazada';
      }
    };

    it('acepta limit dentro de [1, 50] y lo convierte a número', async () => {
      expect(await valida({ limit: '50' })).toEqual({ limit: 50 });
      expect(await valida({ limit: '1', cursor: 'abc' })).toEqual({
        limit: 1,
        cursor: 'abc',
      });
      expect(await valida({})).toEqual({});
    });

    it('rechaza limit fuera de rango o no numérico', async () => {
      expect(await valida({ limit: '0' })).toBe('rechazada');
      expect(await valida({ limit: '51' })).toBe('rechazada');
      expect(await valida({ limit: 'veinte' })).toBe('rechazada');
    });

    it('rechaza un parámetro que la lectura no declara', async () => {
      expect(await valida({ city: 'Cochabamba' })).toBe('rechazada');
    });
  });
});
