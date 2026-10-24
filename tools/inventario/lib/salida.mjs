// Escritura (o verificación) de los archivos generados del inventario.
import fs from 'node:fs';
import path from 'node:path';

/** Un registro por línea: el archivo pesa menos y un cambio se ve como una línea en el diff. */
export function jsonPorLinea(lista) {
  return `[\n${lista.map((item) => `  ${JSON.stringify(item)}`).join(',\n')}\n]\n`;
}

export function escribir(archivo, contenido, { verificar, diferencias }) {
  if (verificar) {
    const actual = fs.existsSync(archivo)
      ? fs.readFileSync(archivo, 'utf8')
      : null;
    if (actual !== contenido) diferencias.push(archivo);
    return;
  }
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, contenido, 'utf8');
}

export function modeloRoot(root) {
  const ruta = process.env.MODEL_ROOT
    ? path.resolve(process.env.MODEL_ROOT)
    : path.resolve(root, '..', 'mantra-core-health-model');
  if (!fs.existsSync(path.join(ruta, 'Mantra Core Health Context')))
    throw new Error(
      `No se encuentra el repo del modelo en ${ruta}. Definí MODEL_ROOT con su ruta: sin él el inventario no puede citar el propósito ni el dominio de cada módulo.`,
    );
  return ruta;
}
