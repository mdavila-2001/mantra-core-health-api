# Reporte C13 — nutrición y alimentos (transcrito del informe final del implementador; la herramienta rechazó su escritura)

- Commits: 0ccffb5 (importador, tests, corpus) y edc77c3 (doc y evidencia) · Peldaño: parsers y corpus TESTED (18/18); carga idempotente VERIFIED solo en Postgres 16 desechable (puerto 55443, borrado). Sin REGRESSION_VERIFIED: ninguna ruta de la API lee estos code systems. Sin revisión independiente al momento de transcribir.
- Antes → después: 9 conceptos internos sembrados, nada de alimentos → 28 code systems, 2 059 819 conceptos, 2 079 692 designaciones, 6 351 105 propiedades, 2 048 265 relaciones is-a. 2.ª corrida +0 en todo; 18 controles de integridad (huérfanos, duplicados, nulos, procedencia) en 0 en ambas corridas.

## Cargado (procedencia, SHA-256 y licencia por fila; id corto de licencia por fila, texto completo en manifiesto y SOURCES.md)
USDA FDC (CC0): Foundation 469, SR Legacy 7 793, Survey 5 432, Branded 1 999 950, 9 vocabularios 1 376. FoodOn 29 255 (CC BY 4.0), CDNO 1 163 (CC BY 3.0), FOBI 626 y ONS 336 (CC BY 4.0). Ciqual 2025: 5 696 (CC BY 4.0) con 257 816 valores de composición. Canadian Nutrient File 2026: 7 723 (OGL-Canadá) con 565 409 valores. Cruces solo por código exacto.

## Peso
data/ versionado 100 MB, partes de ≤9 MB, con SHA256SUMS; dos builds dan los mismos SHA-256. Branded es 88 MB del corpus y la mayor parte de los 4,4 GB de la base completa. Corte propuesto: --no-branded (59 421 conceptos, ~12 MB).

## Pendiente (red, licencia o lector)
LanguaL 455; FIDEO (host no alcanzable); Fineli 403; Frida sin respuesta; ONE sin licencia declarada; UK CoFID, AFCD, EFSA FoodEx2 y FAO/INFOODS alcanzables pero sin licencia leída ni lector. De Branded no se cargan ingredientes ni valores nutricionales.

## Decisiones del propietario
Open Food Facts (ODbL): no se agregó nada. Atribución obligatoria para CC BY y OGL-Canadá. CDNO: el archivo dice CC BY 3.0 y el repo CC0 (registrado CC BY 3.0). FOBI: archivo y repo CC BY 4.0, registro OBO CC BY 3.0 (registrado CC BY 4.0). Propuesta (no escrita, toca filas de otro carril): concept_map entre allergy-foodon (FOODON:…) y foodon (FOODON_…). Branded sin ingredientes ni nutrientes es un supuesto del implementador, a confirmar.

## Desvíos
El primer intento de carga con el texto completo de licencia en cada ffila hizo crecer la base más de lo que soporta el disco compartido: se abortó, se pasó a un id corto y se repitió todo; la evidencia es la de la corrida final. fetch-sources.mjs necesita NODE_USE_ENV_PROXY=1 en este sandbox.
