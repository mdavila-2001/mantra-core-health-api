// Grafo de cada proceso en JSON: el contrato que consume el componente de grafo del portal
// (`tools/inventario/schema/grafo.schema.json`). Es la misma información que el Mermaid de los
// documentos: etapas, operaciones, actores, tablas y eventos, con sus aristas.

const TIPO_DE_ARISTA = { LEE: 'LEE', ESCRIBE: 'ESCRIBE', BORRA: 'BORRA' };

export function grafoDeProceso(proceso) {
  const nodos = new Map();
  const aristas = [];
  const nodo = (id, datos) => {
    if (!nodos.has(id)) nodos.set(id, { id, ...datos });
    return id;
  };
  const arista = (de, a, tipo, etiqueta) => {
    if (
      aristas.some(
        (x) =>
          x.de === de &&
          x.a === a &&
          x.tipo === tipo &&
          x.etiqueta === etiqueta,
      )
    )
      return;
    aristas.push({ de, a, tipo, ...(etiqueta ? { etiqueta } : {}) });
  };

  let anterior = null;
  for (const etapa of proceso.etapas) {
    const e = nodo(`etapa:${etapa.codigo}`, {
      tipo: 'ETAPA',
      etiqueta: `${etapa.codigo} · ${etapa.nombre}`.slice(0, 200),
    });
    if (etapa.tipo === 'PRINCIPAL') {
      if (anterior) arista(anterior, e, 'SIGUE', 'luego');
      anterior = e;
    }
    for (const op of etapa.operaciones) {
      const o = nodo(`op:${op.operacionId}`, {
        tipo: 'OPERACION',
        etiqueta: `${op.metodo} ${op.ruta}`,
        operacionId: op.operacionId,
        riesgo: op.riesgo,
        etapa: etapa.codigo,
      });
      arista(e, o, 'CONTIENE');
      arista(
        nodo(`actor:${op.quienActua}`, {
          tipo: 'ACTOR',
          etiqueta: op.quienActua,
        }),
        o,
        'ACTUA',
      );
      for (const t of op.efectos.tablas)
        arista(
          o,
          nodo(`tabla:${t.tabla}`, { tipo: 'TABLA', etiqueta: t.tabla }),
          TIPO_DE_ARISTA[t.operacion] ??
            (t.operacion === 'ESCRIBE' ? 'ESCRIBE' : 'LEE'),
          t.detalle,
        );
      for (const ev of op.efectos.eventos)
        arista(
          o,
          nodo(`evento:${ev}`, { tipo: 'EVENTO', etiqueta: ev }),
          'PUBLICA',
        );
      for (const tr of op.efectos.trabajos)
        arista(
          o,
          nodo(`trabajo:${tr}`, { tipo: 'TRABAJO', etiqueta: tr }),
          'ENCOLA',
        );
    }
  }
  return {
    proceso: proceso.codigo,
    nombre: proceso.nombre,
    tipo: proceso.tipo,
    roles: [
      ...new Set(
        proceso.etapas.flatMap((x) => x.operaciones.map((o) => o.quienActua)),
      ),
    ].sort(),
    nodos: [...nodos.values()],
    aristas,
  };
}

/** Nombre de archivo seguro para un código de proceso (`critico:scheduling` → `critico-scheduling`). */
export const archivoDeGrafo = (codigo) =>
  `${codigo.replace(/[^A-Za-z0-9_.-]/g, '-')}.json`;
