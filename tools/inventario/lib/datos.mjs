// Tablas que toca cada operación: handler → servicio → repositorio → entidad → tabla.
//
// Análisis estático sobre el AST de `src/`: no ejecuta nada. Por eso cada efecto
// declara con qué seguridad se obtuvo (`confianza`) y lo que no se pudo seguir sale
// en `noResuelto` en vez de omitirse:
//   DIRECTA  la entidad aparece como primer argumento (`em.find(Entidad, …)`).
//   POR_TIPO la entidad se dedujo del tipo de una variable (anotación, tipo de
//            retorno de la llamada que la produjo, `for…of`): p. ej. `slot.x = 1`
//            actualiza la tabla de `slot` aunque no haya un `em.update`.
//   POR_SQL  el nombre salió de un literal SQL (`FROM esquema.tabla`) y existe como
//            tabla de una entidad.
import path from 'node:path';
import ts from 'typescript';
import { decoratorInfo, getDecorators, literal } from './ast.mjs';

const LEE = new Set([
  'find',
  'findOne',
  'findOneOrFail',
  'findAll',
  'findAndCount',
  'findByCursor',
  'count',
]);
const CREA = new Set([
  'create',
  'upsert',
  'upsertMany',
  'insert',
  'insertMany',
  'nativeInsert',
]);
const ACTUALIZA_NATIVO = new Set(['nativeUpdate']);
const BORRA_NATIVO = new Set(['nativeDelete']);
const SOBRE_VARIABLE = {
  persist: 'GUARDA',
  persistAndFlush: 'GUARDA',
  assign: 'ACTUALIZA',
  remove: 'BORRA',
  removeAndFlush: 'BORRA',
};
const QUERY_BUILDER = new Set(['createQueryBuilder', 'qb']);
const NO_ENTIDADES = new Set([
  'Promise',
  'Array',
  'Record',
  'Map',
  'Set',
  'Partial',
  'Pick',
  'Omit',
  'Readonly',
  'Awaited',
  'Date',
  'String',
  'Number',
  'Boolean',
  'Object',
]);
const OPERACION = {
  LEE: 'LEE',
  CREA: 'ESCRIBE',
  GUARDA: 'ESCRIBE',
  ACTUALIZA: 'ESCRIBE',
  BORRA: 'BORRA',
};
const ORDEN_CONFIANZA = {
  DIRECTA: 3,
  POR_TIPO: 2,
  POR_REGISTRO: 2,
  POR_SQL: 1,
};
// La entidad depende de un argumento: `REGISTRO[clave].entity` (ver `enlaces`).
const DINAMICA = '~dinamica';
const PROFUNDIDAD_MAXIMA = 8;
const MAXIMO_IMPLEMENTACIONES = 6;

const SQL = new RegExp(
  '(INSERT\\s+INTO|DELETE\\s+FROM|UPDATE|FROM|JOIN)\\s+"?([a-z_][a-z0-9_]*)"?\\."?([a-z_][a-z0-9_]*)"?',
  'gi',
);

/** Primer elemento de cada clave (el camino más corto llega primero por orden de DFS). */
function unicos(lista, clave) {
  const vistos = new Map();
  for (const item of lista)
    if (
      !vistos.has(clave(item)) ||
      item.via.length < vistos.get(clave(item)).via.length
    )
      vistos.set(clave(item), item);
  return [...vistos.values()];
}

function quitarEnvoltorios(expresion) {
  let actual = expresion;
  while (
    ts.isAwaitExpression(actual) ||
    ts.isParenthesizedExpression(actual) ||
    ts.isNonNullExpression(actual) ||
    ts.isAsExpression(actual)
  )
    actual = actual.expression;
  return actual;
}

// Tipos que envuelven a una entidad sin ser una instancia suya: una variable
// `FilterQuery<Slot>` o `Partial<Slot>` describe un filtro o un parche, y asignarle
// propiedades no actualiza ninguna fila.
const ENVOLTORIOS_NO_INSTANCIA =
  /\b(FilterQuery|Partial|EntityData|RequiredEntityData|EntityDTO|FindOptions|Pick|Omit|Record|Dictionary|QueryOrderMap|FilterValue|ObjectQuery)\s*</;

function identificadoresDeTipo(texto) {
  return (texto?.match(/[A-Z][A-Za-z0-9_]*/g) ?? []).filter(
    (nombre) => !NO_ENTIDADES.has(nombre),
  );
}

/**
 * @param {ReturnType<import('./ast.mjs').buildSourceIndex>} index
 */
export function crearAnalizadorDeDatos(index) {
  const { classesPorClave, classesPorNombre } = index;

  // ---- entidades: clave `archivo#Clase` → tabla -------------------------------
  const entidades = new Map();
  const tablasConocidas = new Map();
  const esquemasConocidos = new Set();
  for (const [clave, info] of classesPorClave) {
    const decorador = getDecorators(info.node)
      .map((item) => decoratorInfo(item, info.sourceFile))
      .find((item) => item.name === 'Entity');
    if (!decorador) continue;
    const schema = decorador.args[0]?.match(/schema\s*:\s*['"`]([^'"`]+)/)?.[1];
    const tabla = decorador.args[0]?.match(
      /tableName\s*:\s*['"`]([^'"`]+)/,
    )?.[1];
    if (!schema || !tabla) continue;
    const entidad = {
      clave,
      clase: info.node.name.text,
      schema,
      tabla,
      relative: info.relative,
      modulo: info.relative.match(/^src\/modules\/([^/]+)\//)?.[1] ?? null,
    };
    entidades.set(clave, entidad);
    tablasConocidas.set(`${schema}.${tabla}`, entidad);
    esquemasConocidos.add(schema);
  }

  // ---- resolución de nombres de clase por imports -----------------------------
  function resolverClase(nombreLocal, llamador) {
    const nombre = llamador.importAlias?.get(nombreLocal) ?? nombreLocal;
    const candidatas = classesPorNombre.get(nombre) ?? [];
    if (!candidatas.length) return { externa: true };
    if (candidatas.length === 1) return { clave: candidatas[0] };

    const origen = llamador.imports?.get(nombreLocal);
    let acotadas = candidatas;
    if (origen?.startsWith('.')) {
      const base = path.posix.normalize(
        path.posix.join(path.posix.dirname(llamador.relative), origen),
      );
      const porImport = candidatas.filter((clave) => {
        const archivo = clave.split('#')[0].replace(/\.ts$/, '');
        return archivo === base || archivo.startsWith(`${base}/`);
      });
      if (porImport.length) acotadas = porImport;
    }
    if (acotadas.length > 1) {
      const modulo = llamador.relative.match(/^src\/modules\/([^/]+)\//)?.[1];
      const delModulo = acotadas.filter((clave) =>
        clave.startsWith(`src/modules/${modulo}/`),
      );
      if (delModulo.length) acotadas = delModulo;
    }
    return acotadas.length === 1
      ? { clave: acotadas[0] }
      : { ambigua: acotadas };
  }

  function entidadesDeTipo(texto, llamador) {
    if (texto && ENVOLTORIOS_NO_INSTANCIA.test(texto)) return [];
    const encontradas = [];
    for (const nombre of identificadoresDeTipo(texto)) {
      const resuelta = resolverClase(nombre, llamador);
      if (resuelta.clave && entidades.has(resuelta.clave))
        encontradas.push(resuelta.clave);
    }
    return encontradas;
  }

  // `const NOMBRE = …` a nivel de archivo, para resolver `${NOMBRE}` en el SQL y los
  // códigos de evento/trabajo. Entiende literales, plantillas con otras constantes,
  // concatenaciones y constantes importadas de otro archivo. Con `estricto`, una
  // sustitución que no se puede resolver hace que todo el valor sea `null`.
  const constantes = new Map();
  function resolverImportacion(sourceFile, nombre, profundidad) {
    if (profundidad > 3) return null;
    const relativo = [...index.archivos].find(
      ([, otro]) => otro === sourceFile,
    )?.[0];
    if (!relativo) return null;
    for (const sentencia of sourceFile.statements) {
      if (!ts.isImportDeclaration(sentencia) || !sentencia.importClause)
        continue;
      const enlaces = sentencia.importClause.namedBindings;
      const importado =
        enlaces &&
        ts.isNamedImports(enlaces) &&
        enlaces.elements.find((elemento) => elemento.name.text === nombre);
      if (!importado) continue;
      return buscarExportada(
        relativo,
        sentencia.moduleSpecifier.text,
        (importado.propertyName ?? importado.name).text,
        profundidad + 1,
      );
    }
    return null;
  }
  function buscarExportada(desdeRelativo, especificador, nombre, profundidad) {
    if (!especificador.startsWith('.') || profundidad > 4) return null;
    const base = path.posix.normalize(
      path.posix.join(path.posix.dirname(desdeRelativo), especificador),
    );
    for (const candidato of [`${base}.ts`, `${base}/index.ts`]) {
      const destino = index.archivos.get(candidato);
      if (!destino) continue;
      const propio = constantesDe(destino).porNombre(nombre, profundidad);
      if (propio !== null) return propio;
      for (const sentencia of destino.statements) {
        if (
          !ts.isExportDeclaration(sentencia) ||
          !sentencia.moduleSpecifier ||
          (sentencia.exportClause &&
            !(
              ts.isNamedExports(sentencia.exportClause) &&
              sentencia.exportClause.elements.some(
                (elemento) => elemento.name.text === nombre,
              )
            ))
        )
          continue;
        const reexportada = buscarExportada(
          candidato,
          sentencia.moduleSpecifier.text,
          nombre,
          profundidad + 1,
        );
        if (reexportada !== null) return reexportada;
      }
    }
    return null;
  }
  function constantesDe(sourceFile) {
    if (constantes.has(sourceFile)) return constantes.get(sourceFile);
    const iniciales = new Map();
    for (const sentencia of sourceFile.statements) {
      if (!ts.isVariableStatement(sentencia)) continue;
      for (const declaracion of sentencia.declarationList.declarations)
        if (ts.isIdentifier(declaracion.name) && declaracion.initializer)
          iniciales.set(declaracion.name.text, declaracion.initializer);
    }
    const evaluar = (expresion, vistos, estricto, profundidad = 0) => {
      const e = quitarEnvoltorios(expresion);
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e))
        return e.text;
      if (ts.isIdentifier(e)) {
        if (vistos.has(e.text)) return null;
        if (iniciales.has(e.text))
          return evaluar(
            iniciales.get(e.text),
            new Set(vistos).add(e.text),
            estricto,
            profundidad,
          );
        return resolverImportacion(sourceFile, e.text, profundidad);
      }
      if (ts.isTemplateExpression(e)) {
        let texto = e.head.text;
        for (const tramo of e.templateSpans) {
          const valor = evaluar(
            tramo.expression,
            vistos,
            estricto,
            profundidad,
          );
          if (valor === null && estricto) return null;
          texto += (valor ?? '?') + tramo.literal.text;
        }
        return texto;
      }
      if (
        ts.isBinaryExpression(e) &&
        e.operatorToken.kind === ts.SyntaxKind.PlusToken
      ) {
        const izquierda = evaluar(e.left, vistos, estricto, profundidad);
        const derecha = evaluar(e.right, vistos, estricto, profundidad);
        return izquierda !== null && derecha !== null
          ? izquierda + derecha
          : null;
      }
      return null;
    };
    const valores = {
      evaluar: (expresion, { estricto = false } = {}) =>
        evaluar(expresion, new Set(), estricto),
      porNombre: (nombre, profundidad = 0) =>
        iniciales.has(nombre)
          ? evaluar(iniciales.get(nombre), new Set([nombre]), true, profundidad)
          : null,
    };
    constantes.set(sourceFile, valores);
    return valores;
  }

  // ---- análisis directo de un método (sin seguir llamadas) --------------------
  const directos = new Map();

  function directo(claveClase, nombreMetodo) {
    const memo = `${claveClase}.${nombreMetodo}`;
    if (directos.has(memo)) return directos.get(memo);

    const info = classesPorClave.get(claveClase);
    const metodo = info?.methods.get(nombreMetodo);
    const resultado = {
      efectos: [],
      llamadas: [],
      noResuelto: [],
      eventos: [],
      trabajos: [],
      dinamicos: [],
    };
    directos.set(memo, resultado);
    if (!metodo) return resultado;

    const sf = info.sourceFile;
    const linea = (nodo) =>
      sf.getLineAndCharacterOfPosition(nodo.getStart()).line + 1;
    const entorno = new Map(); // variable → clave de entidad
    const enlaces = new Map(); // variable → { registro, indice } (REGISTRO[parámetro])
    const efecto = (entidad, detalle, confianza, nodo) => {
      if (entidad === DINAMICA) {
        const [enlace] = enlaces.values();
        if (!resultado.dinamicos.some((otro) => otro.detalle === detalle))
          resultado.dinamicos.push({ detalle, ...enlace });
        return;
      }
      resultado.efectos.push({
        entidad,
        operacion: OPERACION[detalle],
        detalle,
        confianza,
        fuente: `${info.relative}:${linea(nodo)}`,
      });
    };

    // `const REGISTRO = { clave: { entity: Clase, … } }` a nivel de archivo
    function leerRegistro(nombre) {
      for (const sentencia of sf.statements) {
        if (!ts.isVariableStatement(sentencia)) continue;
        for (const declaracion of sentencia.declarationList.declarations) {
          if (
            !ts.isIdentifier(declaracion.name) ||
            declaracion.name.text !== nombre ||
            !declaracion.initializer
          )
            continue;
          const objeto = quitarEnvoltorios(declaracion.initializer);
          if (!ts.isObjectLiteralExpression(objeto)) return null;
          const registro = new Map();
          for (const propiedad of objeto.properties) {
            if (
              !ts.isPropertyAssignment(propiedad) ||
              !ts.isObjectLiteralExpression(propiedad.initializer)
            )
              continue;
            const entidad = propiedad.initializer.properties.find(
              (campo) =>
                ts.isPropertyAssignment(campo) &&
                campo.name.getText(sf) === 'entity' &&
                ts.isIdentifier(campo.initializer),
            );
            const resuelta = entidad
              ? resolverClase(entidad.initializer.text, info)
              : null;
            if (resuelta?.clave && entidades.has(resuelta.clave))
              registro.set(
                propiedad.name.getText(sf).replace(/^['"`]|['"`]$/g, ''),
                resuelta.clave,
              );
          }
          return registro.size ? registro : null;
        }
      }
      return null;
    }
    const entidadDeIdentificador = (nodo) => {
      if (
        nodo &&
        ts.isPropertyAccessExpression(nodo) &&
        nodo.name.text === 'entity' &&
        ts.isIdentifier(nodo.expression) &&
        enlaces.has(nodo.expression.text)
      )
        return DINAMICA;
      if (!nodo || !ts.isIdentifier(nodo)) return null;
      const resuelta = resolverClase(nodo.text, info);
      return resuelta.clave && entidades.has(resuelta.clave)
        ? resuelta.clave
        : null;
    };

    function destinoDeLlamada(llamada) {
      const callee = llamada.expression;
      if (!ts.isPropertyAccessExpression(callee)) return null;
      const receptor = callee.expression;
      const nombre = callee.name.text;
      if (receptor.kind === ts.SyntaxKind.ThisKeyword)
        return { clave: claveClase, metodo: nombre, texto: `this.${nombre}` };
      if (
        ts.isPropertyAccessExpression(receptor) &&
        receptor.expression.kind === ts.SyntaxKind.ThisKeyword
      ) {
        const tipo = info.injected.get(receptor.name.text);
        if (!tipo) return null;
        const texto = `this.${receptor.name.text}.${nombre}`;
        const nombreClase = tipo.match(/[A-Z][A-Za-z0-9_]*/)?.[0];
        if (!nombreClase) return null;
        const resuelta = resolverClase(nombreClase, info);
        const esAbstracta =
          resuelta.clave &&
          classesPorClave
            .get(resuelta.clave)
            .node.modifiers?.some(
              (modificador) =>
                modificador.kind === ts.SyntaxKind.AbstractKeyword,
            );
        // un puerto (interface o clase abstracta) se sigue hasta su implementación
        if (resuelta.externa || esAbstracta) {
          const impls = (index.implementaciones.get(nombreClase) ?? []).filter(
            (clave) => clave !== resuelta.clave,
          );
          if (impls.length === 1)
            return { clave: impls[0], metodo: nombre, texto };
          if (impls.length > 1 && impls.length <= MAXIMO_IMPLEMENTACIONES)
            return {
              claves: impls,
              metodo: nombre,
              texto,
              puerto: nombreClase,
            };
          if (impls.length > MAXIMO_IMPLEMENTACIONES)
            return {
              noResuelto: `${texto} (puerto ${nombreClase} con ${impls.length} implementaciones)`,
              texto,
            };
          return resuelta.externa
            ? null
            : { clave: resuelta.clave, metodo: nombre, texto };
        }
        if (resuelta.ambigua)
          return {
            noResuelto: `${texto} (clase ${nombreClase} ambigua)`,
            texto,
          };
        return { clave: resuelta.clave, metodo: nombre, texto };
      }
      return null;
    }

    function tipoDeExpresion(expresion) {
      const e = quitarEnvoltorios(expresion);
      if (ts.isIdentifier(e)) return entorno.get(e.text) ?? null;
      if (ts.isNewExpression(e)) return entidadDeIdentificador(e.expression);
      if (
        ts.isCallExpression(e) &&
        ts.isPropertyAccessExpression(e.expression)
      ) {
        const nombre = e.expression.name.text;
        if (LEE.has(nombre) || CREA.has(nombre))
          return entidadDeIdentificador(e.arguments[0]);
        const destino = destinoDeLlamada(e);
        if (destino?.claves) destino.clave = destino.claves[0];
        if (destino?.clave) {
          const objetivo = classesPorClave
            .get(destino.clave)
            ?.methods.get(destino.metodo);
          const tipos = entidadesDeTipo(
            objetivo?.type?.getText(
              classesPorClave.get(destino.clave).sourceFile,
            ),
            classesPorClave.get(destino.clave),
          );
          return tipos[0] ?? null;
        }
      }
      return null;
    }

    for (const parametro of metodo.parameters) {
      if (!ts.isIdentifier(parametro.name) || !parametro.type) continue;
      const [entidad] = entidadesDeTipo(parametro.type.getText(sf), info);
      if (entidad) entorno.set(parametro.name.text, entidad);
    }

    function leerSql(texto, nodo) {
      for (const coincidencia of texto.matchAll(SQL)) {
        const esquema = coincidencia[2].toLowerCase();
        const nombre = coincidencia[3].toLowerCase();
        const entidad = tablasConocidas.get(`${esquema}.${nombre}`);
        const verbo = coincidencia[1].toUpperCase().replace(/\s+/g, ' ');
        const detalle = verbo.startsWith('INSERT')
          ? 'CREA'
          : verbo.startsWith('DELETE')
            ? 'BORRA'
            : verbo === 'UPDATE'
              ? 'ACTUALIZA'
              : 'LEE';
        if (entidad) efecto(entidad.clave, detalle, 'POR_SQL', nodo);
        else if (esquemasConocidos.has(esquema))
          // vista u objeto SQL que no es una entidad: se informa, no se descarta
          resultado.efectos.push({
            entidad: null,
            objeto: `${esquema}.${nombre}`,
            operacion: OPERACION[detalle],
            detalle,
            confianza: 'POR_SQL',
            fuente: `${info.relative}:${linea(nodo)}`,
          });
      }
    }

    function visitar(nodo) {
      if (ts.isVariableDeclaration(nodo)) {
        const acceso = nodo.initializer && quitarEnvoltorios(nodo.initializer);
        if (
          ts.isIdentifier(nodo.name) &&
          acceso &&
          ts.isElementAccessExpression(acceso) &&
          ts.isIdentifier(acceso.expression) &&
          ts.isIdentifier(acceso.argumentExpression)
        ) {
          const indice = metodo.parameters.findIndex(
            (parametro) =>
              ts.isIdentifier(parametro.name) &&
              parametro.name.text === acceso.argumentExpression.text,
          );
          const registro =
            indice >= 0 ? leerRegistro(acceso.expression.text) : null;
          if (registro) enlaces.set(nodo.name.text, { registro, indice });
        }
        if (ts.isIdentifier(nodo.name)) {
          const anotada = nodo.type
            ? entidadesDeTipo(nodo.type.getText(sf), info)[0]
            : null;
          const inferida = nodo.initializer
            ? tipoDeExpresion(nodo.initializer)
            : null;
          const entidad = anotada ?? inferida;
          if (entidad) entorno.set(nodo.name.text, entidad);
        } else if (ts.isArrayBindingPattern(nodo.name) && nodo.initializer) {
          const inicial = quitarEnvoltorios(nodo.initializer);
          if (
            ts.isCallExpression(inicial) &&
            ts.isPropertyAccessExpression(inicial.expression) &&
            inicial.expression.name.text === 'findAndCount'
          ) {
            const entidad = entidadDeIdentificador(inicial.arguments[0]);
            const primero = nodo.name.elements[0];
            if (
              entidad &&
              primero &&
              ts.isBindingElement(primero) &&
              ts.isIdentifier(primero.name)
            )
              entorno.set(primero.name.text, entidad);
          }
        }
      }

      if (ts.isForOfStatement(nodo)) {
        const declaracion = nodo.initializer;
        if (
          ts.isVariableDeclarationList(declaracion) &&
          ts.isIdentifier(declaracion.declarations[0]?.name)
        ) {
          const entidad = tipoDeExpresion(nodo.expression);
          if (entidad)
            entorno.set(declaracion.declarations[0].name.text, entidad);
        }
      }

      if (ts.isCallExpression(nodo)) {
        const callee = nodo.expression;
        const nombre = ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : ts.isIdentifier(callee)
            ? callee.text
            : null;

        if (ts.isPropertyAccessExpression(callee) && nombre) {
          const primero = nodo.arguments[0];
          const entidad = entidadDeIdentificador(primero);
          if (entidad && LEE.has(nombre))
            efecto(entidad, 'LEE', 'DIRECTA', nodo);
          else if (entidad && CREA.has(nombre))
            efecto(entidad, 'CREA', 'DIRECTA', nodo);
          else if (entidad && ACTUALIZA_NATIVO.has(nombre))
            efecto(entidad, 'ACTUALIZA', 'DIRECTA', nodo);
          else if (entidad && BORRA_NATIVO.has(nombre))
            efecto(entidad, 'BORRA', 'DIRECTA', nodo);
          else if (entidad && QUERY_BUILDER.has(nombre)) {
            const sentencia = nodo.parent?.parent?.parent?.getText(sf) ?? '';
            efecto(entidad, 'LEE', 'DIRECTA', nodo);
            if (/\.insert\(/.test(sentencia))
              efecto(entidad, 'CREA', 'DIRECTA', nodo);
            if (/\.update\(/.test(sentencia))
              efecto(entidad, 'ACTUALIZA', 'DIRECTA', nodo);
            if (/\.delete\(/.test(sentencia))
              efecto(entidad, 'BORRA', 'DIRECTA', nodo);
          } else if (
            SOBRE_VARIABLE[nombre] &&
            primero &&
            ts.isIdentifier(primero)
          ) {
            const deVariable = entorno.get(primero.text);
            if (deVariable)
              efecto(deVariable, SOBRE_VARIABLE[nombre], 'POR_TIPO', nodo);
          }
        }

        const valorDe = (expresion) => {
          const texto = expresion.getText(sf);
          const evaluado = constantesDe(sf).evaluar(expresion, {
            estricto: true,
          });
          return evaluado !== null
            ? { valor: evaluado, expresion: null }
            : { valor: null, expresion: texto };
        };
        if (nombre === 'publishDomainEvent') {
          // firma: publishDomainEvent(tx, { eventType, aggregateType, … })
          const objeto = nodo.arguments.find((argumento) =>
            ts.isObjectLiteralExpression(argumento),
          );
          const tipo = objeto?.properties.find(
            (propiedad) =>
              (ts.isPropertyAssignment(propiedad) ||
                ts.isShorthandPropertyAssignment(propiedad)) &&
              propiedad.name.getText(sf) === 'eventType',
          );
          const { valor, expresion } = tipo
            ? valorDe(
                ts.isPropertyAssignment(tipo) ? tipo.initializer : tipo.name,
              )
            : { valor: null, expresion: null };
          resultado.eventos.push({
            tipo: valor,
            expresion,
            fuente: `${info.relative}:${linea(nodo)}`,
          });
        }
        if (nombre === 'enqueueJob' && nodo.arguments[0]) {
          const { valor, expresion } = valorDe(nodo.arguments[0]);
          resultado.trabajos.push({
            codigo: valor,
            expresion,
            fuente: `${info.relative}:${linea(nodo)}`,
          });
        }

        const destino = destinoDeLlamada(nodo);
        if (destino?.noResuelto)
          resultado.noResuelto.push({
            llamada: destino.noResuelto,
            fuente: `${info.relative}:${linea(nodo)}`,
          });
        else if (destino?.claves)
          for (const clave of destino.claves)
            resultado.llamadas.push({
              clave,
              metodo: destino.metodo,
              texto: destino.texto,
              puerto: destino.puerto,
              fuente: `${info.relative}:${linea(nodo)}`,
            });
        else if (destino?.clave)
          resultado.llamadas.push({
            clave: destino.clave,
            metodo: destino.metodo,
            texto: destino.texto,
            fuente: `${info.relative}:${linea(nodo)}`,
          });

        if (destino?.clave) {
          // el destino elige la entidad según un argumento: se expande con el literal
          const dinamicos = directo(destino.clave, destino.metodo).dinamicos;
          let sinResolver = false;
          for (const dinamico of dinamicos) {
            const argumento = nodo.arguments[dinamico.indice];
            const valor = !argumento
              ? null
              : ts.isStringLiteral(argumento) ||
                  ts.isNoSubstitutionTemplateLiteral(argumento)
                ? argumento.text
                : constantesDe(sf).evaluar(argumento, { estricto: true });
            const clave = valor === null ? null : dinamico.registro.get(valor);
            if (clave) efecto(clave, dinamico.detalle, 'POR_REGISTRO', nodo);
            else sinResolver = true;
          }
          // un aviso por llamada, no uno por tipo de efecto
          if (sinResolver)
            resultado.noResuelto.push({
              llamada: `${destino.texto} (entidad según argumento no literal)`,
              fuente: `${info.relative}:${linea(nodo)}`,
            });
        }
      }

      // v.campo = valor · v.campo += … · v.campo++ · Object.assign(v, …)
      if (
        ts.isBinaryExpression(nodo) &&
        nodo.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        nodo.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
        ts.isPropertyAccessExpression(nodo.left)
      ) {
        let raiz = nodo.left.expression;
        while (ts.isPropertyAccessExpression(raiz)) raiz = raiz.expression;
        const entidad = ts.isIdentifier(raiz) ? entorno.get(raiz.text) : null;
        if (entidad) efecto(entidad, 'ACTUALIZA', 'POR_TIPO', nodo);
      }
      if (
        (ts.isPostfixUnaryExpression(nodo) ||
          ts.isPrefixUnaryExpression(nodo)) &&
        (nodo.operator === ts.SyntaxKind.PlusPlusToken ||
          nodo.operator === ts.SyntaxKind.MinusMinusToken) &&
        ts.isPropertyAccessExpression(nodo.operand) &&
        ts.isIdentifier(nodo.operand.expression)
      ) {
        const entidad = entorno.get(nodo.operand.expression.text);
        if (entidad) efecto(entidad, 'ACTUALIZA', 'POR_TIPO', nodo);
      }

      if (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo))
        leerSql(nodo.text, nodo);
      else if (ts.isTemplateExpression(nodo)) {
        const texto = constantesDe(sf).evaluar(nodo);
        if (texto) leerSql(texto, nodo);
      }

      ts.forEachChild(nodo, visitar);
    }
    visitar(metodo);
    return resultado;
  }

  // ---- cierre: todo lo alcanzable desde un método ------------------------------
  const cierres = new Map();

  function cierre(
    claveClase,
    nombreMetodo,
    enCurso = new Set(),
    profundidad = 0,
  ) {
    const memo = `${claveClase}.${nombreMetodo}`;
    if (cierres.has(memo)) return cierres.get(memo);
    if (enCurso.has(memo) || profundidad > PROFUNDIDAD_MAXIMA)
      return {
        efectos: [],
        eventos: [],
        trabajos: [],
        noResuelto: [],
        parcial: true,
      };

    const nombreClase = classesPorClave.get(claveClase)?.node.name.text;
    const paso = `${nombreClase}.${nombreMetodo}`;
    const propio = directo(claveClase, nombreMetodo);
    const salida = {
      efectos: propio.efectos.map((item) => ({ ...item, via: [paso] })),
      eventos: propio.eventos.map((item) => ({ ...item, via: [paso] })),
      trabajos: propio.trabajos.map((item) => ({ ...item, via: [paso] })),
      noResuelto: propio.noResuelto.map((item) => ({ ...item, via: [paso] })),
      parcial: false,
    };
    const siguiente = new Set(enCurso).add(memo);
    for (const llamada of propio.llamadas) {
      const hijo = cierre(
        llamada.clave,
        llamada.metodo,
        siguiente,
        profundidad + 1,
      );
      salida.parcial ||= hijo.parcial;
      for (const lista of ['efectos', 'eventos', 'trabajos', 'noResuelto'])
        for (const item of hijo[lista])
          salida[lista].push({ ...item, via: [paso, ...item.via] });
    }
    if (enCurso.size === 0 || !salida.parcial) cierres.set(memo, salida);
    return salida;
  }

  /**
   * Tablas, eventos y llamadas sin resolver alcanzables desde un handler.
   * @param {{ className: string, methodName: string, source: string }} handler
   */
  function deHandler(handler) {
    const claveControlador = `${handler.source}#${handler.className}`;
    const resultado = cierre(claveControlador, handler.methodName);

    const porClave = new Map();
    for (const item of resultado.efectos) {
      const entidad = item.entidad ? entidades.get(item.entidad) : null;
      const [esquema, nombre] = entidad
        ? [entidad.schema, entidad.tabla]
        : item.objeto.split('.');
      const clave = `${esquema}.${nombre}|${item.operacion}|${item.detalle}`;
      const previo = porClave.get(clave);
      const mejor =
        !previo ||
        ORDEN_CONFIANZA[item.confianza] > ORDEN_CONFIANZA[previo.confianza] ||
        (ORDEN_CONFIANZA[item.confianza] ===
          ORDEN_CONFIANZA[previo.confianza] &&
          item.via.length < previo.via.length);
      if (mejor)
        porClave.set(clave, {
          schema: esquema,
          tabla: nombre,
          entidad: entidad?.clase ?? null,
          catalogada: Boolean(entidad),
          operacion: item.operacion,
          detalle: item.detalle,
          confianza: item.confianza,
          via: item.via,
          fuente: item.fuente,
        });
    }
    const tablas = [...porClave.values()].sort(
      (a, b) =>
        `${a.schema}.${a.tabla}`.localeCompare(`${b.schema}.${b.tabla}`) ||
        a.operacion.localeCompare(b.operacion),
    );
    return {
      tablas,
      eventos: unicos(resultado.eventos, (e) => e.tipo ?? `~${e.expresion}`),
      trabajos: unicos(
        resultado.trabajos,
        (t) => t.codigo ?? `~${t.expresion}`,
      ),
      noResuelto: resultado.noResuelto,
      parcial: resultado.parcial,
    };
  }

  return {
    entidades,
    tablasConocidas,
    resolverClase,
    directo,
    cierre,
    deHandler,
  };
}
