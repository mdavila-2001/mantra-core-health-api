# Decisión — dependencia para leer XLSX

## Contexto

El motor de carga masiva (Itzan, `src/modules/terminology/import/`) escribió el parseador CSV
**a mano, sin dependencia**, con esta justificación explícita en `csv-parser.ts:18-27`:

> Lee un CSV siguiendo el RFC 4180, sin dependencias. […] Porque el alcance real es chico y
> conocido […] Sumar una dependencia para esto costaría más de lo que resuelve: hay que
> justificarla, auditarla, y después envolverla igual detrás de este mismo contrato para que el
> servicio no la vea.

Para XLSX ese cálculo no vale igual: el formato es un ZIP con XML interno (`xl/worksheet1.xml`,
`sharedStrings.xml`, estilos, tipos de celda, fórmulas cacheadas). Escribirlo a mano exigiría un
parser de ZIP y de varios esquemas XML, con mucha más superficie de error que "separador +
comillas + saltos de línea" del CSV. Acá sí conviene una dependencia.

**Restricción que manda la elección**: `ParseadorDeArchivo.parsear()` es **síncrono** por contrato
(`row-contract.ts:88-91`) y el servicio de Itzan lo llama sin `await`
(`concept-file-import.service.ts` de su rama, líneas 201-204: pasar una `Promise` ahí produciría
`validarFilas(undefined)` y un 500). Eso descarta cualquier librería con API asíncrona:
`exceljs`, `read-excel-file`, `xlsx-populate`. La única familia con lectura **y** escritura
síncronas desde `Buffer` es SheetJS.

## Decisión

**SheetJS Community Edition, paquete `xlsx`, versión `0.20.3`, instalada desde el canal oficial**
(no npm):

```
yarn add xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

Motivo de no usar la versión de npm: la última que SheetJS publicó ahí es `0.18.5` (2022), y
arrastra dos avisos de seguridad sin corregir en ese canal (prototype pollution / ReDoS,
GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9). Las versiones ≥ 0.19 sólo se distribuyen por el CDN
propio del proyecto; es la recomendación oficial de SheetJS para evitar exactamente esos CVE.

## Evidencia verificada (no asumida)

- Versión y licencia en `node_modules/xlsx/package.json`: `"version": "0.20.3"`,
  `"license": "Apache-2.0"`.
- API síncrona confirmada en `node_modules/xlsx/types/index.d.ts`: `read(data, opts)` con
  `type: 'buffer'`, `ParsingOptions.sheetRows` (permite acotar filas leídas — la base de
  `MAX_FILAS_XLSX`), `cellFormula`, `cellDates`, `blankrows`.
- Tamaño instalado: `du -sh node_modules/xlsx` → **7,8 M**.
- `yarn npm audit`: el único hallazgo del árbol completo es una advertencia de *deprecation*
  (no seguridad) sobre `eslint@9.39.5`, preexistente y ajena a `xlsx`. Ningún hallazgo de
  `xlsx` — ver `evidencia/h7s1-audit.txt`.
- `exports` del `package.json` de `xlsx`: `"."` resuelve `import` → `xlsx.mjs`, `require` →
  `xlsx.js`. Esto es lo que hace posible el paso siguiente.
- **Spec de humo bajo Jest ESM** (el proyecto corre `--experimental-vm-modules` con
  `extensionsToTreatAsEsm: ['.ts']`, sin precedente claro de importar un CJS grande con
  `import * as`): `import * as XLSX from 'xlsx'; expect(typeof XLSX.read).toBe('function')`
  corrió en verde sin ningún ajuste de configuración — ver `evidencia/h7s1-smoke.txt`
  (1 suite, 1 test, PASS). No hizo falta el plan B (`moduleNameMapper` o `createRequire`).

## Consecuencias

- Dependencia nueva en `package.json`/`yarn.lock`, instalada por URL: `yarn.lock` fija su
  integridad (hash del tarball), pero **no** aparece en el registro de npm, así que
  herramientas que auditen sólo contra el registro (Dependabot, por ejemplo) no la van a ver.
  Se declara acá para que quede trazado.
- 7,8 MiB agregados a `node_modules` (SheetJS trae varios `dist/*` que no se usan: `xlsx.zahl`,
  `cpexcel`, minificados). No afecta el bundle del servidor porque la API no empaqueta
  `node_modules`.
- `xlsx-parser.ts` importa **sólo** `XLSX.read`, `XLSX.utils.sheet_to_json` y `XLSX.write` (este
  último para el generador de fixtures, no para el parser en sí).

## Reversa

Si el tarball no hubiera bajado o el spec de humo hubiera fallado (no fue el caso; documentado
por si alguien retoma esto en otra máquina): la decisión de reversa era declarar «XLSX A MEDIAS»
y dejar que el detector de formato de Itzan siga devolviendo `422 IMPORT_FORMAT_UNSUPPORTED` para
`.xlsx`, sin escribir `xlsx-parser.ts`. La alternativa registrada para quien retome esto es
`exceljs` (API async, MIT), que exige cambiar `ParseadorDeArchivo.parsear()` a `Promise` en
`CONTRATO-CARGA-MASIVA.md` **primero**, y coordinar con quien integre para que el servicio pase a
`await`. No hizo falta: SheetJS funcionó dentro del tope de 45 minutos.
