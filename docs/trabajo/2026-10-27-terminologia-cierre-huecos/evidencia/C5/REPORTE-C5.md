# Reporte C5 — farmacología clínica (transcrito del informe final del implementador; la herramienta rechazó su escritura)

- Commit: b0d7ccc · Peldaño: parsers TESTED (27/27); carga e integridad VERIFIED solo en Postgres 16 desechable (puerto 55435, borrado); data/ TESTED por reproducibilidad. Avance 5/5 microtareas, con A MEDIAS el alojamiento del corpus `product`. Sin revisión independiente al momento de transcribir.
- Antes → después: monografías en data/ 0 → 2 963 (84 352 secciones: CIMA 37 088, openFDA 46 305, EMA 959). Universo ATC nivel 5: 483 → 6 045. Cruce: 2 035 ATC con etiqueta openFDA; 630 ATC con puente completo sin etiqueta por UNII.

## Pasada exhaustiva
CIMA: 25 507 medicamentos, 22 510 fichas; aparecieron 5 registros nuevos en 8 h (91661, 91662, 91663, 91688, 91689); luego totalFilas vivo = bajado, 0 por bajar. RxNav: 6 045 ATC, 0 pedidos en la re-corrida. EMA: 0 registros distintos. openFDA: 14 particiones, 262 903 etiquetas. Hosts re-sondeados con GET: todos 200 salvo api.pharmgkb.org. Licencias de CIMA, openFDA, EMA y RxNav releídas hoy (texto en evidencia/C5/licencias/). WHO ATC/DDD no se carga.

## Verificación
node --test 27/27. Build `route` reproducible (2 builds, mismo SHA-256); data/ = 7 partes (81 MB), sha256sum -c SHA256SUMS OK. Carga del corpus `product`: 4 052 conceptos y 405 290 propiedades; 2.ª corrida 0 filas nuevas; duplicados, huérfanos, nulos y secciones sin procedencia: 0.

## Cambios de código
Cargador con lotes por tamaño (una monografía llega a 85 MB). pack-data genera SHA256SUMS. La semilla de la base desechable crea los conceptos internos y exige DB_NAME terminado en _test.

## Decisiones del propietario
1. El corpus `product` (381 904 secciones) pesa 606 MB gzip, más que los ~300 MB del brief. Se versionó `route` (una ficha de referencia por principio activo y vías; todo openFDA y EMA). ¿Dónde se aloja `product`? 2. "Exhaustivo" = todas las fichas CIMA + etiquetas openFDA de referencia por ATC (no las 262 903): a confirmar. 3. Sin cargar por licencia: WHO ATC/DDD, MedDRA, DDInter, PharmGKB/CPIC, WHO EML.

## No cubierto
Base real del stack. Re-descarga de openFDA tras el cambio de export_date a 2026-10-28. Una etiqueta openFDA que el lector no cuenta (262 902 leídas de 262 903). Cruce con productos y con relaciones de C6. Cargar `route` sobre `product` con prune: riesgo deducido del código, no probado. Secciones de CIMA sin fecha ni versión no se publican (11 860 en route, 54 299 en product).
