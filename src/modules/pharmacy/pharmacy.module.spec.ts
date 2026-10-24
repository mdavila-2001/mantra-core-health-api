import { PharmacyModule } from './pharmacy.module';
import { PharmacyReadController } from './controllers';
import { MedicineCatalogRepository } from './repositories';
import {
  MedicineCatalogSearchService,
  PharmacyProductsService,
} from './services';

/**
 * Nest resuelve las dependencias al arrancar, no al compilar: un servicio que un
 * controlador inyecta y que no figura en `providers` pasa `tsc` y los tests
 * unitarios (que construyen todo a mano) y recién revienta con «Nest can't
 * resolve dependencies». Esto fija, sin base ni app, lo que el catálogo
 * universal de medicamentos necesita registrado.
 */
describe('PharmacyModule · catálogo universal de medicamentos', () => {
  const providers: unknown[] = Reflect.getMetadata('providers', PharmacyModule);

  it('registers the catalog repository and the search service', () => {
    expect(providers).toContain(MedicineCatalogRepository);
    expect(providers).toContain(MedicineCatalogSearchService);
  });

  it('keeps the products service registered (it now depends on the catalog repository)', () => {
    expect(providers).toContain(PharmacyProductsService);
  });

  it('exposes the read controller that injects the search service', () => {
    const controllers: unknown[] = Reflect.getMetadata(
      'controllers',
      PharmacyModule,
    );
    expect(controllers).toContain(PharmacyReadController);
  });
});
