// Consultas de los repositorios que filtran u ordenan por columnas de una tabla.
//
// Sirve para decir «este índice lo puede usar tal consulta»: el prefijo del índice coincide con
// las claves del `where`. Es una candidatura estática (no hay plan de ejecución), por eso se
// rotula POR_PREFIJO_DE_FILTRO y no se presenta como uso confirmado.
import ts from 'typescript';

const METODOS = new Set([
  'find',
  'findOne',
  'findOneOrFail',
  'findAndCount',
  'count',
  'nativeUpdate',
  'nativeDelete',
  'findByCursor',
]);

/** Claves de primer nivel de un literal de objeto (sin los operadores `$or`, `$and`…). */
function claves(nodo) {
  if (!nodo || !ts.isObjectLiteralExpression(nodo)) return [];
  return nodo.properties
    .map((p) =>
      ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)
        ? p.name.getText()
        : null,
    )
    .filter(
      (k) =>
        k && !k.startsWith('$') && !k.startsWith('[') && !k.startsWith('...'),
    )
    .map((k) => k.replace(/^['"`]|['"`]$/g, ''));
}

/**
 * @returns {Map<string, {propiedades: string[], orden: string[], metodo: string, fuente: string}[]>} por clave de entidad (`archivo#Clase`)
 */
export function leerConsultas(index, datos) {
  const porEntidad = new Map();
  for (const info of index.classesPorClave.values()) {
    if (/\.(spec|test)\.ts$/.test(info.relative)) continue;
    const sf = info.sourceFile;
    const nombreClase = info.node.name?.text;
    for (const [nombreMetodo, metodo] of info.methods) {
      (function visitar(nodo) {
        if (
          ts.isCallExpression(nodo) &&
          ts.isPropertyAccessExpression(nodo.expression) &&
          METODOS.has(nodo.expression.name.text) &&
          nodo.arguments[0] &&
          ts.isIdentifier(nodo.arguments[0])
        ) {
          const destino = datos.resolverClase(nodo.arguments[0].text, info);
          if (destino?.clave && datos.entidades.has(destino.clave)) {
            const propiedades = claves(nodo.arguments[1]);
            const opciones = nodo.arguments.find(
              (a, i) => i >= 2 && ts.isObjectLiteralExpression(a),
            );
            let orden = [];
            if (opciones)
              for (const p of opciones.properties)
                if (
                  ts.isPropertyAssignment(p) &&
                  p.name.getText() === 'orderBy'
                )
                  orden = ts.isObjectLiteralExpression(p.initializer)
                    ? claves(p.initializer)
                    : (p.initializer.elements?.flatMap((e) => claves(e)) ?? []);
            if (propiedades.length || orden.length) {
              const linea =
                sf.getLineAndCharacterOfPosition(nodo.getStart()).line + 1;
              porEntidad.set(destino.clave, [
                ...(porEntidad.get(destino.clave) ?? []),
                {
                  propiedades,
                  orden,
                  metodo: `${nombreClase}.${nombreMetodo}`,
                  fuente: `${info.relative}:${linea}`,
                },
              ]);
            }
          }
        }
        ts.forEachChild(nodo, visitar);
      })(metodo);
    }
  }
  return porEntidad;
}
