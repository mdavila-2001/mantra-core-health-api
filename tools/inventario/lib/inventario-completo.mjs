// Inventario completo: endpoints + árboles de decisión + procesos + máquinas de estado.
// Un solo recorrido del código; los CLI (`endpoints.mjs`, `flujos.mjs`) sólo escriben.
import path from 'node:path';
import { crearConstructorDeArboles } from './arbol.mjs';
import { leerExcepciones } from './excepciones.mjs';
import { rutaDelModelo } from './salida.mjs';
import {
  construirProcesos,
  leerFlujosCriticos,
  leerReadmes,
} from './flujos.mjs';
import { construirInventarioDeEndpoints } from './inventario-endpoints.mjs';
import { leerOperacionesDelFront } from './frontend.mjs';
import { disparadoresDe, leerMaquinas } from './maquinas.mjs';
import { construirMapa } from './mapa.mjs';

/**
 * @param {object} [opciones]
 * @param {string} [opciones.root]
 * @param {string} [opciones.modelRoot]
 * @param {string} [opciones.frontRoot] - Repo del frontend (FRONT_ROOT); si no está, el cruce queda «sin dato».
 */
export function construirInventarioCompleto({
  root = process.cwd(),
  modelRoot = rutaDelModelo(root),
  frontRoot = process.env.FRONT_ROOT
    ? path.resolve(process.env.FRONT_ROOT)
    : path.resolve(root, '..', 'mantra-core-health'),
} = {}) {
  const base = construirInventarioDeEndpoints({ root, modelRoot });
  const { endpoints, index, datos, numeros, propositos } = base;

  // ---- árboles de decisión por operación
  const excepciones = leerExcepciones(index);
  const { arbolDeOperacion } = crearConstructorDeArboles({
    index,
    datos,
    excepciones,
  });
  const arboles = new Map();
  for (const e of endpoints) {
    const handler = e.codigo
      ? index.controllerMethods.get(
          `${e.codigo.controlador}_${e.codigo.handler}`,
        )
      : null;
    if (!handler) {
      arboles.set(e.id, { nodos: [], respuestas: [], truncado: false });
      continue;
    }
    arboles.set(
      e.id,
      arbolDeOperacion(handler, e.requerimientos, {
        httpCode: e.httpCode,
        metodo: e.metodo,
      }),
    );
    e.respuestasPosibles = arboles.get(e.id).respuestas;
  }
  for (const e of endpoints) e.respuestasPosibles ??= [];

  // ---- máquinas de estado
  const maquinasBase = leerMaquinas(index);
  const disparadores = new Map(
    maquinasBase.map((m) => [m.codigo, disparadoresDe(m, index, datos)]),
  );

  // ---- procesos
  const propositosPorModulo = new Map();
  for (const [modulo, numero] of numeros)
    if (propositos.get(numero))
      propositosPorModulo.set(modulo, propositos.get(numero));
  const { procesos, maquinas, flujosPorOperacion, sinResolver } =
    construirProcesos({
      endpoints,
      readmes: leerReadmes(root),
      criticos: leerFlujosCriticos(root),
      maquinas: maquinasBase,
      disparadores,
      propositos: propositosPorModulo,
    });
  for (const e of endpoints) e.flujos = flujosPorOperacion.get(e.id) ?? [];

  // ---- mapa y hallazgos (cruce con el frontend si su repo está disponible)
  const front = leerOperacionesDelFront(frontRoot);
  const mapa = construirMapa({ endpoints, arboles, procesos, maquinas, front });

  return { ...base, arboles, procesos, maquinas, sinResolver, mapa, front };
}
