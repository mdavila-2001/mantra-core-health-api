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
| openFDA `device/classification` / `foiclass.zip` | https://download.open.fda.gov/device/classification/ · https://www.accessdata.fda.gov/premarket/ftparea/foiclass.zip | Dominio público / CC0 | Hueco: 403 del proxy. Sin ella, panel, clase y regulación salen de los propios registros, y el nombre del product code queda en `null`. |
| openFDA `device/pma` / `pma.zip` | https://download.open.fda.gov/device/pma/ | Dominio público / CC0 | Hueco: 403 del proxy. |
| openFDA `device/registrationlisting` | https://download.open.fda.gov/device/registrationlisting/ | Dominio público / CC0 | Hueco: 403 del proxy (país del fabricante, nombres propietarios por establecimiento). |
| AccessGUDID (Delimited Full Release) y openFDA `device/udi` | https://accessgudid.nlm.nih.gov/download/delimited · https://download.open.fda.gov/device/udi/ | GUDID: datos públicos de FDA/NLM sin restricción («AccessGUDID data is in the public domain»); términos NLM: https://www.nlm.nih.gov/web_policies.html | Hueco: 403 del proxy. Sin GUDID no hay UDI-DI, modelo/versión ni GMDN. |
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
