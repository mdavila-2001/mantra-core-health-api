# Fuentes FDA/NLM — licencias, términos y estado

Región `us/` del catálogo de equipos de diagnóstico. Formato de salida: el README común
`tools/terminology-import/diagnostic-devices/README.md` (rama `justin/seed-dx-devices-master`,
`formatVersion` 1). Bitácora de pasadas: `docs/seed-research/diagnostic-devices-us.md`.

## Recorte aplicado en esta región

Esta región **ya recorta** a equipos de diagnóstico (el README común lo permite si se declara).
Criterio: `lib/scope.mjs`, por product code FDA:

1. Excepción explícita por product code (`PRODUCT_CODE_OVERRIDES`, cada una cita los registros FDA que la justifican).
2. Excepción explícita por regulación 21 CFR (`REGULATION_OVERRIDES`).
3. Parte y subparte de 21 CFR (Subchapter H): entran las subpartes «Diagnostic devices» y «Monitoring devices» de cada panel, y todas las de diagnóstico in vitro (862, 864 B–I, 866). Quedan fuera «Prosthetic», «Surgical», «Therapeutic», «Miscellaneous» y la Subpart J de 864 (insumos de banco de sangre), salvo las excepciones.
4. Sin número de regulación: entra sólo si el panel es in vitro (CH, HE, IM, MI, PA, TX, MG).

La lista completa de product codes vistos, **incluidos y excluidos con su regla y motivo**, está en
`out/fda-product-codes.json`; el resumen, en la bitácora.

## Fuentes

| Fuente | URL oficial | Licencia / términos | Estado en esta sesión |
|---|---|---|---|
| openFDA `device/510k` (incluye De Novo `DEN…`) | https://download.open.fda.gov/device/510k/ | openFDA: datos de dominio público del gobierno de EE. UU.; openFDA los publica bajo CC0 1.0 (https://open.fda.gov/license/). Sin restricción de uso; se pide no implicar aval de FDA. | **Usado vía espejo** `choiben314/510k-lineage@806b59cb` (`dataset/devices.csv`, 175 757 filas, export openFDA 2026-08-10, sha256 del zip oficial `996cd24d…25c4`). Espejo: datos CC BY 4.0, código MIT → se cita a Ben Choi (2026) en `extra.via`. |
| FDA `foiclass.zip` (Product Classification) | https://www.accessdata.fda.gov/premarket/ftparea/foiclass.zip · https://download.open.fda.gov/device/classification/ | Dominio público | Oficial: 403 del proxy. **Usado vía espejo** `ej86/fda-ai-medical-device-analytics@8840a036` (`foiclass.csv` = `foiclass.txt` crudo, 7 088 códigos; el repo no declara licencia, pero el archivo es la publicación de FDA sin transformar) y `bjoleary/fdadata@227bdaa2` (`product_codes.rda`, 7 097 códigos, accedido 2026-10-20, MIT) para los 9 códigos que el primero no trae. La regulación de fdadata viene como número (868.582) y se completa a 4 decimales (868.5820). |
| FDA 510(k) Download Files (`pmn*.zip`) | https://www.fda.gov/medical-devices/510k-clearances/downloadable-510k-files | Dominio público | Oficial: 403. **Usado vía** `bjoleary/fdadata@227bdaa2` (`pmn.rda`, 176 466 filas, accedido 2026-10-20, MIT): agrega dirección, país (ISO alfa-2 de FDA) y decisión verbatim. Gana sobre el espejo de openFDA (más nuevo); los `null` se completan con aquel y queda citado en `extra.alsoIn`. |
| FDA PMA (`pma.zip`, con suplementos) | https://www.accessdata.fda.gov/premarket/ftparea/pma.zip | Dominio público | Oficial: 403. **Usado vía** `bjoleary/fdadata@227bdaa2` (`pma.rda`, 57 373 filas). Una fila por PMA + nombre comercial; los suplementos sin product code heredan el del PMA original (`extra.productCodeFromParentPma`). |
| FDA «Artificial Intelligence-Enabled Medical Devices» | https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices | Dominio público | Oficial: 403. **Usado vía** `ej86/…@8840a036` (`aiml-devices-csv.csv`, 1 524 filas hasta 2026-03-30): marca `extra.fdaAiEnabledList`. |
| FDA Establishment Registration & Device Listing (archivos planos y openFDA `device/registrationlisting`) | https://www.fda.gov/medical-devices/device-registration-and-listing/establishment-registration-and-medical-device-listing-files-download | Dominio público | Oficial: 403. **Usado vía** `sdgoldberg/MedDev@6cbd231b` (sin licencia declarada; son los `.txt` de FDA sin transformar): instantánea 2024, 110 614 listados de alcance diagnóstico con establecimiento, país, número de registro y FEI. Falta el archivo de nombres propietarios (marcas por listado): hueco. |
| CDC LIVD SARS-CoV-2 (pruebas IVD con EUA de FDA) | https://www.cdc.gov/csels/dls/livd-codes.html | Obra del gobierno de EE. UU.; el repo `CDCgov/routes` es Apache-2.0 | **Usado** `CDCgov/routes@e2e16eed`: 487 kits (`source` = `cdc-livd-sars-cov-2`). LIVD no publica product code ni número de EUA: quedan `null`. Entra entero (todo es diagnóstico in vitro). |
| FDA CLIA database | https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfClia/Search.cfm | Dominio público | Oficial: 403. **Enriquecimiento** vía `unmtransinfo/cfde-biomarkers@9a121841` (licencia Creative Commons del repo): analitos por K-number en `extra.fdaCliaAnalytes`. No crea filas (no trae nombres de sistema de prueba). |
| FDA Nucleic Acid Based Tests | https://www.fda.gov/medical-devices/in-vitro-diagnostics/nucleic-acid-based-tests | Dominio público | **Enriquecimiento** vía `double-strand/IVDmicrobialNAATregistry@6cdd1e5e` (GPL-3.0): patógenos (TaxID NCBI) y tecnología en `extra.fdaNaatList`. |
| AccessGUDID (Full Release) y openFDA `device/udi` | https://accessgudid.nlm.nih.gov/download/delimited · https://download.open.fda.gov/device/udi/ | GUDID: datos públicos de FDA/NLM sin restricción; términos NLM: https://www.nlm.nih.gov/web_policies.html | Oficial: 403. **Parcial vía** `Delapro/GUDID@9237402a` (MIT): Full Release XML 2025-05-01 filtrado por su autor a dispositivos con product code dental (812 322 registros → 3 130 de alcance diagnóstico). Los demás paneles de GUDID siguen siendo hueco. |
| FDA MAUDE (openFDA `device/event`) | https://open.fda.gov/apis/device/event/ | openFDA CC0 | Oficial: 403. **Usado vía** `Tonystathoulis/Medical-Device-Safety-Intelligence@d20a9fa8` (sin licencia declarada; datos openFDA): 1 336 combinaciones product code + fabricante + marca + modelo de alcance diagnóstico (`source` = `fda-maude`), con el informe MAUDE más antiguo como id. Además, extractos de `hayden-farquhar/MAUDE-AI-Devices` (CC BY 4.0), `arpan2217/medical-device-adverse-events`, `sarcom2/fda-device-events-elt` y `levisw/FDA-Medical-Device-Failure-Classification` (sin licencia declarada): las combinaciones repetidas se suman a la existente (`extra.alsoIn`). En `levisw` el fabricante es `MANUFACTURER_G1_NAME` (`extra.manufacturerField`). |
| FDA retiros (openFDA `device/enforcement` y `device/recall`) | https://open.fda.gov/apis/device/enforcement/ | openFDA CC0 | Oficial: 403. **Usado vía** `hxlvvm/RecallTrace@ffe8177d` (2026-10-07, CC0) y `Sarath-Venkatesan/fda-device-recalls-analytics@3e485d48` (`.xlsm` convertido con `lib/xlsx_to_ndjson.py`; sin licencia declarada): 13 692 retiros (`source` = `fda-recall`) con firma, descripción del producto, clase y motivo. |
| GMDN | https://www.gmdnagency.org/ | Nomenclatura completa sólo para miembros (licencia). | Sólo se usa lo que publica GUDID (nombre y definición del término preferido; el código si GUDID lo trae) en `extra.deviceTypes`. Nunca se baja la nomenclatura GMDN. |
| 21 CFR (títulos y rangos de subparte) | https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H | Dominio público | eCFR bloqueado desde el contenedor; títulos verificados por búsqueda web contra eCFR y Cornell LII (no se cargan datos de ahí, sólo el criterio). |

## Reglas que se cumplen

- Procedencia por fila: `source`, `sourceRecordId`, `sourceUrl` (ficha oficial FDA/NLM),
  `sourceVersion` (export oficial + espejo y commit cuando aplica), `retrievedAt` (fecha en que
  se bajó el archivo oficial, declarada por el manifiesto del espejo).
- Nada fabricado: lo que la fuente no publica queda en `null`. En el espejo de 510(k) no está
  `decision_description`, por eso `status` es `null` (el espejo sí conserva si el K-number figura
  en un listado vigente: `extra.currentlyListed`).
- No se eludió ningún bloqueo: los hosts de FDA/NLM devuelven 403 en el proxy y quedan como hueco.
  `fetch-official.mjs` los baja en cuanto el propietario los habilite.
