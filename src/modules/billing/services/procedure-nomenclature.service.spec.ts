import { jest } from '@jest/globals';
import { encodeKeysetCursor } from '../../../common';
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
 * @param responses - Resultados en el orden en que se van a pedir.
 * @returns El doble y el registro de llamadas.
 */
function em(responses: unknown[][]) {
  const calls: { sql: string; params: unknown[] }[] = [];
  let i = 0;
  const execute = mockFn((sql: string, params: unknown[]) => {
    calls.push({ sql, params });
    return Promise.resolve(responses[i++] ?? []);
  });
  return {
    doble: { getConnection: () => ({ execute }) } as never,
    llamadas: calls,
  };
}

describe('ProcedureNomenclatureService', () => {
  describe('listSpecialties', () => {
    it('agrupa en la base y devuelve el recuento como número', async () => {
      const { doble: double, llamadas: calls } = em([
        [
          { especialidad: 'Cardiología', total: '98' },
          { especialidad: 'Cirugía General', total: '319' },
        ],
      ]);
      const service = new ProcedureNomenclatureService(double);

      const result = await service.listSpecialties();

      expect(result.items).toEqual([
        { specialty: 'Cardiología', count: 98 },
        { specialty: 'Cirugía General', count: 319 },
      ]);
      // El GROUP BY va en SQL: traer las 4408 entradas para contarlas en
      // memoria es exactamente lo que este endpoint existe para evitar.
      expect(calls[0].sql).toContain('GROUP BY');
      expect(calls[0].params).toEqual(['procedure:specialty']);
    });
  });

  describe('search', () => {
    it('pide una fila de más y no la devuelve', async () => {
      const rows = Array.from({ length: 3 }, (_, n) => ({
        id: `c${n}`,
        code: `procedure:bo:X${n}`,
        display: `Procedimiento ${n}`,
      }));
      const { doble: double, llamadas: calls } = em([rows, []]);
      const service = new ProcedureNomenclatureService(double);

      const page = await service.search({ limit: 2 });

      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).not.toBeNull();
      // La fila de sondeo responde «hay siguiente» sin pagar un COUNT.
      expect(calls[0].params.at(-1)).toBe(3);
    });

    it('no emite cursor en la última página', async () => {
      const { doble: double } = em([
        [{ id: 'c1', code: 'procedure:bo:A', display: 'Uno' }],
        [],
      ]);
      const service = new ProcedureNomenclatureService(double);

      const page = await service.search({ limit: 25 });

      expect(page.nextCursor).toBeNull();
    });

    it('filtra por especialidad contra la propiedad, no contra el código', async () => {
      const { doble: double, llamadas: calls } = em([[], []]);
      const service = new ProcedureNomenclatureService(double);

      await service.search({ specialty: 'Cardiología' });

      // El código del arancel no contiene la especialidad de forma fiable, así
      // que el filtro tiene que ir contra `concept_properties`.
      expect(calls[0].sql).toContain('concept_properties');
      // Se compara plegada (sin tildes ni mayúsculas) de ambos lados.
      expect(calls[0].params).toContain('cardiologia');
    });

    it('acepta varias especialidades separadas por | como alternativas (OR)', async () => {
      const { doble: double, llamadas: calls } = em([[], []]);
      const service = new ProcedureNomenclatureService(double);

      await service.search({ specialty: 'Cardiología | CIRUGÍA general |' });

      expect(calls[0].params).toEqual([
        'procedure:%',
        'procedure:specialty',
        'cardiologia',
        'cirugia general',
        26,
      ]);
      // Un solo EXISTS con IN: las alternativas son OR, no AND.
      expect(calls[0].sql).toMatch(/\) IN \(\?, \?\)/);
      expect(calls[0].sql.match(/EXISTS/g)).toHaveLength(1);
    });

    it('una especialidad sólo de separadores o espacios no filtra', async () => {
      const { doble: double, llamadas: calls } = em([[], []]);
      const service = new ProcedureNomenclatureService(double);

      await service.search({ specialty: ' | ' });

      expect(calls[0].sql).not.toContain('concept_properties');
    });

    it('compara la especialidad sin tildes ni mayúsculas en SQL', async () => {
      const { doble: double, llamadas: calls } = em([[], []]);
      const service = new ProcedureNomenclatureService(double);

      await service.search({ specialty: 'cirugia general' });

      expect(calls[0].sql).toContain("translate(lower(sp.value_json #>> '{}')");
      expect(calls[0].params).toContain('cirugia general');
    });

    describe('texto libre', () => {
      /** Parámetros del patrón (`%…%`) que recibió la consulta de la página. */
      const patterns = (params: unknown[]) =>
        params.filter(
          (p): p is string => typeof p === 'string' && p.startsWith('%'),
        );

      it('sin tildes ni mayúsculas, de ambos lados', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: 'CIRUGÍA' });

        // «cirugia» tiene que encontrar «Cirugía»: el término se pliega en JS
        // y la columna con translate(lower(...)).
        expect(patterns(calls[0].params)).toEqual([
          '%cirugia%',
          '%cirugia%',
          '%cirugia%',
        ]);
        expect(calls[0].sql).toContain('translate(lower(c.display), ');
        expect(calls[0].sql).not.toContain('ILIKE');
      });

      it('divide en palabras y exige todas (AND)', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: '  Biopsia   de  MAMA ' });

        // «biopsia mama» debe encontrar «Biopsia de mama»: dos grupos
        // (biopsia, mama) ligados con AND, más «de», que tiene 2 letras.
        const sql = calls[0].sql;
        expect(sql.match(/translate\(lower\(c\.display\)/g)).toHaveLength(3);
        expect([...new Set(patterns(calls[0].params))].sort()).toEqual([
          '%biopsia%',
          '%de%',
          '%mama%',
        ]);
      });

      it('cada palabra se busca en nombre, código, grupo y especialidad', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: 'cervical' });

        const { sql, params } = calls[0];
        expect(sql).toContain('translate(lower(c.display)');
        expect(sql).toContain('translate(lower(c.code)');
        expect(sql).toContain('concept_properties tp');
        expect(sql).toContain('tp.property_code IN (?, ?)');
        // Grupo y especialidad viajan como parámetros, no interpolados.
        expect(params).toContain('procedure:group');
        expect(params).toContain('procedure:specialty');
      });

      it('busca por código', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: 'procedure:bo:Cx-12' });

        expect(patterns(calls[0].params)[1]).toBe('%procedure:bo:cx-12%');
        expect(calls[0].sql).toContain('translate(lower(c.code)');
      });

      it('ignora palabras de un carácter si hay otras más largas', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: 'a biopsia y' });

        expect([...new Set(patterns(calls[0].params))]).toEqual(['%biopsia%']);
      });

      it('conserva la palabra de un carácter si es la única', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: ' x ' });

        expect([...new Set(patterns(calls[0].params))]).toEqual(['%x%']);
      });

      it('escapa %, _ y \\ para que se busquen literales', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: '50% a_b c\\d' });

        expect([...new Set(patterns(calls[0].params))].sort()).toEqual([
          '%50\\%%',
          '%a\\_b%',
          '%c\\\\d%',
        ]);
      });

      it('un texto vacío o de espacios no agrega filtros', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({ query: '   ' });

        expect(calls[0].sql).not.toContain('translate(');
        expect(calls[0].params).toEqual(['procedure:%', 26]);
      });

      it('acota la cantidad de palabras que arman el SQL', async () => {
        const { doble: double, llamadas: calls } = em([[], []]);
        const service = new ProcedureNomenclatureService(double);

        await service.search({
          query: Array.from({ length: 30 }, (_, n) => `pal${n}`).join(' '),
        });

        expect(
          calls[0].sql.match(/translate\(lower\(c\.display\)/g),
        ).toHaveLength(8);
      });

      it('combina texto, especialidad y cursor sin romper la paginación', async () => {
        const { doble: double, llamadas: calls } = em([
          [
            { id: 'c1', code: 'procedure:bo:B', display: 'Uno' },
            { id: 'c2', code: 'procedure:bo:C', display: 'Dos' },
          ],
          [],
        ]);
        const service = new ProcedureNomenclatureService(double);

        const page = await service.search({
          query: 'mama',
          specialty: 'Ginecología|Cirugía',
          cursor: encodeKeysetCursor({ code: 'procedure:bo:A' }),
          limit: 1,
        });

        expect(calls[0].sql).toContain('c.code > ?');
        expect(calls[0].params).toContain('procedure:bo:A');
        expect(calls[0].params.at(-1)).toBe(2);
        expect(calls[0].sql).toContain('ORDER BY c.code');
        expect(page.items).toHaveLength(1);
        expect(page.nextCursor).not.toBeNull();
      });
    });

    it('ordena por código, que es único, y no por nombre', async () => {
      const { doble: double, llamadas: calls } = em([[], []]);
      const service = new ProcedureNomenclatureService(double);

      await service.search({});

      // Hay decenas de procedimientos llamados «General»: un cursor sobre el
      // nombre dejaría filas fuera al paginar.
      expect(calls[0].sql).toContain('ORDER BY c.code');
    });

    it('resuelve las propiedades en una sola consulta para toda la página', async () => {
      const { doble: double, llamadas: calls } = em([
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
      const service = new ProcedureNomenclatureService(double);

      const page = await service.search({});

      // Dos consultas en total: la página y sus propiedades. Pedirlas concepto
      // por concepto sería el N+1 que este servicio existe para evitar.
      expect(calls).toHaveLength(2);
      expect(page.items[0].specialty).toBe('Cardiología');
      expect(page.items[0].referencePrice).toBe('150');
      expect(page.items[0].priceUnit).toBe('UMA');
      // Sin propiedad, ausencia y no cadena vacía.
      expect(page.items[1].referencePrice).toBeNull();
    });

    it('la marca de revisión ausente vale false, y presente vale true', async () => {
      const { doble: double } = em([
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
      const service = new ProcedureNomenclatureService(double);

      const page = await service.search({});

      // El catálogo escribe la marca **sólo** donde hay daño de reconocimiento
      // óptico: la ausencia es el «no», no un dato faltante.
      expect(page.items[0].ocrSuspect).toBe(false);
      expect(page.items[1].ocrSuspect).toBe(true);
    });

    it('no convierte la UMA a moneda', async () => {
      const { doble: double } = em([
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
      const service = new ProcedureNomenclatureService(double);

      const page = await service.search({});

      // La UMA es la unidad de cuenta del arancel, no una moneda, y su factor
      // de conversión no está declarado en ninguna parte del producto.
      expect(page.items[0].referencePrice).toBe('20');
      expect(page.items[0].priceUnit).toBe('UMA');
    });
  });
});
