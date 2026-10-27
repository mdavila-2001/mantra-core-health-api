> **AVANCE: 5 / 5 — 100,0 %** (H1.C8.M1–M5; `A MEDIAS` contaría como no hecha). Cierra lo que se podía cerrar con fuentes abiertas de licencia verificada; los huecos que persisten (licencia, curaduría, libro de pago) están en «Pendiente» con su motivo.

# Reporte — Carril C8: enfermería y servicios por especialidad

- Fecha: 2026-10-27 · Plan: [PLAN.md](../../PLAN.md) · Rama: `claude/adoring-heisenberg-1rl29k` (commits locales, sin push)
- Peldaño de evidencia por área (regla 30; «VERIFIED» = contra un **Postgres 16 desechable propio**, nunca contra la base del stack):
  - Omaha System (parsers, corpus, carga): `VERIFIED` en Postgres desechable.
  - Enlaces LOINC (47 términos): `VERIFIED` en Postgres desechable con un subconjunto de prueba de `loinc` (no con `import-loinc.mjs` completo).
  - Glasgow adultos, licencias de escalas y CMDIC: `VERIFIED` (carga) + licencia leída del titular.
  - CUPS 2025 oficial y relaciones servicio → especialidad: `VERIFIED` en Postgres desechable.
  - Propuesta de especialidades al modelo: `RUNS` (script y datos); es una propuesta, no cambia el modelo.
  - Trabajo del carril = el más bajo en alcance = `VERIFIED` (desechable); **no** `REGRESSION_VERIFIED`: no se corrió la regresión de la suite completa ni se cargó la base real.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.C8.M1 | Cada hueco re-sondeado hoy (200/403/sin respuesta) y registrado en el doc de cada dominio | `curl -I`/GET por host → `evidencia/C8/sondeo-hosts-2026-10-27.txt`, `sondeo-especialidades-2026-10-27.txt` | PASS (56 + 23 hosts; 12 que figuraban bloqueados hoy responden 200) |
| H1.C8.M2 | Parsers escritos contra los archivos reales: Omaha (HTML del sitio, imagen PRSO, PDF del MOSUG), enlaces LOINC (API del NLM), CMDIC (zip oficial), CUPS 2025 (PDF oficial) | `node --test "tools/terminology-import/nursing-care/test/*.test.mjs"` y `…/specialty-services/test/*.test.mjs` → `evidencia/C8/node-test-final.txt` | PASS: nursing-care 29/29, specialty-services 15/15 |
| H1.C8.M3 | Builds reproducibles (mismo SHA-256 en 2 corridas) | `omaha-build-reproducible.txt`, `nursing-build-reproducible.txt` (CKM, CMDIC y registro: SHA-256 idénticos entre sí y a los del `MANIFEST.json`), `specialty-build-reproducible.txt` | PASS (en specialty-services `retrievedAt` pasó a ser la fecha de descarga del archivo en la caché, no la hora del armado) |
| H1.C8.M4 | Carga en Postgres 16 desechable (`pg-C8`, puerto 55408), 2.ª corrida = 0 filas nuevas, consultas de integridad | `final-nursing-load-run1/2.txt`, `final-nursing-load-run3/4-con-loinc.txt`, `nursing-integrity-output.txt`; `final-specialty-load-run1/2.txt`, `specialty-integrity-output.txt` | PASS: ver «Evidencia» |
| H1.C8.M5 | `SOURCES.md` y docs de cobertura actualizados con «hueco → estado hoy → qué se cargó → antes/después» y los huecos con su motivo | `docs/seed-research/nursing-care.md` §«Cierre de huecos — 2026-10-27»; `…/specialty-services.md` §«Cierre de huecos — 2026-10-27»; `…/nursing-care/SOURCES.md`; `…/specialty-services/SOURCES.md` | PASS |

## A medias

ninguna.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Omaha: signos/síntomas de 24 problemas, códigos numéricos, definiciones de los 76 objetivos | BLOQUEADO (licencia: libro de pago) | el libro de 2005 (Apéndices A y E) o permiso de Health Connections Press para volcarlos; **decisión del propietario** |
| Escalas Braden, Barthel, Waterlow, MUST | BLOQUEADO (licencia con tarifa o permiso comercial) | licencia del titular |
| NEWS2 | DECISION_REQUIRED | el RCP libera la reproducción pero exige «no modificar»: el propietario decide si cargar los parámetros como filas de catálogo cuenta como modificar |
| Norton, EMINA, Cubbin-Jackson, Morse, Downton | BLOQUEADO (sin fuente abierta con licencia) | el titular o una fuente primaria con licencia |
| Protocolos de enfermería Bolivia / España / MINSAL / IMSS | BLOQUEADO (no hay documento libre) | Bolivia no publica uno; IMSS GPC y GuíaSalud son NC; MINSAL sin licencia legible |
| CCC, ICNP, NANDA-I, NIC, NOC | DESCARTADO por licencia (sin cambios) | licencia comercial |
| Especialidades que el modelo no tiene | PROPUESTA entregada | el propietario las lleva a `VS_MEDICAL_SPECIALTY` (sección «Propuesta al modelo») |
| FONASA (original), SISPRO, SIGTAP | BLOQUEADO (403 / sin respuesta hoy) | red; la copia npm de FONASA sigue verificada 596/596 |
| Cargar en la base real del stack | no hecho | corrida del propietario con `--apply` (solo hay evidencia en Postgres desechable) |

## Evidencia

Conteos antes → después, por code system (Postgres 16 desechable; «antes» = lo que el repo versionaba el 2026-10-24):

| Code system | Antes | Después |
|---|---:|---:|
| `omaha-system` | 0 | **320** (4 dominios, 42 problemas, 168 signos/síntomas de 18 problemas, 2 conjuntos + 6 modificadores, 4 categorías, 76 objetivos, 3 conceptos PRSO + 15 niveles) |
| `openehr-ckm` | 8 015 | 8 037 (+22: escala de Glasgow de adultos, licencia verificada) |
| `es-msssi-cmdic-13606` | 617 | 617 (licencia confirmada; el zip oficial da los mismos 617) |
| `nursing-terminology-registry` | 12 | 12 |
| enlaces LOINC (`concept_maps`) | 0 | 48 (los 47 términos LOINC que enlazan los arquetipos; 54 códigos `LA…` son respuestas, no términos) |
| `fonasa-mle-2026` (servicios) | 962 | 962 |
| `cups-co` (copias) | 186 | 186 |
| `cups-co-2706-2025` (oficial) | 0 | **190** |
| Relaciones servicio → especialidad | 4 923 | **5 113** (53 value sets, 5 113 miembros) |

```text
# nursing-care, 1.ª y 2.ª corrida (final-nursing-load-run1/2.txt, recortado)
[load] {"codeSystem":"omaha-system","concepts":320,"designations":320,"properties":3588,"relationships":231,...}   # 1.ª
[load] {"codeSystem":"omaha-system","concepts":0,"designations":0,"properties":0,"relationships":0,...}           # 2.ª
# con LOINC de prueba: 3.ª "loincMaps":48 ; 4.ª "loincMaps":0
# specialty-services (final-specialty-load-run1/2.txt)
inserted: concepts 1338, designations 1338, properties 7709, relationships 5113, valueSets 53, valueSetMembers 5113, batches 4   # 1.ª
inserted: todo 0                                                                                                       # 2.ª
# integridad (nursing-integrity-output.txt / specialty-integrity-output.txt): duplicados 0 · relaciones huérfanas 0 ·
# designaciones y propiedades huérfanas 0 · display vacío 0 · Omaha sin procedencia 0 · problemas sin dominio 0 · signos sin problema 0 ·
# destino de relación fuera de VS_MEDICAL_SPECIALTY 0 · miembros de value sets = relaciones (5 113)
```

Otras comprobaciones: `omaha-crosscheck.txt` (33 de 42 problemas coinciden en número y nombre con el formulario de Estambul; los 13 comparables, mismos totales de signos/síntomas); `cmdic-zip-oficial-vs-repo.txt` (617/617, 0 diferencias); `fetch-loinc-links.txt` (47/47 términos LOINC resueltos en el subconjunto público del NLM; 403 términos `[OMAHA]` publicados).

## No cubierto

- La **transcripción de la PRSO** (imagen oficial, sin texto) se hizo mirando el archivo; se contrastó con las respuestas LOINC, no con el libro impreso.
- El orden «por columnas» de los signos/síntomas del MOSUG se verificó contra el formulario de Estambul en 13 de 18 problemas (los otros 5 no tienen encabezado legible en ese formulario).
- El orden de los signos/síntomas y su número no es el código oficial de Omaha (el sitio no los publica): es `source_order`.
- Los 2 sistemas CUPS (copias de terceros y oficial) conviven; no se probó retirar el de las copias.
- Carga en la base real del stack; regresión de la suite completa (`yarn test` de la API) no se corrió.
- Texto de Omaha en castellano: no existe en las fuentes; no se tradujo.

## Desvíos del plan

- El «Postgres desechable en `<scratchpad>/pg-<carril>`» no pudo vivir en el scratchpad: `/tmp/claude-0` es `0700 root` y el usuario `postgres` no entra (un `chmod o+x` se revertía solo). Se usó `/var/tmp/pg-C8`, se detuvo y se borró al terminar.
- Se agregaron a `nursing-care/` `fetch-omaha.mjs`, `build-omaha.mjs`, `pack-omaha.mjs`, `fetch-loinc-links.mjs`, `verify-*` (no estaban en las microtareas M1–M5 como archivos, pero son parte de M2/M3).
- En `specialty-services` NO se tocó `src/common/seed/data/specialty-services/rules.json` (fuera de alcance): CUPS 2025 reutiliza los patrones de CUPS vía un alias en `lib/rules.mjs`. Las frases que el modelo no tiene quedan como hueco con `specialty: null`, no se agregan reglas.
- Por el pedido de disco del coordinador se borraron crudos y la base desechable; los datos versionados no se tocaron.

## Riesgos residuales

- `cenetec-difusion.com` **sirve hoy una página de casinos**: cualquier doc o código del repo que lo cite como fuente de GPC apunta a un dominio ajeno a CENETEC.
- La licencia «reproducción libre» de la CUPS 2025 se apoya en el art. 41 de la Ley 23 de 1982 (acto administrativo), igual que en la pasada anterior: conviene verificarla con el propietario.
- Los ids de concepto no llevan la versión del code system (limitación conocida de nursing-care): una versión nueva de Omaha no reemplaza textos de una carga previa.

## Decisiones y ambigüedades (a quién confirmarlas)

1. **Health Connections Press (editorial de Omaha) / propietario**: la FAQ dice que los términos son de dominio público y de uso libre, pero que «developers and companies who design and sell software based on the Omaha System […] should contact Health Connections Press». ¿Cargar los términos en un producto comercial entra en el uso libre? Se cargó con cita del libro de 2005 en cada fila.
2. **Propietario (licencias)**: NEWS2 (¿cargar sin «modificar»?); `Procedimiento del PBS` de datos.gov.co es CC BY-SA 4.0 y no se cargó (misma duda de *share-alike* que CKM).
3. **Propietario (modelo)**: ver «Propuesta al modelo» abajo; además, `VS_MEDICAL_SPECIALTY` no distingue profesión de especialidad médica, y tiene dos códigos para cirugía oral y maxilofacial.
4. **Propietario (producto)**: TUSS (Brasil) y SIGTAP están en portugués; usarlos exige aceptar texto sin traducción oficial o una traducción propia marcada como no oficial.
5. Supuesto tomado: en el MOSUG, `pg N` (página del libro de 2005) une cada problema con el del sitio (la lista de 42 problemas del suplemento va en el mismo orden); los 2 nombres que difieren («Interpersonal Relationships», «Healthcare Supervision») se unen por esa página, no por parecido.

## Propuesta al modelo

Sin DDL (ADR-0021). Todo entra en tablas existentes. Propuestas al repo del modelo (`mantra-core-health-model`):

**a) Especialidades y profesiones que las fuentes nombran y `VS_MEDICAL_SPECIALTY` no tiene.** Tabla completa, **por fuente y sin fusionar nombres**, en `docs/seed-research/specialty-services.md` §«Huecos» y en `tools/terminology-import/specialty-services/data/model-proposal.json` (generada con `propose-model-specialties.mjs`). Conteos de servicios que quedan sin especialidad: arancel SCZ **713** (6 nombres), FONASA **209** (20), CUPS copias **184** (55), CUPS 2025 **185** (55). Prioridad por volumen, con el nombre y el recuento que escribe cada fuente:

| Candidata | Arancel SCZ | FONASA | CUPS 2025 |
|---|---:|---:|---:|
| Neurocirugía | 266 (`Neurocirugía`) | 2 (`NEUROCIRUGIA`) | 3 (`NEUROCIRUGIA`) |
| Cirugía plástica, estética y reconstructiva | 205 | 66 (grupo 15) + 2 | 3 + 3 (`MEDICINA ESTETICA`) |
| Cirugía cardiovascular / torácica / vascular | 192 (`Cirugía Cardíaca, Torácica y Vascular`) | 2 + 2 + 2 | 3 + 3 + 3 |
| Cirugía de cabeza y cuello | — | 60 (grupo 14) + 2 | 3 |
| Mastología | 36 | — | 3 + 3 |
| Medicina nuclear y radioterapia | — | 43 (grupo 05) + 2 + 2 | 3 + 3 |
| Salud pública / Auditoría médica | 10 / 4 | — | — |
| Profesiones: terapia ocupacional, fonoaudiología, terapia respiratoria, trabajo social, optometría, higiene oral | — | 6 + 4 | 8 + 3+3 + 5 + 8 + 2 + 2 |

(El detalle exacto, incluidas subespecialidades pediátricas, alergología, genética, hepatología, medicina forense/aeroespacial/alternativa, etc., está en la tabla completa.) **No se propone ningún código**: lo fija el modelo.

**b)** Resolver el duplicado `CIRUGIA_BUCOMAXILOFACIAL` / `CIRUGIA_ORAL_MAXILOFACIAL` (las fuentes dicen «Cirugía maxilofacial» y «Cirugía oral»; elegir uno sería inventar).
**c)** Decidir si profesiones (terapia ocupacional, fonoaudiología, trabajo social…) entran a `VS_MEDICAL_SPECIALTY` o a un value set propio.
**d)** `concept_relationships` no guarda la procedencia de la relación (ya anotado el 2026-10-24); se sigue guardando en `concept_properties` del servicio.
**e)** Omaha: si el modelo quiere guardar los **códigos numéricos** oficiales y el texto en castellano, se necesita una fuente (el libro) y, para el texto, una traducción oficial que no existe en abierto.
