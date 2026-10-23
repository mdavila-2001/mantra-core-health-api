// Árbol de decisión de una operación: qué comprueba, qué puede fallar y qué escribe,
// en el orden en que ocurre.
//
// Se lee del AST del handler y de los métodos que éste invoca (hasta cierta
// profundidad). Sólo se conserva lo que decide o hace algo observable: una rama
// `if` que no contiene errores, efectos, eventos ni llamadas se poda, porque no
// cambia lo que la operación hace al exterior.
//
// Tipos de nodo (`tipo`):
//   ACCESO      comprobación previa al código (token, rol, tenant, cuerpo, tasa): `falla`.
//   SI          rama por una condición: `entonces` / `sino`.
//   SEGUN       `switch`: `casos[{ valor, nodos }]`.
//   BUCLE       iteración: `cuerpo`.
//   INTENTAR    `try`: `cuerpo` / `captura` / `finalmente`.
//   TRANSACCION callback con cuerpo de bloque (`transactional(async tx => …)`): `hijos`.
//   LLAMADA     llamada a otro método del proyecto, con su contenido en `hijos`.
//   ERROR       `throw new X(…)` con su estado HTTP y código.
//   EFECTO      lectura/escritura de una tabla.
//   EVENTO      evento de dominio publicado.   TRABAJO  trabajo encolado.
//   RESPUESTA   fin feliz, con el código HTTP.
//   TRUNCADO    se alcanzó el tope de nodos; el resto no se muestra.
import ts from 'typescript';

const PROFUNDIDAD_MAXIMA = 4;
const TOPE_DE_NODOS = 500;
const ITERADORES = new Set([
  'forEach',
  'map',
  'filter',
  'reduce',
  'some',
  'every',
  'flatMap',
  'find',
]);

const compactar = (texto, maximo = 110) => {
  const una = texto.replace(/\s+/g, ' ').trim();
  return una.length > maximo ? `${una.slice(0, maximo - 1).trimEnd()}…` : una;
};

const ESTADOS_DE_EXITO = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
};

/** Estado HTTP de éxito: el de `@HttpCode(...)` si existe; si no, 201 para POST y 200 para el resto. */
export function estadoDeExito(httpCode, metodo) {
  if (httpCode) {
    const numero = Number(httpCode);
    if (Number.isInteger(numero)) return numero;
    const nombre = String(httpCode).replace(/^HttpStatus\./, '');
    if (ESTADOS_DE_EXITO[nombre]) return ESTADOS_DE_EXITO[nombre];
  }
  return metodo === 'POST' ? 201 : 200;
}

/** Texto legible de un mensaje de error: concatenaciones y plantillas se muestran con sus huecos. */
function mensajeDe(nodo, sf) {
  if (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo))
    return nodo.text;
  if (ts.isParenthesizedExpression(nodo)) return mensajeDe(nodo.expression, sf);
  if (
    ts.isBinaryExpression(nodo) &&
    nodo.operatorToken.kind === ts.SyntaxKind.PlusToken
  )
    return compactar(
      `${mensajeDe(nodo.left, sf)}${mensajeDe(nodo.right, sf)}`,
      160,
    );
  if (ts.isConditionalExpression(nodo))
    return compactar(
      `${mensajeDe(nodo.whenTrue, sf)} / ${mensajeDe(nodo.whenFalse, sf)}`,
      160,
    );
  if (ts.isTemplateExpression(nodo))
    return compactar(
      nodo.head.text +
        nodo.templateSpans
          .map(
            (t) =>
              `{${compactar(t.expression.getText(sf), 30)}}${t.literal.text}`,
          )
          .join(''),
      160,
    );
  return `{${compactar(nodo.getText(sf), 60)}}`;
}

const ACCESO = {
  AUTENTICACION: {
    corto: 'sesión',
    estado: 401,
    codigo: 'UNAUTHENTICATED',
    txt: 'Hay una sesión válida (JWT)',
  },
  ROL: {
    corto: 'rol',
    estado: 403,
    codigo: 'FORBIDDEN',
    txt: 'El rol está permitido',
  },
  IDENTIDAD_VERIFICADA: {
    corto: 'identidad verificada',
    estado: 403,
    codigo: 'IDENTITY_VERIFICATION_REQUIRED',
    txt: 'La identidad está verificada',
  },
  TENANT: {
    corto: 'tenant',
    estado: 403,
    codigo: 'FORBIDDEN',
    txt: 'El tenant se resuelve y pertenece al actor',
  },
  PARAMETRO_RUTA: {
    corto: 'parámetros de ruta',
    estado: 400,
    codigo: 'VALIDATION_FAILED',
    txt: 'Los parámetros de ruta son UUID válidos',
  },
  PARAMETRO_QUERY: {
    corto: 'parámetros de consulta',
    estado: 400,
    codigo: 'VALIDATION_FAILED',
    txt: 'Están los parámetros de consulta obligatorios',
  },
  VALIDACION: {
    corto: 'cuerpo válido',
    estado: 400,
    codigo: 'VALIDATION_FAILED',
    txt: 'El cuerpo cumple el DTO (sin propiedades extra)',
  },
  RATE_LIMIT: {
    corto: 'límite de tasa',
    estado: 429,
    codigo: 'RATE_LIMITED',
    txt: 'No se supera el límite de solicitudes',
  },
};

/**
 * @param {object} deps
 * @param {ReturnType<import('./ast.mjs').buildSourceIndex>} deps.index
 * @param {ReturnType<import('./datos.mjs').crearAnalizadorDeDatos>} deps.datos
 * @param {ReturnType<import('./excepciones.mjs').leerExcepciones>} deps.excepciones
 */
export function crearConstructorDeArboles({ index, datos, excepciones }) {
  const { classesPorClave } = index;

  function nodosDeMetodo(claveClase, nombreMetodo, ctx) {
    const info = classesPorClave.get(claveClase);
    const metodo = info?.methods.get(nombreMetodo);
    if (!metodo?.body) return [];
    const propio = datos.directo(claveClase, nombreMetodo);
    const sf = info.sourceFile;
    const lineaDe = (nodo) =>
      sf.getLineAndCharacterOfPosition(nodo.getStart()).line + 1;
    const finDe = (nodo) =>
      sf.getLineAndCharacterOfPosition(nodo.getEnd()).line + 1;
    const deEsteArchivo = (fuente) => fuente.startsWith(`${info.relative}:`);
    const numero = (fuente) =>
      Number(fuente.slice(fuente.lastIndexOf(':') + 1));

    function gastar() {
      ctx.restantes -= 1;
      return ctx.restantes >= 0;
    }

    function nodoDeError(sentencia) {
      const nuevo = sentencia.expression;
      if (!nuevo || !ts.isNewExpression(nuevo))
        return {
          tipo: 'ERROR',
          excepcion: '(relanza el error capturado)',
          estado: null,
          codigo: null,
          mensaje: null,
          f: `${info.relative}:${lineaDe(sentencia)}`,
        };
      const nombre = nuevo.expression.getText(sf).split('.').at(-1);
      const resuelta = excepciones.resolver(nombre, info.imports?.get(nombre));
      const primero = nuevo.arguments?.[0];
      const mensaje = primero ? mensajeDe(primero, sf) : null;
      // una excepción que no es HTTP la atiende el filtro global como 500 opaco
      const noHttp = resuelta.origen === 'DESCONOCIDO';
      return {
        tipo: 'ERROR',
        excepcion: nombre,
        estado: noHttp ? 500 : resuelta.estado,
        codigo: noHttp ? 'INTERNAL' : resuelta.codigo,
        ...(noHttp ? { sinTipar: true } : {}),
        mensaje,
        f: `${info.relative}:${lineaDe(sentencia)}`,
      };
    }

    /** Efectos, eventos, trabajos y llamadas que caen en [desde, hasta] y no en `excluidos`. */
    function nodosEnRango(desde, hasta, excluidos) {
      const dentro = (linea) =>
        linea >= desde &&
        linea <= hasta &&
        !excluidos.some(([a, b]) => linea >= a && linea <= b);
      const items = [];
      const vistos = new Set();
      for (const e of propio.efectos) {
        if (!deEsteArchivo(e.fuente) || !dentro(numero(e.fuente))) continue;
        const entidad = e.entidad ? datos.entidades.get(e.entidad) : null;
        const tabla = entidad ? `${entidad.schema}.${entidad.tabla}` : e.objeto;
        const clave = `${tabla}|${e.detalle}`;
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        items.push({
          linea: numero(e.fuente),
          orden: 1,
          nodo: {
            tipo: 'EFECTO',
            tabla,
            operacion: e.operacion,
            detalle: e.detalle,
            confianza: e.confianza,
            f: e.fuente,
          },
        });
      }
      for (const e of propio.eventos)
        if (deEsteArchivo(e.fuente) && dentro(numero(e.fuente)))
          items.push({
            linea: numero(e.fuente),
            orden: 2,
            nodo: {
              tipo: 'EVENTO',
              evento: e.tipo,
              expresion: e.expresion,
              f: e.fuente,
            },
          });
      for (const t of propio.trabajos)
        if (deEsteArchivo(t.fuente) && dentro(numero(t.fuente)))
          items.push({
            linea: numero(t.fuente),
            orden: 2,
            nodo: {
              tipo: 'TRABAJO',
              trabajo: t.codigo,
              expresion: t.expresion,
              f: t.fuente,
            },
          });
      for (const l of propio.llamadas) {
        if (!deEsteArchivo(l.fuente) || !dentro(numero(l.fuente))) continue;
        items.push({ linea: numero(l.fuente), orden: 0, llamada: l });
      }
      items.sort((a, b) => a.linea - b.linea || a.orden - b.orden);

      const nodos = [];
      for (const item of items) {
        if (item.nodo) {
          if (gastar()) nodos.push(item.nodo);
          continue;
        }
        const destino = classesPorClave.get(item.llamada.clave);
        if (
          !destino ||
          ctx.pila.has(`${item.llamada.clave}.${item.llamada.metodo}`) ||
          ctx.profundidad >= PROFUNDIDAD_MAXIMA
        )
          continue;
        ctx.pila.add(`${item.llamada.clave}.${item.llamada.metodo}`);
        ctx.profundidad += 1;
        const hijos = nodosDeMetodo(
          item.llamada.clave,
          item.llamada.metodo,
          ctx,
        );
        ctx.profundidad -= 1;
        ctx.pila.delete(`${item.llamada.clave}.${item.llamada.metodo}`);
        if (!hijos.length) continue;
        if (gastar())
          nodos.push({
            tipo: 'LLAMADA',
            destino: `${destino.node.name.text}.${item.llamada.metodo}`,
            puerto: item.llamada.puerto ?? null,
            f: item.llamada.fuente,
            hijos,
          });
      }
      return nodos;
    }

    /** Callbacks con cuerpo de bloque pasados como argumento: se procesan en línea. */
    function callbacksDe(nodo) {
      const encontrados = [];
      (function visitar(actual) {
        if (ts.isCallExpression(actual)) {
          const nombre = ts.isPropertyAccessExpression(actual.expression)
            ? actual.expression.name.text
            : ts.isIdentifier(actual.expression)
              ? actual.expression.text
              : '';
          for (const argumento of actual.arguments)
            if (
              (ts.isArrowFunction(argumento) ||
                ts.isFunctionExpression(argumento)) &&
              ts.isBlock(argumento.body)
            ) {
              encontrados.push({ cuerpo: argumento.body, llamada: nombre });
              return;
            }
        }
        ts.forEachChild(actual, visitar);
      })(nodo);
      // sólo los más externos
      return encontrados.filter(
        (a) =>
          !encontrados.some(
            (b) =>
              b !== a &&
              b.cuerpo.getStart() < a.cuerpo.getStart() &&
              b.cuerpo.getEnd() > a.cuerpo.getEnd(),
          ),
      );
    }

    function nodosDeSimple(sentencia) {
      const callbacks = callbacksDe(sentencia);
      const excluidos = callbacks.map((c) => [
        lineaDe(c.cuerpo),
        finDe(c.cuerpo),
      ]);
      const propios = nodosEnRango(
        lineaDe(sentencia),
        finDe(sentencia),
        excluidos,
      );
      const salida = [
        ...propios.map((nodo) => ({
          posicion: nodo.f ? numero(nodo.f) : lineaDe(sentencia),
          nodo,
        })),
      ];
      for (const callback of callbacks) {
        const hijos = nodosDeSentencias(callback.cuerpo.statements);
        if (!hijos.length) continue;
        const iterador = ITERADORES.has(callback.llamada);
        if (gastar())
          salida.push({
            posicion: lineaDe(callback.cuerpo),
            nodo: iterador
              ? {
                  tipo: 'BUCLE',
                  txt: `${callback.llamada}(…)`,
                  f: `${info.relative}:${lineaDe(callback.cuerpo)}`,
                  cuerpo: hijos,
                }
              : {
                  tipo: 'TRANSACCION',
                  txt: `${callback.llamada}(…)`,
                  f: `${info.relative}:${lineaDe(callback.cuerpo)}`,
                  hijos,
                },
          });
      }
      return salida.sort((a, b) => a.posicion - b.posicion).map((x) => x.nodo);
    }

    function nodosDeSentencias(sentencias) {
      const nodos = [];
      for (const s of sentencias) {
        if (ctx.restantes < 0) break;
        if (ts.isIfStatement(s)) {
          const antes = nodosEnRango(
            lineaDe(s.expression),
            finDe(s.expression),
            [],
          );
          const entonces = nodosDeSentencias(
            ts.isBlock(s.thenStatement)
              ? s.thenStatement.statements
              : [s.thenStatement],
          );
          const sino = s.elseStatement
            ? nodosDeSentencias(
                ts.isBlock(s.elseStatement)
                  ? s.elseStatement.statements
                  : [s.elseStatement],
              )
            : [];
          nodos.push(...antes);
          if ((entonces.length || sino.length) && gastar())
            nodos.push({
              tipo: 'SI',
              txt: compactar(s.expression.getText(sf)),
              f: `${info.relative}:${lineaDe(s)}`,
              entonces,
              sino,
            });
        } else if (ts.isSwitchStatement(s)) {
          const casos = [];
          for (const clausula of s.caseBlock.clauses) {
            const hijos = nodosDeSentencias(clausula.statements);
            if (hijos.length)
              casos.push({
                valor: ts.isCaseClause(clausula)
                  ? compactar(clausula.expression.getText(sf), 60)
                  : 'por defecto',
                nodos: hijos,
              });
          }
          if (casos.length && gastar())
            nodos.push({
              tipo: 'SEGUN',
              txt: compactar(s.expression.getText(sf)),
              f: `${info.relative}:${lineaDe(s)}`,
              casos,
            });
        } else if (ts.isThrowStatement(s)) {
          if (gastar()) nodos.push(nodoDeError(s));
        } else if (ts.isTryStatement(s)) {
          const cuerpo = nodosDeSentencias(s.tryBlock.statements);
          const captura = s.catchClause
            ? nodosDeSentencias(s.catchClause.block.statements)
            : [];
          const finalmente = s.finallyBlock
            ? nodosDeSentencias(s.finallyBlock.statements)
            : [];
          if (
            (cuerpo.length || captura.length || finalmente.length) &&
            gastar()
          )
            nodos.push({
              tipo: 'INTENTAR',
              f: `${info.relative}:${lineaDe(s)}`,
              cuerpo,
              captura,
              finalmente,
            });
        } else if (
          ts.isForStatement(s) ||
          ts.isForOfStatement(s) ||
          ts.isForInStatement(s) ||
          ts.isWhileStatement(s) ||
          ts.isDoStatement(s)
        ) {
          const cuerpoNodo = s.statement;
          const cuerpo = nodosDeSentencias(
            ts.isBlock(cuerpoNodo) ? cuerpoNodo.statements : [cuerpoNodo],
          );
          const cabecera =
            ts.isForOfStatement(s) || ts.isForInStatement(s)
              ? `por cada ${compactar(s.initializer.getText(sf), 40)} de ${compactar(s.expression.getText(sf), 50)}`
              : ts.isWhileStatement(s) || ts.isDoStatement(s)
                ? `mientras ${compactar(s.expression.getText(sf), 70)}`
                : 'ciclo for';
          if (cuerpo.length && gastar())
            nodos.push({
              tipo: 'BUCLE',
              txt: cabecera,
              f: `${info.relative}:${lineaDe(s)}`,
              cuerpo,
            });
        } else if (ts.isBlock(s)) {
          nodos.push(...nodosDeSentencias(s.statements));
        } else {
          nodos.push(...nodosDeSimple(s));
        }
      }
      if (ctx.restantes < 0 && !ctx.truncado) {
        ctx.truncado = true;
        nodos.push({
          tipo: 'TRUNCADO',
          txt: `Se alcanzó el tope de ${TOPE_DE_NODOS} nodos; el resto no se muestra.`,
        });
      }
      return nodos;
    }

    return nodosDeSentencias(metodo.body.statements);
  }

  /** Estados que puede devolver la operación, con su causa. */
  function respuestasPosibles(nodos, acumulado = new Map()) {
    const agregar = (estado, codigo, causa) => {
      const clave = `${estado ?? '?'}|${codigo ?? ''}`;
      acumulado.set(clave, {
        estado,
        codigo,
        causas: [...(acumulado.get(clave)?.causas ?? []), causa],
      });
    };
    for (const n of nodos) {
      if (n.tipo === 'ACCESO') agregar(n.falla.estado, n.falla.codigo, n.txt);
      else if (n.tipo === 'ERROR' && n.estado !== null)
        agregar(
          n.estado,
          n.codigo,
          n.mensaje ? `${n.excepcion}: ${n.mensaje}` : n.excepcion,
        );
      for (const clave of [
        'entonces',
        'sino',
        'cuerpo',
        'captura',
        'finalmente',
        'hijos',
      ])
        if (n[clave]) respuestasPosibles(n[clave], acumulado);
      if (n.casos)
        for (const caso of n.casos) respuestasPosibles(caso.nodos, acumulado);
    }
    return acumulado;
  }

  /**
   * @param {object} handler - Registro del handler (índice AST).
   * @param {{tipo: string, detalle: string, fuente: string}[]} requerimientos
   * @param {{ httpCode: string|null, metodo: string }} respuesta
   */
  function arbolDeOperacion(handler, requerimientos, { httpCode, metodo }) {
    const acceso = requerimientos
      .filter((r) => ACCESO[r.tipo])
      .map((r) => ({
        tipo: 'ACCESO',
        txt: ACCESO[r.tipo].txt,
        corto: ACCESO[r.tipo].corto,
        detalle: r.detalle,
        falla: { estado: ACCESO[r.tipo].estado, codigo: ACCESO[r.tipo].codigo },
        f: r.fuente,
      }));
    const ctx = {
      restantes: TOPE_DE_NODOS,
      profundidad: 0,
      pila: new Set(),
      truncado: false,
    };
    const claveControlador = `${handler.source}#${handler.className}`;
    ctx.pila.add(`${claveControlador}.${handler.methodName}`);
    const cuerpo = nodosDeMetodo(claveControlador, handler.methodName, ctx);
    const estadoOk = estadoDeExito(httpCode, metodo);
    const nodos = [
      ...acceso,
      ...cuerpo,
      {
        tipo: 'RESPUESTA',
        estado: estadoOk,
        txt: 'Responde con éxito',
        f: `${handler.source}:${handler.line}`,
      },
    ];
    const respuestas = [...respuestasPosibles(nodos).values()]
      .map((r) => ({
        estado: r.estado,
        codigo: r.codigo,
        causas: [...new Set(r.causas)],
      }))
      .concat([{ estado: estadoOk, codigo: null, causas: ['Éxito'] }])
      .sort((a, b) => (a.estado ?? 999) - (b.estado ?? 999));
    return { nodos, respuestas, truncado: ctx.truncado };
  }

  return { arbolDeOperacion, nodosDeMetodo, respuestasPosibles };
}

/** Cuenta los nodos de un árbol por tipo (para estadísticas y pruebas). */
export function contarNodos(nodos, cuenta = {}) {
  for (const n of nodos) {
    cuenta[n.tipo] = (cuenta[n.tipo] ?? 0) + 1;
    for (const clave of [
      'entonces',
      'sino',
      'cuerpo',
      'captura',
      'finalmente',
      'hijos',
    ])
      if (n[clave]) contarNodos(n[clave], cuenta);
    if (n.casos) for (const caso of n.casos) contarNodos(caso.nodos, cuenta);
  }
  return cuenta;
}
