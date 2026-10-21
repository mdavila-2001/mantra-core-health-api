// Qué pruebas existentes mencionan cada operación.
//
//   INTEGRACION  una prueba bajo `test/` llama a la ruta con supertest
//                (`.post('/scheduling/slots/${id}/holds')`).
//   CONTROLADOR  un `*.controller.spec.ts` del mismo módulo llama al handler
//                (`controller.placeHold(…)`).
//
// Es una mención textual, no cobertura: que una prueba nombre la ruta no dice que
// ejercite todas sus ramas. Por eso el inventario habla de «pruebas que la mencionan».
import fs from 'node:fs';
import path from 'node:path';
import { normalizarRuta } from './documentos.mjs';

function archivos(dir, patron, acumulado = []) {
  if (!fs.existsSync(dir)) return acumulado;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) archivos(ruta, patron, acumulado);
    else if (patron.test(entrada.name)) acumulado.push(ruta);
  }
  return acumulado;
}

const LLAMADA = /\.(get|post|put|patch|delete)\(\s*(`[^`]*`|'[^']*'|"[^"]*")/gi;

/**
 * @returns {{
 *   integracion: Map<string, {archivo: string, linea: number}[]>,
 *   controladores: (clase: string, metodo: string, modulo: string) => {archivo: string, linea: number}[],
 * }}
 */
export function indexarPruebas(root = process.cwd()) {
  const integracion = new Map();
  for (const archivo of archivos(path.join(root, 'test'), /\.ts$/)) {
    const relativo = path.relative(root, archivo).replaceAll(path.sep, '/');
    const texto = fs.readFileSync(archivo, 'utf8');
    for (const coincidencia of texto.matchAll(LLAMADA)) {
      const ruta = coincidencia[2].slice(1, -1);
      if (!ruta.startsWith('/')) continue;
      const clave = `${coincidencia[1].toUpperCase()} ${normalizarRuta(ruta)}`;
      const linea = texto.slice(0, coincidencia.index).split('\n').length;
      const lista = integracion.get(clave) ?? [];
      if (!lista.some((item) => item.archivo === relativo))
        lista.push({ archivo: relativo, linea });
      integracion.set(clave, lista);
    }
  }

  const specs = archivos(
    path.join(root, 'src', 'modules'),
    /\.controller\.spec\.ts$/,
  ).map((archivo) => ({
    archivo: path.relative(root, archivo).replaceAll(path.sep, '/'),
    texto: fs.readFileSync(archivo, 'utf8'),
  }));
  const controladores = (clase, metodo, modulo) => {
    const encontrados = [];
    const llamada = new RegExp(`\\.${metodo}\\(`);
    for (const spec of specs) {
      if (!spec.archivo.startsWith(`src/modules/${modulo}/`)) continue;
      if (!spec.texto.includes(clase)) continue;
      const coincidencia = llamada.exec(spec.texto);
      if (coincidencia)
        encontrados.push({
          archivo: spec.archivo,
          linea: spec.texto.slice(0, coincidencia.index).split('\n').length,
        });
    }
    return encontrados;
  };
  return { integracion, controladores };
}

/** Pruebas que mencionan una operación, con su tipo. */
export function pruebasDe(pruebas, { metodo, ruta, clase, handler, modulo }) {
  return [
    ...(pruebas.integracion.get(`${metodo} ${normalizarRuta(ruta)}`) ?? []).map(
      (item) => ({ tipo: 'INTEGRACION', ...item }),
    ),
    ...(clase ? pruebas.controladores(clase, handler, modulo) : []).map(
      (item) => ({ tipo: 'CONTROLADOR', ...item }),
    ),
  ];
}
