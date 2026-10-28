# Reporte C7 — diccionarios (transcrito del informe final del implementador; la herramienta rechazó su escritura)

- Commit: 2767890 · Peldaño: carga VERIFIED solo en Postgres 16 desechable (puerto 55437, borrado); tests/parsers TESTED. Sin revisión independiente.
- Antes → después (por defecto): conceptos 111 389 → 392 818; construidos 496 272 → 1 095 198 (49 fuentes); designaciones 292 796 → 1 133 015; relaciones 65 928 → 452 995; concept_maps 7 614 → 10 874.
- Fuentes nuevas: ChEBI 62 215, PRO 132 491, NCIt OBO 70 782, MeSH 932, EMDN 8 516, AbreMES-DB 6 180 (frecuencia ≥ 3). Wikidata ES: 61 312 filas, 54 414 conceptos con designación ES (sinónimos, nunca preferidas), 446 pedidos con 37 respuestas 429 respetadas. NCBI Taxonomy: queda 1 de 138 taxones sin etiqueta (eliminado por NCBI).

## Probado
node --test 45/45 (arreglados un nombre de función viejo y una aserción falsa en c7.test.mjs). Dos builds dan .ndjson idénticos (.meta.json difieren en generatedAt). Carga 1 266 s / 2.ª 179 s: 0 filas nuevas, solo 29 lotes de auditoría; 13 chequeos de integridad en 0. Defecto del cargador corregido: 5 conceptos FMA con designación ES duplicada (test agregado). data/ de 33 a 94 MB con SHA256SUMS, gzip -t y --unpack verificados (se regeneraron 42 .ndjson.gz previos: +60 MB de blobs en git).

## Pendiente / no cargado
FIPAT/TA2 (proxy 502, SPA sin descarga ni licencia verificada); DeCS (host 200, licencia BIREME no verificada); LPSN y MRO no investigados; opt-in sin cargar: ChEBI 1-2 estrellas (156 508), AbreMES freq < 3 (52 339), NCIt fuera de rama por defecto (108 650).

## Decisiones del propietario
1. EMDN: CC BY 4.0 por el aviso legal general de la Comisión; el archivo no trae aviso propio. 2. AbreMES-DB: Zenodo dice CC BY 4.0 (no MIT); piso de frecuencia ≥ 3 es criterio del implementador. 3. DeCS. 4. Si los conceptos en inglés se muestran en el glosario.

## No cubierto
Base real (5433); MD5 de AbreMES contra Zenodo (zip borrado, se guardó SHA-256); memoria del cargador con corpus completo; PRO se baja de URL "current" sin fijar (versión 73.1 registrada con SHA-256).
