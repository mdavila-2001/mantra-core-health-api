// Linaje: de qué operación a qué tabla se llega y qué tabla referencia a cuál.
// Sale del catálogo y del inventario de endpoints; no calcula nada propio.

const TIPO_DE_EFECTO = { LEE: 'LEE', ESCRIBE: 'ESCRIBE', BORRA: 'BORRA' };

export function construirLinaje({ tablas, endpoints }) {
  const nodos = [];
  const aristas = [];
  const dominios = new Map();
  for (const t of tablas) {
    const d = t.dominio?.dominio ?? `schema:${t.schema}`;
    if (!dominios.has(d))
      dominios.set(d, {
        id: `dominio:${d}`,
        tipo: 'DOMINIO',
        etiqueta:
          t.dominio?.dominio ?? `${t.schema} (sin dominio en el modelo)`,
      });
  }
  nodos.push(
    ...[...dominios.values()].sort((a, b) => a.id.localeCompare(b.id)),
  );
  const ids = new Set(tablas.map((t) => t.id));
  for (const t of tablas) {
    nodos.push({
      id: `tabla:${t.id}`,
      tipo: 'TABLA',
      etiqueta: t.id,
      dominio: t.dominio?.dominio ?? null,
    });
    aristas.push({
      de: `tabla:${t.id}`,
      a: `dominio:${t.dominio?.dominio ?? `schema:${t.schema}`}`,
      tipo: 'PERTENECE',
    });
  }
  let tablaATabla = 0;
  for (const t of tablas)
    for (const r of t.relaciones.salientes) {
      const destino = `${r.hacia.schema}.${r.hacia.tabla}`;
      if (!ids.has(destino)) continue;
      if (
        !aristas.some(
          (a) =>
            a.de === `tabla:${t.id}` &&
            a.a === `tabla:${destino}` &&
            a.tipo === 'REFERENCIA',
        )
      ) {
        aristas.push({
          de: `tabla:${t.id}`,
          a: `tabla:${destino}`,
          tipo: 'REFERENCIA',
        });
        tablaATabla += 1;
      }
    }
  let operacionATabla = 0;
  const vistas = new Set();
  for (const e of endpoints) {
    if (!e.tablas.length) continue;
    nodos.push({
      id: `op:${e.id}`,
      tipo: 'OPERACION',
      etiqueta: `${e.metodo} ${e.ruta}`,
      riesgo: e.riesgo.nivel,
    });
    for (const t of e.tablas) {
      const destino = `${t.schema}.${t.tabla}`;
      if (!ids.has(destino)) continue;
      const tipo =
        t.operacion === 'BORRA'
          ? 'BORRA'
          : t.operacion === 'ESCRIBE'
            ? 'ESCRIBE'
            : (TIPO_DE_EFECTO[t.operacion] ?? 'LEE');
      const k = `${e.id}|${destino}|${tipo}`;
      if (vistas.has(k)) continue;
      vistas.add(k);
      aristas.push({ de: `op:${e.id}`, a: `tabla:${destino}`, tipo });
      operacionATabla += 1;
    }
  }
  return {
    metricas: {
      dominios: dominios.size,
      rutas: nodos.filter((n) => n.tipo === 'OPERACION').length,
      tablas: tablas.length,
      tablasConPii: 'SIN_FUENTE',
      aristas: aristas.length,
      operacionATabla,
      tablaATabla,
    },
    nodos,
    aristas,
  };
}
