import { jest } from '@jest/globals';
import { ProcedureNomenclatureService } from './procedure-nomenclature.service';

/** Mock sin tipar, como en el resto de los specs del módulo. */

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Doble del `EntityManager` que devuelve una respuesta distinta por consulta.
 *
 * Se guarda el SQL de cada llamada porque lo que hay que probar acá es
 * justamente **qué se le pide a la base**: el filtro por especialidad, el
 * `LIMIT` de una fila de más y el orden por código.
 *
 * @param respuestas - Resultados en el orden en que se van a pedir.
 * @returns El doble y el registro de llamadas.
 */
function em(respuestas: unknown[][]) {
  const llamadas: { sql: string; params: unknown[] }[] = [];
  let i = 0;
  const execute = mockFn((sql: string, params: unknown[]) => {
    llamadas.push({ sql, params });
    return Promise.resolve(respuestas[i++] ?? []);
  });
  return {
    doble: { getConnection: () => ({ execute }) } as never,
    llamadas,
  };
}

describe('ProcedureNomenclatureService', () => {
  describe('listSpecialties', () => {
    it('agrupa en la base y devuelve el recuento como número', async () => {
      const { doble, llamadas } = em([
        [
          { especialidad: 'Cardiología', total: '98' },
          { especialidad: 'Cirugía General', total: '319' },
        ],
      ]);
      const servicio = new ProcedureNomenclatureService(doble);

      const resultado = await servicio.listSpecialties();

      expect(resultado.items).toEqual([
        { specialty: 'Cardiología', count: 98 },
        { specialty: 'Cirugía General', count: 319 },
      ]);
      // El GROUP BY va en SQL: traer las 4408 entradas para contarlas en
      // memoria es exactamente lo que este endpoint existe para evitar.
      expect(llamadas[0].sql).toContain('GROUP BY');
      expect(llamadas[0].params).toEqual(['procedure:specialty']);
    });
  });

  describe('search', () => {
    it('pide una fila de más y no la devuelve', async () => {
      const filas = Array.from({ length: 3 }, (_, n) => ({
        id: `c${n}`,
        code: `procedure:bo:X${n}`,
        display: `Procedimiento ${n}`,
      }));
      const { doble, llamadas } = em([filas, []]);
      const servicio = new ProcedureNomenclatureService(doble);

      const pagina = await servicio.search({ limit: 2 });

      expect(pagina.items).toHaveLength(2);
      expect(pagina.nextCursor).not.toBeNull();
      // La fila de sondeo responde «hay siguiente» sin pagar un COUNT.
      expect(llamadas[0].params.at(-1)).toBe(3);
    });

    it('no emite cursor en la última página', async () => {
      const { doble } = em([
        [{ id: 'c1', code: 'procedure:bo:A', display: 'Uno' }],
        [],
      ]);
      const servicio = new ProcedureNomenclatureService(doble);

      const pagina = await servicio.search({ limit: 25 });

      expect(pagina.nextCursor).toBeNull();
    });

    it('filtra por especialidad contra la propiedad, no contra el código', async () => {
      const { doble, llamadas } = em([[], []]);
      const servicio = new ProcedureNomenclatureService(doble);

      await servicio.search({ specialty: 'Cardiología' });

      // El código del arancel no contiene la especialidad de forma fiable, así
      // que el filtro tiene que ir contra `concept_properties`.
      expect(llamadas[0].sql).toContain('concept_properties');
      expect(llamadas[0].params).toContain('Cardiología');
    });

    it('ordena por código, que es único, y no por nombre', async () => {
      const { doble, llamadas } = em([[], []]);
      const servicio = new ProcedureNomenclatureService(doble);

      await servicio.search({});

      // Hay decenas de procedimientos llamados «General»: un cursor sobre el
      // nombre dejaría filas fuera al paginar.
      expect(llamadas[0].sql).toContain('ORDER BY c.code');
    });

    it('resuelve las propiedades en una sola consulta para toda la página', async () => {
      const { doble, llamadas } = em([
        [
          { id: 'c1', code: 'procedure:bo:A', display: 'Uno' },
          { id: 'c2', code: 'procedure:bo:B', display: 'Dos' },
        ],
        [
          {
            concept_id: 'c1',
            property_code: 'procedure:specialty',
            valor: 'Cardiología',
          },
          {
            concept_id: 'c1',
            property_code: 'procedure:reference-price',
            valor: '150',
          },
          {
            concept_id: 'c1',
            property_code: 'procedure:price-unit',
            valor: 'UMA',
          },
          {
            concept_id: 'c2',
            property_code: 'procedure:specialty',
            valor: 'Pediatría',
          },
        ],
      ]);
      const servicio = new ProcedureNomenclatureService(doble);

      const pagina = await servicio.search({});

      // Dos consultas en total: la página y sus propiedades. Pedirlas concepto
      // por concepto sería el N+1 que este servicio existe para evitar.
      expect(llamadas).toHaveLength(2);
      expect(pagina.items[0].specialty).toBe('Cardiología');
      expect(pagina.items[0].referencePrice).toBe('150');
      expect(pagina.items[0].priceUnit).toBe('UMA');
      // Sin propiedad, ausencia y no cadena vacía.
      expect(pagina.items[1].referencePrice).toBeNull();
    });

    it('la marca de revisión ausente vale false, y presente vale true', async () => {
      const { doble } = em([
        [
          { id: 'c1', code: 'procedure:bo:A', display: 'Sano' },
          {
            id: 'c2',
            code: 'procedure:bo:B',
            display: 'Angioplastia por balén',
          },
        ],
        [
          {
            concept_id: 'c2',
            property_code: 'procedure:review-needed',
            valor: 'true',
          },
        ],
      ]);
      const servicio = new ProcedureNomenclatureService(doble);

      const pagina = await servicio.search({});

      // El catálogo escribe la marca **sólo** donde hay daño de reconocimiento
      // óptico: la ausencia es el «no», no un dato faltante.
      expect(pagina.items[0].ocrSuspect).toBe(false);
      expect(pagina.items[1].ocrSuspect).toBe(true);
    });

    it('no convierte la UMA a moneda', async () => {
      const { doble } = em([
        [{ id: 'c1', code: 'procedure:bo:A', display: 'Uno' }],
        [
          {
            concept_id: 'c1',
            property_code: 'procedure:reference-price',
            valor: '20',
          },
          {
            concept_id: 'c1',
            property_code: 'procedure:price-unit',
            valor: 'UMA',
          },
        ],
      ]);
      const servicio = new ProcedureNomenclatureService(doble);

      const pagina = await servicio.search({});

      // La UMA es la unidad de cuenta del arancel, no una moneda, y su factor
      // de conversión no está declarado en ninguna parte del producto.
      expect(pagina.items[0].referencePrice).toBe('20');
      expect(pagina.items[0].priceUnit).toBe('UMA');
    });
  });
});
