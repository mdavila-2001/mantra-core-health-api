#!/usr/bin/env node
// Inventario de endpoints de la API (portal interno, H1).
//
//   node tools/inventario/endpoints.mjs --modulo scheduling,audit --solo-ast
//
// `--solo-ast` imprime la tabla handler → servicio.método y termina con código 1 si
// algún handler del contrato no se encuentra en el código.
import {
  buildHandlerTable,
  DELEGACION,
  resumenPorModulo,
} from './lib/handlers.mjs';

function argumentos(argv) {
  const opciones = { modulos: undefined, soloAst: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--solo-ast') opciones.soloAst = true;
    else if (arg === '--modulo' || arg === '--modulos')
      opciones.modulos = argv[++i]?.split(',').filter(Boolean);
    else throw new Error(`Argumento desconocido: ${arg}`);
  }
  return opciones;
}

function imprimirTabla({ filas, huerfanas }) {
  for (const fila of filas) {
    const destino = fila.servicios.length
      ? fila.servicios.join(', ')
      : fila.sinResolver.length
        ? `(sin resolver: ${fila.sinResolver.join(', ')})`
        : '(sin llamadas a servicios)';
    const roles = fila.publica ? 'PÚBLICA' : fila.roles.join('|') || '—';
    console.log(
      `${fila.metodo.padEnd(6)} ${fila.ruta}  [${roles}]\n` +
        `       ${fila.controlador ?? '??'}.${fila.handler ?? '??'} (${fila.fuente ?? 'NO ENCONTRADO'})\n` +
        `       → ${destino}`,
    );
  }
  console.log('\nResumen por módulo:');
  console.table(resumenPorModulo(filas));
  if (huerfanas.length) {
    console.log('Handlers sin operación en el contrato:');
    console.table(huerfanas);
  }
}

const opciones = argumentos(process.argv.slice(2));
const tabla = buildHandlerTable({ modulos: opciones.modulos });

if (opciones.soloAst) {
  imprimirTabla(tabla);
  const noEncontradas = tabla.filas.filter((fila) => !fila.encontrado);
  const noResueltas = tabla.filas.filter(
    (fila) => fila.delegacion === DELEGACION.NO_RESUELTA,
  );
  console.log(
    `Operaciones: ${tabla.filas.length} · no encontradas en el código: ${noEncontradas.length} · con delegación no resuelta: ${noResueltas.length}`,
  );
  process.exit(noEncontradas.length ? 1 : 0);
}

throw new Error(
  'Por ahora sólo está implementado --solo-ast (H1.S1.M2); el resto llega con H1.S2 y H1.S3.',
);
