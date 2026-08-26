import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { LinkableOrganizationsService } from './linkable-organizations.service';
import { BO_FACILITY_PROPERTY_CODES } from '../../../common/seed/bolivia-facilities.catalog';

const FOIANINI = 'aaaaaaaa-0000-0000-0000-000000000001';
const SAN_LUIS_TORNO = 'aaaaaaaa-0000-0000-0000-000000000002';
const SAN_LUIS_URUBICHA = 'aaaaaaaa-0000-0000-0000-000000000003';

/**
 * Arma el servicio con sus tres repositorios dobles.
 *
 * @returns El servicio y los dobles, para poder observar y programar.
 */
function build() {
  const valueSetsRepo = {
    findByInternalCode: mockFn(async () => ({ id: 'vs-1' })),
    findIncludedConceptIdsByValueSet: mockFn(async () => [
      FOIANINI,
      SAN_LUIS_TORNO,
      SAN_LUIS_URUBICHA,
    ]),
  };
  const conceptsRepo = { search: mockFn(async () => []) };
  const propertiesRepo = { findPropertyForConcepts: mockFn(async () => []) };
  const service = new LinkableOrganizationsService(
    {} as any,
    valueSetsRepo as any,
    conceptsRepo as any,
    propertiesRepo as any,
  );
  return { service, valueSetsRepo, conceptsRepo, propertiesRepo };
}

/** Programa las propiedades que devuelve el catálogo para cada código. */
function conPropiedades(
  d: ReturnType<typeof build>,
  porCodigo: Record<string, { conceptId: string; valueJson: unknown }[]>,
): void {
  d.propertiesRepo.findPropertyForConcepts.mockImplementation(
    async (_em: unknown, _ids: string[], propertyCode: string) =>
      porCodigo[propertyCode] ?? [],
  );
}

describe('LinkableOrganizationsService', () => {
  it('devuelve lista vacia si el padron no esta sembrado, sin fallar', async () => {
    // Un catálogo ausente deja al buscador sin nada que ofrecer, pero no es
    // culpa de quien busca: el formulario debe poder seguir por texto libre.
    const d = build();
    d.valueSetsRepo.findByInternalCode.mockResolvedValue(null);

    const salida = await d.service.buscar({ query: 'foianini' });

    expect(salida).toEqual({ items: [], count: 0, limit: 20 });
    expect(d.conceptsRepo.search).not.toHaveBeenCalled();
  });

  it('devuelve lista vacia si el conjunto no tiene version vigente', async () => {
    const d = build();
    d.valueSetsRepo.findIncludedConceptIdsByValueSet.mockResolvedValue(null);

    const salida = await d.service.buscar({});

    expect(salida.items).toEqual([]);
    expect(d.conceptsRepo.search).not.toHaveBeenCalled();
  });

  it('acota la busqueda a los miembros del padron', async () => {
    // Sin este filtro la búsqueda pegaría contra todo el catálogo de conceptos
    // y le ofrecería al médico géneros, estados y unidades como si fueran
    // hospitales.
    const d = build();

    await d.service.buscar({ query: 'clinica' });

    const [, filtros] = d.conceptsRepo.search.mock.calls[0];
    expect(filtros.ids).toEqual([FOIANINI, SAN_LUIS_TORNO, SAN_LUIS_URUBICHA]);
    expect(filtros.query).toBe('clinica');
  });

  it('acompaña cada resultado con municipio, tipo y direccion', async () => {
    // El municipio es lo que separa a los homónimos del padrón: sin él la lista
    // muestra cuatro «SAN LUIS» iguales.
    const d = build();
    d.conceptsRepo.search.mockResolvedValue([
      {
        id: FOIANINI,
        code: 'facility:bo:BO_EST_CLINICA_FOIANINI',
        display: 'CLINICA FOIANINI',
      },
    ]);
    conPropiedades(d, {
      [BO_FACILITY_PROPERTY_CODES.municipio]: [
        { conceptId: FOIANINI, valueJson: 'SANTA CRUZ DE LA SIERRA' },
      ],
      [BO_FACILITY_PROPERTY_CODES.tipo]: [
        { conceptId: FOIANINI, valueJson: 'CLINICA_PRIVADA' },
      ],
      [BO_FACILITY_PROPERTY_CODES.direccion]: [
        { conceptId: FOIANINI, valueJson: 'Av. Irala 468' },
      ],
    });

    const salida = await d.service.buscar({ query: 'foianini' });

    expect(salida.items[0]).toEqual({
      facilityConceptId: FOIANINI,
      code: 'BO_EST_CLINICA_FOIANINI',
      name: 'CLINICA FOIANINI',
      municipality: 'SANTA CRUZ DE LA SIERRA',
      type: 'CLINICA_PRIVADA',
      address: 'Av. Irala 468',
    });
    expect(salida.count).toBe(1);
  });

  it('deja el codigo del padron sin el prefijo de dominio', async () => {
    // El prefijo existe para que `BO_EST_…` no choque con otros catálogos, pero
    // lo que un humano puede cotejar contra el listado oficial es el código
    // pelado.
    const d = build();
    d.conceptsRepo.search.mockResolvedValue([
      {
        id: FOIANINI,
        code: 'facility:bo:BO_EST_CLINICA_FOIANINI',
        display: 'CLINICA FOIANINI',
      },
    ]);

    const salida = await d.service.buscar({});

    expect(salida.items[0].code).toBe('BO_EST_CLINICA_FOIANINI');
  });

  it('deja en null la propiedad que falta o no es texto', async () => {
    // `value_json` es jsonb y el tipo declarado es `unknown`: una fila que no
    // sea string no puede viajar como si lo fuera.
    const d = build();
    d.conceptsRepo.search.mockResolvedValue([
      { id: FOIANINI, code: 'facility:bo:X', display: 'X' },
    ]);
    conPropiedades(d, {
      [BO_FACILITY_PROPERTY_CODES.municipio]: [
        { conceptId: FOIANINI, valueJson: { es: 'no soy texto' } },
      ],
    });

    const salida = await d.service.buscar({});

    expect(salida.items[0].municipality).toBeNull();
    expect(salida.items[0].type).toBeNull();
    expect(salida.items[0].address).toBeNull();
  });

  it('filtra por municipio antes de buscar por texto', async () => {
    const d = build();
    conPropiedades(d, {
      [BO_FACILITY_PROPERTY_CODES.municipio]: [
        { conceptId: SAN_LUIS_TORNO, valueJson: 'EL TORNO' },
        { conceptId: SAN_LUIS_URUBICHA, valueJson: 'URUBICHA' },
      ],
    });

    await d.service.buscar({ query: 'san luis', municipality: 'el torno' });

    const [, filtros] = d.conceptsRepo.search.mock.calls[0];
    expect(filtros.ids).toEqual([SAN_LUIS_TORNO]);
  });

  it('no busca si el municipio pedido no tiene establecimientos', async () => {
    const d = build();
    conPropiedades(d, {
      [BO_FACILITY_PROPERTY_CODES.municipio]: [
        { conceptId: SAN_LUIS_TORNO, valueJson: 'EL TORNO' },
      ],
    });

    const salida = await d.service.buscar({ municipality: 'LA PAZ' });

    expect(salida.items).toEqual([]);
    expect(d.conceptsRepo.search).not.toHaveBeenCalled();
  });

  it('respeta el tope pedido y usa 20 por defecto', async () => {
    const d = build();

    await d.service.buscar({ limit: 5 });
    expect(d.conceptsRepo.search.mock.calls[0][2]).toBe(5);

    const otro = build();
    const salida = await otro.service.buscar({});
    expect(otro.conceptsRepo.search.mock.calls[0][2]).toBe(20);
    expect(salida.limit).toBe(20);
  });

  it('omite el filtro de texto cuando no se pide ninguno', async () => {
    // Sin `q` la lista es el padrón entero acotado por el tope: es lo que ve
    // quien abre el selector antes de escribir nada.
    const d = build();

    await d.service.buscar({});

    const [, filtros] = d.conceptsRepo.search.mock.calls[0];
    expect(filtros.query).toBeUndefined();
    expect('query' in filtros).toBe(false);
  });
});
