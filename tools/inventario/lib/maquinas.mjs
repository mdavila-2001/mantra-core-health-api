// Máquinas de estado declaradas en el código: tablas `*_TRANSITIONS` del tipo
// `{ ESTADO: [DESTINOS] }` (objeto o `Map` de `Set`), y qué operaciones las ejercen.
//
// Lo que se afirma y lo que no:
//   - estados y aristas salen del literal de la tabla, sin interpretarlo. Los
//     nombres son los identificadores del código (`BOOKING_CONFIRMED`), no se
//     resuelven al catálogo de conceptos;
//   - «operación X dispara el estado Y» es POR_REFERENCIA: el handler alcanza un
//     método que valida contra la tabla y nombra ese estado. No se ejecuta nada.
//   - las listas planas (`['IN_PROGRESS', 'COMPLETED']`) no son un grafo y no se
//     toman como máquina.
import ts from 'typescript';

const NOMBRE = /TRANSITIONS?\b/i;
const PROFUNDIDAD = 8;

/** Último segmento de `A.B.C` o el identificador solo; null si no es un nombre simple. */
function etiqueta(expresion, sf) {
  if (ts.isComputedPropertyName(expresion))
    return etiqueta(expresion.expression, sf);
  if (ts.isPropertyAccessExpression(expresion)) return expresion.name.text;
  if (ts.isIdentifier(expresion)) return expresion.text;
  if (ts.isStringLiteralLike(expresion)) return expresion.text;
  return null;
}

/** Destinos de un valor: `[A, B]`, `new Set([A, B])` o `[A, B] as const`. null si no tiene esa forma. */
function destinosDe(valor, sf) {
  let nodo = valor;
  while (
    ts.isAsExpression(nodo) ||
    ts.isParenthesizedExpression(nodo) ||
    ts.isSatisfiesExpression?.(nodo)
  )
    nodo = nodo.expression;
  if (
    ts.isNewExpression(nodo) &&
    nodo.expression.getText(sf) === 'Set' &&
    nodo.arguments?.[0]
  )
    nodo = nodo.arguments[0];
  while (ts.isAsExpression(nodo) || ts.isParenthesizedExpression(nodo))
    nodo = nodo.expression;
  if (!ts.isArrayLiteralExpression(nodo)) return null;
  const destinos = nodo.elements.map((e) => etiqueta(e, sf));
  return destinos.every(Boolean) ? destinos : null;
}

function aristasDeInicializador(inicializador, sf) {
  let nodo = inicializador;
  while (ts.isAsExpression(nodo) || ts.isParenthesizedExpression(nodo))
    nodo = nodo.expression;
  const pares = [];
  if (ts.isObjectLiteralExpression(nodo)) {
    for (const propiedad of nodo.properties) {
      if (!ts.isPropertyAssignment(propiedad)) return null;
      const de = etiqueta(propiedad.name, sf);
      const destinos = destinosDe(propiedad.initializer, sf);
      if (!de || !destinos) return null;
      pares.push([de, destinos]);
    }
    return pares;
  }
  // new Map([[K, new Set([...])], …])
  if (
    ts.isNewExpression(nodo) &&
    nodo.expression.getText(sf) === 'Map' &&
    nodo.arguments?.[0] &&
    ts.isArrayLiteralExpression(nodo.arguments[0])
  ) {
    for (const par of nodo.arguments[0].elements) {
      if (!ts.isArrayLiteralExpression(par) || par.elements.length !== 2)
        return null;
      const de = etiqueta(par.elements[0], sf);
      const destinos = destinosDe(par.elements[1], sf);
      if (!de || !destinos) return null;
      pares.push([de, destinos]);
    }
    return pares;
  }
  return null;
}

/**
 * @param {ReturnType<import('./ast.mjs').buildSourceIndex>} index
 * @returns {{ codigo: string, constante: string, modulo: string|null, fuente: string, estados: string[], transiciones: {de: string, a: string}[], terminales: string[], iniciales: string[] }[]}
 */
export function leerMaquinas(index) {
  const maquinas = [];
  for (const [relative, sf] of index.archivos) {
    if (/\.(spec|test)\.ts$/.test(relative) || !relative.startsWith('src/'))
      continue;
    for (const sentencia of sf.statements) {
      if (!ts.isVariableStatement(sentencia)) continue;
      for (const declaracion of sentencia.declarationList.declarations) {
        if (
          !ts.isIdentifier(declaracion.name) ||
          !NOMBRE.test(declaracion.name.text) ||
          !declaracion.initializer
        )
          continue;
        const pares = aristasDeInicializador(declaracion.initializer, sf);
        if (!pares || pares.length < 2) continue;
        const estados = [
          ...new Set(pares.flatMap(([de, destinos]) => [de, ...destinos])),
        ];
        const transiciones = pares.flatMap(([de, destinos]) =>
          destinos.map((a) => ({ de, a })),
        );
        const conSalida = new Set(transiciones.map((t) => t.de));
        const conEntrada = new Set(transiciones.map((t) => t.a));
        const linea =
          sf.getLineAndCharacterOfPosition(declaracion.getStart()).line + 1;
        const modulo = relative.match(/^src\/modules\/([^/]+)\//)?.[1] ?? null;
        maquinas.push({
          codigo: `${modulo ?? 'comun'}.${declaracion.name.text}`,
          constante: declaracion.name.text,
          modulo,
          archivo: relative,
          fuente: `${relative}:${linea}`,
          estados,
          transiciones,
          terminales: estados.filter((e) => !conSalida.has(e)),
          iniciales: estados.filter((e) => !conEntrada.has(e)),
        });
      }
    }
  }
  return maquinas.sort((a, b) => a.codigo.localeCompare(b.codigo));
}

const sinPruebas = (relative) => !/\.(spec|test)\.ts$/.test(relative);

/**
 * Métodos que consultan la tabla (directamente o por una función/método intermedio) y los
 * estados que nombran. Devuelve un mapa `claveClase.metodo → Set<estado>`.
 */
function usuariosDe(maquina, index) {
  const estados = new Set(maquina.estados);
  const sfMaquina = index.archivos.get(maquina.archivo);
  // funciones del archivo de la tabla que la mencionan (p. ej. `isValidBookingTransition`)
  const ayudantes = new Set();
  for (const sentencia of sfMaquina.statements)
    if (
      ts.isFunctionDeclaration(sentencia) &&
      sentencia.name &&
      sentencia.getText(sfMaquina).includes(maquina.constante)
    )
      ayudantes.add(sentencia.name.text);

  const menciona = (texto, nombres) =>
    [...nombres].some((n) => new RegExp(`\\b${n}\\b`).test(texto));
  const base = new Set([maquina.constante, ...ayudantes]);
  const usuarios = new Map();
  const validadores = new Map(); // clase → nombres de método que consultan la tabla

  for (const [clave, info] of index.classesPorClave) {
    if (!sinPruebas(info.relative)) continue;
    for (const [nombre, metodo] of info.methods) {
      const texto = metodo.getText(info.sourceFile);
      if (!menciona(texto, base)) continue;
      validadores.set(clave, [...(validadores.get(clave) ?? []), nombre]);
    }
  }
  // clase → métodos que consultan la tabla: sirve para reconocer al que llama al validador
  // de OTRA clase por una dependencia inyectada (`this.transitions.assertTransition(…)`),
  // que es como los casos de uso de la cita usan `BookingTransitionRecorder`.
  const validadoresPorClase = new Map();
  for (const [clave, nombres] of validadores) {
    const clase = index.classesPorClave.get(clave)?.node.name?.text;
    if (clase) validadoresPorClase.set(clase, new Set(nombres));
  }
  for (const [clave, info] of index.classesPorClave) {
    if (!sinPruebas(info.relative)) continue;
    const propios = new Set(validadores.get(clave) ?? []);
    for (const [nombre, metodo] of info.methods) {
      const texto = metodo.getText(info.sourceFile);
      const llamaAlValidadorAjeno = [
        ...texto.matchAll(/this\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\(/g),
      ].some(([, propiedad, llamado]) =>
        validadoresPorClase.get(info.injected?.get(propiedad))?.has(llamado),
      );
      const llamaAValidador =
        llamaAlValidadorAjeno ||
        [...propios].some((v) => new RegExp(`this\\.${v}\\(`).test(texto));
      if (!llamaAValidador && !propios.has(nombre)) continue;
      const nombrados = new Set();
      (function visitar(nodo) {
        let candidato = null;
        if (ts.isPropertyAccessExpression(nodo)) candidato = nodo.name.text;
        else if (ts.isIdentifier(nodo) || ts.isStringLiteralLike(nodo))
          candidato = nodo.text;
        if (candidato && estados.has(candidato)) nombrados.add(candidato);
        ts.forEachChild(nodo, visitar);
      })(metodo);
      usuarios.set(`${clave}.${nombre}`, nombrados);
    }
  }
  return usuarios;
}

/**
 * Operaciones que ejercen la máquina: handlers desde los que se alcanza un método que
 * valida contra la tabla y nombra estados de ella.
 * @returns {Map<string, { estados: Set<string>, via: string[] }>} clave de handler → estados que nombra
 */
export function disparadoresDe(maquina, index, datos) {
  const usuarios = usuariosDe(maquina, index);
  const resultado = new Map();
  if (!usuarios.size) return resultado;
  for (const [claveHandler, handler] of index.controllerMethods) {
    const claveControlador = `${handler.source}#${handler.className}`;
    const visitados = new Set();
    const estados = new Set();
    const via = [];
    (function recorrer(clave, metodo, camino, profundidad) {
      const marca = `${clave}.${metodo}`;
      if (visitados.has(marca) || profundidad > PROFUNDIDAD) return;
      visitados.add(marca);
      if (usuarios.has(marca)) {
        for (const e of usuarios.get(marca)) estados.add(e);
        via.push(
          `${index.classesPorClave.get(clave)?.node.name.text}.${metodo}`,
        );
      }
      for (const llamada of datos.directo(clave, metodo).llamadas)
        recorrer(llamada.clave, llamada.metodo, camino, profundidad + 1);
    })(claveControlador, handler.methodName, [], 0);
    if (via.length)
      resultado.set(claveHandler, { estados, via: [...new Set(via)] });
  }
  return resultado;
}
