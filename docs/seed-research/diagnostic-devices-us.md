# Equipos de diagnóstico registrados ante FDA — bitácora de búsqueda, saturación y cobertura

Rama `justin/seed-dx-devices-us` (espejo de `claude/compassionate-brown-tr71nn`) · importador en
`tools/terminology-import/diagnostic-devices/us/` · fuentes y licencias en
`tools/terminology-import/diagnostic-devices/us/SOURCES.md` · plan y reporte en
[`PLAN.md`](../trabajo/2026-10-24-seed-dx-devices-us/PLAN.md) y
[`REPORTE.md`](../trabajo/2026-10-24-seed-dx-devices-us/REPORTE.md).

Pedido del propietario: «que investigue profundamente todos y cada uno de los equipos de
diagnóstico con todos los posibles proveedores que lo ofrecen en el mundo (marcas)… ultra
detallado… que el corpus sea abrumadoramente grande y que sea imposible encontrar más en
internet». Esta sesión es la dueña de los registros de **EE. UU. (FDA)**.

## Red de esta sesión

El contenedor sólo alcanza GitHub (git y `raw.githubusercontent.com`), GitLab, Bitbucket, npm,
PyPI (archivos), Maven Central, RubyGems, conda, S3 y GCS. Devuelven 403 en el proxy o no
resuelven (sondeado el 2026-10-24): `accessgudid.nlm.nih.gov`, `accessgudid.awsprod.nlm.nih.gov`,
`api.fda.gov`, `download.open.fda.gov`, `www.accessdata.fda.gov`, `www.fda.gov`, `www.ecfr.gov`,
`www.govinfo.gov`, `www.nber.org`, `catalog.data.gov`, `healthdata.gov`, `www.datalumos.org`,
`download.cms.gov`, `openpaymentsdata.cms.gov`, `huggingface.co`, `www.kaggle.com`, `zenodo.org`,
`figshare.com`, `dataverse.harvard.edu`, `archive.org`, `web.archive.org`, `query.wikidata.org`,
`api.github.com` (salvo los repos de la sesión). `pypi.org/search` responde con un desafío
JavaScript: no se intentó pasarlo.

Consecuencia: las fuentes oficiales se reemplazan por **espejos públicos fijados por commit**
que declaran la URL oficial, la fecha de exportación y (cuando la publican) el sha256 del
archivo oficial. No se probó ningún host alternativo de FDA (por ejemplo, el bucket de openFDA
vía `s3.amazonaws.com`): sería el mismo origen bloqueado con otro nombre. La búsqueda web (del
lado del servidor) se usó **sólo para descubrir fuentes y verificar criterios**; ningún dato que
pase por un resumen de modelo se cargó.

## Pasadas (protocolo de saturación)

Aportes nuevos contados tras deduplicar por `source` + `sourceRecordId` (K-number, PMA +
nombre comercial, UDI-DI); entre vías, gana la oficial. Fabricantes por razón social normalizada
exacta (`manufacturerKey`), marcas por fabricante + nombre comercial exacto. Nunca por parecido.

| # | Fecha | Fuentes | Registros nuevos | Fabricantes nuevos | Marcas nuevas | Descartadas en la pasada (motivo) |
|---|---|---|---|---|---|---|
| 1 | 2026-10-24 | openFDA `device/510k` export 2026-08-10, espejo `choiben314/510k-lineage@806b59cb` (`dataset/devices.csv`, 175 757 filas) | 71 760 (71 523 510(k) + 237 De Novo) | 12 453 | 68 352 | 104 000 filas fuera de alcance (implantes, quirúrgicos, terapéuticos…); npm y PyPI (sólo clientes de API, sin datos); `pypi.org/search` (desafío JS) |
| 2 | 2026-10-24 | FDA `foiclass.zip` crudo, espejo `ej86/fda-ai-medical-device-analytics@8840a036` (7 088 product codes) · paquete R `bjoleary/fdadata@227bdaa2` (archivos de descarga FDA `pmn*.zip`, `pma.zip`, `foiclass.zip`, «accessed 2026-10-20»: 176 466 510(k)/De Novo con dirección y país, 57 373 PMA con suplementos, 7 097 product codes) · lista FDA «AI-Enabled Medical Devices» (1 524, espejo ej86) | 3 081 (2 646 PMA + 432 510(k) + 3 De Novo) · además: nombre FDA del tipo en 3 268 de 3 270 product codes y país en 72 195 registros | 121 | 3 710 | `premarket.rda` (une `pmn` y `pma`: duplicado); país de `pma.rda` (fdadata pone `USA` a todos: no es dato de FDA, queda sólo en `extra.countryAsPublished`); 230 product codes retirados que sólo aparecen en 510(k) viejos sin clasificación publicada |
| 3 | 2026-10-24 | AccessGUDID **Full Release XML 2025-05-01** filtrado a especialidad dental, espejo `Delapro/GUDID@9237402a` (20 zip, 812 322 registros de dispositivo) | 3 130 UDI-DI (radiología dental extraoral/intraoral, portapelículas, seguimiento mandibular, procesamiento de imagen, probadores pulpares, detectores de caries…) con modelo, DUNS, 510(k) y GMDN con código | 71 | 809 | 809 192 registros dentales fuera de alcance (implantes, prótesis, instrumental); el resto de GUDID (otros paneles) no tiene espejo público alcanzable. Se conservan tal cual los product codes que declara el etiquetador, aunque alguno sea dudoso (p. ej. un TENS declarado como `MUH`): GUDID es declaración del fabricante |
| 4 | 2026-10-24 | Lista FDA «Nucleic Acid Based Tests» por patógeno, `double-strand/IVDmicrobialNAATregistry@6cdd1e5e` (456 filas, 255 K-numbers) · listas FDA de IA `lotterlab/fda_ai_search@adcdeda1` (1 248) y `dcxht/ValidMed@4f9c75f3` (1 430) · subconjunto openFDA de neurología `mehulseth/bci-fda-rnpv@df4f768c` (6 176) | **0** (sólo enriquecimiento: 253 510(k) moleculares con `extra.fdaNaatList`, patógenos con TaxID de NCBI y tecnología) | 0 | 0 | `K133448` y `K133883` de la lista NAAT no están en ningún archivo de descarga FDA alcanzable: sin fabricante ni product code verificable, no se crean filas; `P140011/S008` de ValidMed, ídem; listas de IA y neurología: todos sus envíos ya estaban (subconjuntos de pmn/pma) |
