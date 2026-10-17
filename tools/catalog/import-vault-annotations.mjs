#!/usr/bin/env node
// Importa al catálogo de datos (M67) lo que la bóveda SALUD dice de cada tabla y
// de cada clave foránea.
//
//   node tools/catalog/import-vault-annotations.mjs --dry-run
//   node tools/catalog/import-vault-annotations.mjs --apply --schema iam,authz \
//        --api http://localhost:3000
//
// Lo que hace, y lo que **no** hace
//
//  - Es **dry-run por omisión**: sin `--apply` sólo cuenta lo que hay en la bóveda.
//  - Cada tabla recibe una **ficha en borrador con origen `IMPORTED_VAULT`**
//    (Negocio → `definition`, Ejemplo → `purpose`, Por qué no debe eliminarse →
//    `existenceRationale`) y una evidencia `VAULT_NOTE` con la parte «Sistema».
//  - Esos textos los **genera una herramienta** (ver `lib/vault-notes.mjs`): cada
//    campo que sale de una plantilla queda declarado como pregunta abierta. Nunca
//    se envía a revisión ni se aprueba; la API además se niega a pisar una ficha
//    escrita a mano o que ya entró a revisión.
//  - Cada clave foránea suma una evidencia `VAULT_NOTE` en su columna con el destino
//    y el criterio (`puml`, convención, inferido…). Una FK sin destino se declara
//    sin destino; no se le inventa uno.
//  - Los conjuntos de índices (`tipo/index_set`) no son tablas: no se importan.
//  - Repetirlo no duplica nada: la evidencia es idempotente por referencia y por
//    revisión de la nota (hash de su contenido).
//
// Variables: `SALUD_VAULT` (carpeta SALUD), `IMPORT_API`, `IMPORT_TOKEN` o
// `IMPORT_EMAIL` + `IMPORT_PASSWORD` (una cuenta con CATALOG_EDIT_ROLES).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { cargarBoveda, crearApi, importar, iniciarSesion, objetosDelSchema, resumir } from './lib/import-vault.mjs';

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
    schema: { type: 'string' },
    api: { type: 'string' },
    vault: { type: 'string' },
    limit: { type: 'string' },
    'sin-fk': { type: 'boolean', default: false },
    report: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  console.log('Uso: import-vault-annotations.mjs [--dry-run | --apply] [--schema a,b] [--api URL] [--vault DIR] [--limit N] [--sin-fk] [--report archivo.json]');
  process.exit(0);
}
if (values.apply && values['dry-run']) {
  console.error('--apply y --dry-run se excluyen.');
  process.exit(2);
}

const apply = values.apply;
const raiz =
  values.vault ??
  process.env.SALUD_VAULT ??
  [join(process.cwd(), '..', 'mantra_core_technologies_health_docs', 'SALUD'), join(process.cwd(), '..', 'Mantra Core Health Vault', 'SALUD')].find(existsSync);
if (!raiz || !existsSync(raiz)) {
  console.error('No encuentro la bóveda. Pasá --vault o SALUD_VAULT con la carpeta SALUD.');
  process.exit(2);
}
const schemas = values.schema?.split(',').map((s) => s.trim()).filter(Boolean);
const base = (values.api ?? process.env.IMPORT_API ?? 'http://localhost:3000').replace(/\/$/, '');

const boveda = cargarBoveda(raiz);
const resumen = resumir(boveda, { schemas });
console.log(`Bóveda: ${raiz}`);
console.log(JSON.stringify(resumen, null, 2));

let informe = { modo: apply ? 'apply' : 'dry-run', base, schemas: schemas ?? 'todos', resumen };

if (!apply) {
  // Con una API accesible, también se cuenta cuántas notas no tienen objeto en el catálogo.
  const token = process.env.IMPORT_TOKEN ?? (process.env.IMPORT_EMAIL ? await iniciarSesion({ base, email: process.env.IMPORT_EMAIL, password: process.env.IMPORT_PASSWORD }).catch(() => null) : null);
  if (token && schemas) {
    const api = crearApi({ base, token });
    const sinObjeto = [];
    for (const schema of schemas) {
      const objetos = await objetosDelSchema(api, schema);
      for (const nota of boveda.entidades.filter((n) => n.schema === schema && !n.esConjuntoDeIndices)) {
        if (!objetos.has(nota.table)) sinObjeto.push(`${schema}.${nota.table}`);
      }
    }
    informe = { ...informe, notasSinObjetoEnElCatalogo: sinObjeto };
    console.log(`Notas sin objeto en el catálogo: ${sinObjeto.length}`);
  }
  console.log('\nDry-run: no se escribió nada. Usá --apply para importar.');
} else {
  if (!schemas) {
    console.error('--apply exige --schema: se importa de a un conjunto de schemas, no toda la bóveda de un golpe.');
    process.exit(2);
  }
  const token = process.env.IMPORT_TOKEN ?? (await iniciarSesion({ base, email: process.env.IMPORT_EMAIL, password: process.env.IMPORT_PASSWORD }));
  const api = crearApi({ base, token });
  const resultado = await importar(api, boveda, {
    schemas,
    limite: values.limit ? Number(values.limit) : Infinity,
    conFk: !values['sin-fk'],
    log: (m) => console.log(m),
  });
  informe = { ...informe, resultado };
  console.log(JSON.stringify({ ...resultado, notasSinObjeto: resultado.notasSinObjeto.length, errores: resultado.errores.length, primerosErrores: resultado.errores.slice(0, 10) }, null, 2));
  if (resultado.errores.length > 0) process.exitCode = 1;
}

if (values.report) writeFileSync(values.report, JSON.stringify(informe, null, 2));
