# Decisión — dependencia XLSX para la carga masiva (H7.S1)

> Tope de 45 minutos declarado en la ficha. **Corrección de rumbo dentro del tope**: la primera
> candidata (`exceljs`) se aceptó y se commiteó, y se revirtió al descubrir un defecto real que la
> descalifica. Se documenta el error, no se oculta (regla 00 §6, regla 10 fase 5 — causa raíz).

## Contexto

`ConceptFileImportService` (`src/modules/terminology/services/concept-file-import.service.ts:57-64`)
descartó CSV para el import de conceptos, alegando que sumaría una dependencia. Esa razón no
aplica esta noche: el requisito **es** cargar `.xlsx`, y un `.xlsx` es un ZIP con XML — no hay
forma de leerlo sin una librería.

**Restricción que no estaba en la ficha y que domina esta decisión**: el contrato compartido
(`CONTRATO-CARGA-MASIVA.md` §1) fija `ParseadorDeArchivo.parsear(buffer, perfil):
ResultadoDeParseo` — **síncrona, sin `Promise`**. Cualquier candidata que sólo lea de forma
asíncrona queda descalificada de entrada, sea cual sea su audit.

## Búsqueda de lo que ya existe

```
$ yarn why xlsx / exceljs / csv-parse / papaparse / fast-csv   → todas vacías
$ grep -l '"exceljs"\|"xlsx"' mantra-core-health*/package.json wt-*/package.json → vacío
```

Ninguna librería de lectura de Excel está instalada en el monorepo. Candidatas a evaluar.

## Candidata 1 — `exceljs@4.4.0` — RECHAZADA (incompatibilidad de forma, no de seguridad)

| Dato | Valor |
|---|---|
| Audit | Limpio: 1 hallazgo `moderate` y es de `eslint` (deprecación de versión), ajeno a `exceljs` |
| Licencia | MIT · Última publicación 2024-12-20 |
| Lee desde `Buffer` | Sí, `load(buffer: Buffer): Promise<Workbook>` |
| **Defecto que la descalifica** | **`load()` es la única forma de leer un `.xlsx` en esta librería, y devuelve `Promise<Workbook>`.** No tiene una variante síncrona (verificado en `node_modules/exceljs/index.d.ts`: la única firma de `load` es esa). El contrato exige `parsear()` síncrona. Envolver una promesa en un `deasync` o similar para fingir sincronía es exactamente el tipo de parche que la regla 00 prohíbe («no cambiar la semántica de un requisito para facilitar la implementación», y acá cambiaría la semántica de *ejecución*, con riesgo real de bloquear el event loop en cargas grandes). |

**Se había agregado y commiteado** (`chore(deps): agregar exceljs…`) antes de escribir el
parseador y descubrir esto al ir a implementar `parsear()`. Se revirtió en el mismo turno: commit
de reversa + explicación, ver «Consecuencias».

## Candidata 2 — `xlsx@0.18.5` (SheetJS, paquete `xlsx` de npm) — RECHAZADA (seguridad)

| Dato | Valor |
|---|---|
| Lee desde `Buffer`, síncrona | **Sí** — `read(data, opts): WorkBook` (sin `Promise`), verificado en `node_modules/xlsx/types/index.d.ts:25`. Ésta es la forma correcta para el contrato |
| Licencia | Apache-2.0 |
| Última publicación (metadata de npm) | 2026-07-17 |
| Audit | `yarn npm audit` → **2 hallazgos `high`, ambos de `xlsx` mismo, sin fix en el registro de npm**: `GHSA-4r6h-8v6p-xvw6` (Prototype Pollution, corregido recién en ≥0.19.3) y `GHSA-5pgg-2g8v-p4x9` (ReDoS, corregido recién en ≥0.20.2). El paquete `xlsx` publicado en el **registro de npm** quedó fijo en `0.18.5`: SheetJS distribuye las versiones corregidas (0.19.x, 0.20.x) sólo desde su propio CDN (`cdn.sheetjs.com`), no vía `npm install`. Salida completa en `evidencia/antes/audit-xlsx.txt` |
| **Motivo del rechazo** | Regla de esta noche (ficha, H7.S1.M4, «Si se traba»): **«Audit `high`/`critical` sin fix → no se agrega, H7.S3 `A MEDIAS`».** Instalar un paquete de una fuente que no es el registro de npm (un tarball de un CDN de terceros) para esquivar la vulnerabilidad es una decisión de cadena de suministro que excede lo que esta microtarea autoriza a decidir sola — se registra como pregunta para Pablo, no se resuelve por conveniencia (regla 00 §1.7). |

## Decisión final: **ninguna dependencia XLSX se agrega esta noche**

Ni `exceljs` (forma incompatible con el contrato) ni `xlsx` de npm (vulnerabilidades altas sin
parche en esa fuente) cumplen las dos condiciones a la vez (síncrona + audit limpio en el
registro oficial). Siguiendo el camino que la propia ficha previó para este escenario:

- `xlsx-parser.ts` **no se implementa** esta noche.
- H7.S3 queda **`A MEDIAS`**, no `BLOQUEADO`: el motivo, la evidencia y el camino de salida están
  documentados acá, no es una espera pasiva.
- El detector de formato de Itzan (`format-detector.ts`, fuera de mi alcance) puede seguir
  devolviendo 422 `IMPORT_FORMAT_UNSUPPORTED` para `.xlsx` hasta que se resuelva esto — que es
  exactamente lo que la ficha describe como resultado válido de un audit sin fix.

## Pregunta para Pablo (a resolver antes de reintentar H7.S3)

¿Se autoriza instalar `xlsx` desde el CDN propio de SheetJS (`https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2-0.20.2.tgz`
o la URL vigente que public SheetJS) en vez del registro de npm, para tener la versión con los
dos CVE corregidos? Es una fuente de paquete no estándar para este monorepo (todo lo demás viene
de npm), y decidirlo unilateralmente en esta microtarea sería resolver una ambigüedad de cadena de
suministro por conveniencia — exactamente lo que la regla 00 §1.7 prohíbe.

## Consecuencias

- `package.json`/`yarn.lock` **vuelven al estado de `origin/dev`** (ningún paquete XLSX agregado).
  Historial de commits de este turno, para que quede trazable: (1) se agregó `exceljs`, (2) se
  removió al descubrir la incompatibilidad de forma, (3) se probó `xlsx`, (4) se removió al ver
  el audit, (5) este documento consolida el porqué de los tres primeros.
- H1.S3.M2 (fixtures E2E `.xlsx`) y H7.S2.M4 (gemelos `.xlsx` de la API) quedan igual de
  `A MEDIAS`: sin librería, no hay cómo generarlos por script; se declaran así, no se inventan a
  mano por fuera del proceso descrito en la ficha («`con-errores.xlsx` se crea con cualquier
  planilla a mano una vez y se declara» — **eso sí se hace**, es la única vía de la propia ficha
  para este escenario, y se ejecuta en H7.S2).
- H5 (gate de seguridad): agrega una fila — «dependencia con vulnerabilidad conocida evitada por
  no agregarla», no aplica como riesgo residual porque no se instaló.

## Reversa

No aplica: no queda ninguna dependencia agregada al cerrar este documento.
