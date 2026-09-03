import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillingServiceCatalogController } from './billing-service-catalog.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const serviceCatalogService = { search: mockFn(), create: mockFn() };
  const nomenclature = { listSpecialties: mockFn(), search: mockFn() };
  const controller = new BillingServiceCatalogController(
    serviceCatalogService as any,
    nomenclature as any,
  );
  return { controller, serviceCatalogService, nomenclature };
}

describe('BillingServiceCatalogController', () => {
  it('delegates search with the parsed isActive flag and default limit', async () => {
    const d = build();
    d.serviceCatalogService.search.mockResolvedValue({
      items: [],
      count: 0,
      limit: 50,
      nextCursor: null,
    });

    await d.controller.search('pr1', 'consul', 'true', undefined, undefined);

    expect(d.serviceCatalogService.search).toHaveBeenCalledWith({
      practiceId: 'pr1',
      query: 'consul',
      isActive: true,
      cursor: undefined,
      limit: 50,
    });
  });

  it('leaves isActive undefined when the query param is absent', async () => {
    const d = build();
    d.serviceCatalogService.search.mockResolvedValue({
      items: [],
      count: 0,
      limit: 50,
      nextCursor: null,
    });

    await d.controller.search('pr1');

    expect(d.serviceCatalogService.search).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: undefined }),
    );
  });

  it('delegates create', async () => {
    const d = build();
    const dto = {
      practiceId: 'pr1',
      code: 'CONS-01',
      name: 'Consulta general',
      defaultPrice: '100.00',
    };
    d.serviceCatalogService.create.mockResolvedValue({ id: 's1', ...dto });

    await expect(d.controller.create(dto as any, actor)).resolves.toEqual({
      id: 's1',
      ...dto,
    });
    expect(d.serviceCatalogService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el nomenclador con la especialidad y el cursor tal cual', async () => {
    const d = build();
    d.nomenclature.search.mockResolvedValue({ items: [], nextCursor: null });

    await d.controller.searchProcedures('Cardiología', 'eco', 'c1', 10);

    // El cursor es opaco: se reenvía sin interpretarlo, que es lo único que el
    // controlador tiene que garantizar.
    expect(d.nomenclature.search).toHaveBeenCalledWith({
      specialty: 'Cardiología',
      query: 'eco',
      cursor: 'c1',
      limit: 10,
    });
  });

  it('delega las especialidades sin argumentos', async () => {
    const d = build();
    d.nomenclature.listSpecialties.mockResolvedValue({ items: [] });

    await d.controller.listProcedureSpecialties();

    expect(d.nomenclature.listSpecialties).toHaveBeenCalledTimes(1);
  });
});
