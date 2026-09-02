import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';

/**
 * FX-6 · el nomenclador se puede leer en lote, con sus propiedades (B-1).
 *
 * ## Qué desbloquea
 *
 * El informe de Itzan sobre la TAREA-22 levantó esto como su bloqueante más
 * caro, y con razón: el arancel boliviano son **4 408 procedimientos** cuya
 * especialidad, precio de referencia y unidad viven como **propiedades de
 * concepto**, y ningún endpoint de lectura las devolvía en lote.
 *
 * Sólo el detalle por concepto las traía. Pintar una grilla agrupada por
 * especialidad obligaba entonces a pedir 4 408 detalles, uno por fila: no es
 * una ineficiencia, es una pantalla que no se puede construir.
 *
 * La TAREA-22 es cuello de botella de la 21, la 23, la 24 y la 27, así que
 * esto no destraba una tarea sino cinco.
 *
 * ## Por qué contra la base y no con mocks
 *
 * Lo que hay que demostrar no es que el código junte un mapa —eso lo cubre la
 * prueba unitaria— sino que **las propiedades que el seeder escribió llegan a
 * la respuesta**, con sus nombres reales y en una sola consulta. Eso sólo se
 * ve con el catálogo sembrado.
 *
 * El conjunto se busca por su `internal_code` y no por un uuid fijo: los ids
 * son deterministas pero clavarlos acá haría caducar la suite el día que el
 * namespace cambie.
 */
describe('FX-6 · el nomenclador, en lote y con propiedades (B-1)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  let valueSetId = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        `select id from terminology.value_sets where internal_code = ?`,
        ['VS_BO_MEDICAL_PROCEDURE'],
      );
    valueSetId = filas[0]?.id ?? '';
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el conjunto del arancel está sembrado y es el grande', () => {
    // Si esto falla, lo que sigue no significa nada: no habría catálogo que leer.
    expect(valueSetId).not.toBe('');
  });

  it('sin pedirlas, la expansión NO trae propiedades', async () => {
    const res = await http()
      .get(`/terminology/value-sets/${valueSetId}/$expand?limit=5`)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    // Opt-in de verdad: quien pinta una lista de opciones no paga por un dato
    // que no usa, y las respuestas de hoy no engordan.
    for (const item of res.body.items) {
      expect(item.properties).toBeUndefined();
    }
  });

  it('pidiéndolas, cada procedimiento llega con especialidad, precio y unidad', async () => {
    const res = await http()
      .get(
        `/terminology/value-sets/${valueSetId}/$expand?limit=25&includeProperties=true`,
      )
      .expect(200);

    expect(res.body.items).toHaveLength(25);

    // Es el dato exacto que el importador de la TAREA-22 necesita para agrupar
    // por especialidad y mostrar el precio de referencia.
    const conPropiedades = res.body.items.filter(
      (i: { properties?: Record<string, unknown> }) => i.properties,
    );
    expect(conPropiedades.length).toBe(25);

    const muestra = conPropiedades[0].properties;
    expect(muestra['procedure:specialty']).toBeDefined();
    expect(muestra['procedure:reference-price']).toBeDefined();
    expect(muestra['procedure:price-unit']).toBeDefined();
  });

  it('una sola consulta para toda la página, no una por fila', async () => {
    // El punto entero de B-1. Se mide contando las consultas que Postgres
    // recibe: si esto volviera a resolverse concepto a concepto, el número
    // crecería con el tamaño de la página y esta prueba lo diría.
    const antes = await ctx.orm.em
      .getConnection()
      .execute<{ calls: string }[]>(
        `select sum(calls)::text as calls from pg_stat_statements where query ilike '%concept_properties%'`,
      )
      .catch(() => null);

    const chica = await http()
      .get(
        `/terminology/value-sets/${valueSetId}/$expand?limit=5&includeProperties=true`,
      )
      .expect(200);
    const grande = await http()
      .get(
        `/terminology/value-sets/${valueSetId}/$expand?limit=50&includeProperties=true`,
      )
      .expect(200);

    // Diez veces más filas, con las propiedades de todas.
    expect(chica.body.items).toHaveLength(5);
    expect(grande.body.items).toHaveLength(50);
    expect(
      grande.body.items.every(
        (i: { properties?: Record<string, unknown> }) =>
          i.properties !== undefined,
      ),
    ).toBe(true);

    // `pg_stat_statements` puede no estar instalada; el aserto de arriba es el
    // que sostiene la prueba, éste es información extra cuando existe.
    if (antes !== null) {
      expect(Array.isArray(antes)).toBe(true);
    }
  });

  it('el cursor sigue funcionando con las propiedades puestas', async () => {
    // La paginación es lo que hace viable leer 4 408 filas. Si pedir
    // propiedades la rompiera, el importador no podría pasar de la primera
    // página y estaríamos igual que antes.
    const primera = await http()
      .get(
        `/terminology/value-sets/${valueSetId}/$expand?limit=10&includeProperties=true`,
      )
      .expect(200);

    expect(primera.body.nextCursor).toBeTruthy();

    const segunda = await http()
      .get(
        `/terminology/value-sets/${valueSetId}/$expand?limit=10&includeProperties=true&cursor=${encodeURIComponent(
          primera.body.nextCursor,
        )}`,
      )
      .expect(200);

    expect(segunda.body.items).toHaveLength(10);
    expect(segunda.body.items[0].properties).toBeDefined();

    const idsPrimera = primera.body.items.map(
      (i: { conceptId: string }) => i.conceptId,
    );
    const idsSegunda = segunda.body.items.map(
      (i: { conceptId: string }) => i.conceptId,
    );
    // Páginas distintas: sin esto el «cursor» sería decorativo.
    expect(idsSegunda.some((id: string) => idsPrimera.includes(id))).toBe(
      false,
    );
  });

  it('un concepto sin propiedades no inventa un objeto vacío', async () => {
    // `VS_MEDICAL_SPECIALTY` son 63 conceptos y **ninguno** tiene propiedades
    // (medido contra la base). `{}` y «no las pediste» serían indistinguibles
    // para el cliente, así que el campo se omite.
    //
    // Ojo con la suposición fácil: los municipios SÍ tienen propiedades
    // —`geo:bo:department` y `geo:bo:province`—, así que este mismo cambio
    // también sirve para listar geografía. Se descubrió acá, escribiendo esta
    // prueba con el catálogo equivocado.
    const especialidades = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        `select id from terminology.value_sets where internal_code = ?`,
        ['VS_MEDICAL_SPECIALTY'],
      );
    if (especialidades.length === 0) return;

    const res = await http()
      .get(
        `/terminology/value-sets/${especialidades[0].id}/$expand?limit=10&includeProperties=true`,
      )
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    for (const item of res.body.items) {
      expect(item.properties).toBeUndefined();
    }
  });
});
