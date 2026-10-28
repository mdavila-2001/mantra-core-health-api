# Reporte C11 — interop-vocab (transcrito del informe final del implementador; la herramienta rechazó su escritura)

- Commit: feb967f · Peldaño: parseo TESTED (33/33, recortes reales); build y carga VERIFIED solo en Postgres 16 desechable (borrado). Sin REGRESSION_VERIFIED. Sin revisión independiente.
- Antes → después: 16 conceptos internos → 2 972 ediciones de 1 566 code systems, 62 956 conceptos (43 937 pares distintos), 3 258 value sets en 4 795 ediciones con 75 070 miembros, 1 230 pares ConceptMap, 413 142 propiedades. 2.ª corrida 0 filas nuevas; 20 controles de integridad en 0. Build byte a byte idéntico en 2 corridas.

## Completado (licencia leída: evidencia/C11/licencias-2026-10-28.txt)
HL7 THO 7.5.0, FHIR R4/R4B/R5 + 3 IG (CC0); 705 NamingSystem; UCUM essence; CVX/MVX (225 marcas); IANA (8 276 idiomas, escrituras, regiones); CLDR 49 (EN/ES); Wikidata 5 254 códigos ISO 3166-2.

## No cargado
ISO oficial (403); SIX ISO 4217, SIL ISO 639-3 y UN M49 (términos impiden redistribuir); LoC ISO 639-2 (sin licencia declarada); US Core; SNOMED/LOINC/DICOM nombrados por HL7; 683/5 478 value sets y 110/3 076 code systems de HL7 omitidos; 96 ISO 3166-2 ambiguos en Wikidata.

## Decisiones del propietario
1. UCUM prohíbe obras derivadas: cargado verbatim con aviso por fila. 2. CVX/MVX: dominio público inferido (política CDC dio 403); allergies/ tiene otra copia. 3. Triplicación por ediciones R4/R4B/R5. 4. Identificadores ISO: permiso escrito según un tercero, no verificable (403). 5. Propuestas de modelo sin DDL: relación/versión en concept_maps, replaced_by_concept_id, conceptos de idioma de/nl/fr/it/pl/ru/zh, metadatos de code system.

## No cubierto
Base real del stack/API/UI; expansión de value sets contra servidor de referencia; fetch-sources.mjs desde cero tras el último cambio; coexistencia con lab-tests solo simulada.
