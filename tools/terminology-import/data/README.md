# Tablas curadas a mano

## `orphanet-classification-specialty.csv` (TAREA-41 F3.3) — VACÍA a propósito

Correspondencia **Orphanet clasificación → especialidad de la plataforma** (unas 30 filas). La ficha manda que sea
una tabla **curada y revisada por una persona, y commiteada**; «nunca se infiere». Por eso este archivo trae solo
el encabezado: no hay filas inventadas ni sugeridas por nombre.

Para llenarla hacen falta dos insumos que hoy no están en el repositorio:
1. Las clasificaciones de Orphanet (Orphadata, producto 3: un archivo `en_product3_<id>.xml` por clasificación).
2. La lista de especialidades de la plataforma contra la que se mapea (`wikidata-especialidad`, 104 conceptos, u otra que defina el propietario).

Cada fila lleva quién la revisó (`reviewed_by`), cuándo (`reviewed_on`) y `evidence_url`. Hasta que exista, F3.3 no
carga relaciones `SPECIALTY` desde Orphanet.
