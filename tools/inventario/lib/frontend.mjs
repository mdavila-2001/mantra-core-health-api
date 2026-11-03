// Operaciones HTTP que declara el frontend en sus clientes (`*.client.ts`), según el inventario
// generado por el propio frontend (`docs/reports/generated/api-inventory.md`).
// Es una fuente de otro repo: se cita, no se reinterpreta. Si no está, el cruce queda «sin dato».
import fs from 'node:fs';
import path from 'node:path';
import { normalizarRuta } from './documentos.mjs';

export const INVENTARIO_FRONT = 'docs/reports/generated/api-inventory.md';

/** @returns {{ disponible: boolean, fuente: string, operaciones: {cliente: string, archivo: string, metodo: string, ruta: string, clave: string}[] }} */
export function leerOperacionesDelFront(frontRoot) {
  const archivo = path.join(frontRoot, INVENTARIO_FRONT);
  if (!fs.existsSync(archivo))
    return { disponible: false, fuente: INVENTARIO_FRONT, operaciones: [] };
  const operaciones = [];
  let cliente = null;
  let origen = null;
  for (const linea of fs.readFileSync(archivo, 'utf8').split('\n')) {
    const h = linea.match(/^##\s+`([^`]+)`/);
    if (h) {
      cliente = h[1];
      origen = null;
      continue;
    }
    const a = linea.match(/^Archivo:\s+`([^`]+)`/);
    if (a) {
      origen = a[1];
      continue;
    }
    const fila = linea.match(
      /^\|\s*`(GET|POST|PUT|PATCH|DELETE)`\s*\|\s*`([^`]+)`\s*\|/,
    );
    if (fila && cliente)
      operaciones.push({
        cliente,
        archivo: origen,
        metodo: fila[1],
        ruta: fila[2],
        clave: `${fila[1]} ${normalizarRuta(fila[2])}`,
      });
  }
  return { disponible: true, fuente: INVENTARIO_FRONT, operaciones };
}
