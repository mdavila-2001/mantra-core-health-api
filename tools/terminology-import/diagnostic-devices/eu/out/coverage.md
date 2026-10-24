# Cobertura — equipos de diagnóstico, registros de Europa

Generado: 2026-10-24T03:48:43.597Z

| Métrica | Valor |
|---|---|
| Filas leídas de las fuentes | 22981 |
| Filas exportadas (tras deduplicar) | 716 |
| · en alcance diagnóstico | 716 |
| Duplicados descartados | 157 |
| Filas rechazadas por formato | 0 |
| Fabricantes distintos | 114 |
| Marcas distintas (fabricante + marca) | 391 |
| Conceptos EMDN cargados | 8453 |
| Conceptos EMDN en alcance | 3121 |
| Tipos terminales en alcance sin ningún equipo | 2521 |

## Filas por fuente
| Fuente | Filas |
|---|---|
| eudamed-udi | 716 |

## Filas por regla de alcance
| Regla | Filas |
|---|---|
| categoria-incluida:W | 310 |
| tipo-incluido:Z120208 | 73 |
| tipo-incluido:Z120210 | 54 |
| tipo-incluido:Z1104 | 42 |
| tipo-incluido:Z120302 | 34 |
| tipo-incluido:Z119008 | 30 |
| tipo-incluido:Z120801 | 28 |
| tipo-incluido:V03 | 26 |
| tipo-incluido:U05 | 24 |
| tipo-incluido:G0206 | 22 |
| tipo-incluido:Z1106 | 19 |
| tipo-incluido:Z120204 | 10 |
| tipo-incluido:Z120207 | 9 |
| tipo-incluido:Z121605 | 9 |
| tipo-incluido:Z121201 | 7 |
| tipo-incluido:Z121604 | 7 |
| tipo-incluido:Z1103 | 4 |
| tipo-incluido:Z120505 | 3 |
| tipo-incluido:Z120205 | 2 |
| tipo-incluido:Z1215 | 2 |
| tipo-incluido:C0205 | 1 |

## Filas por categoría EMDN
| Categoría | Filas |
|---|---|
| Z | 333 |
| W | 310 |
| V | 26 |
| U | 24 |
| G | 22 |
| C | 1 |

## Filas por grupo EMDN
| Grupo | Filas |
|---|---|
| W01 | 272 |
| Z12 | 238 |
| Z11 | 95 |
| V03 | 26 |
| U05 | 24 |
| W05 | 23 |
| G02 | 22 |
| W02 | 15 |
| C02 | 1 |

## Filas no exportadas por regla de alcance
| Regla | Filas |
|---|---|
| categoria-excluida:M | 3159 |
| categoria-excluida:Y | 3051 |
| categoria-excluida:T | 2684 |
| no-diagnostico-tras-revision:V | 2163 |
| categoria-excluida:A | 1610 |
| categoria-excluida:P | 1516 |
| categoria-excluida:L | 1389 |
| no-diagnostico-tras-revision:G | 1218 |
| no-diagnostico-tras-revision:R | 1181 |
| categoria-excluida:S | 859 |
| no-diagnostico-tras-revision:Q | 729 |
| categoria-excluida:K | 708 |
| no-diagnostico-tras-revision:U | 563 |
| no-diagnostico-tras-revision:Z | 493 |
| no-diagnostico-tras-revision:N | 305 |
| categoria-excluida:H | 222 |
| no-diagnostico-tras-revision:C | 93 |
| categoria-excluida:B | 90 |
| categoria-excluida:D | 55 |
| categoria-excluida:F | 20 |

## Alcance EMDN
- Incluidas enteras: W
- Tipos incluidos fuera de W: 79
- Revisadas tipo por tipo: C, G, N, Q, R, U, V, Z (ver out/emdn-scope-review.md)
- Excluidas enteras: A, B, D, F, H, J, K, L, M, P, S, T, X, Y

## Huecos
**Bloqueadas por la política de red del entorno** (sondeo 2026-10-24T03:35:41.135Z): `health.ec.europa.eu`, `api.datalake.sante.service.ec.europa.eu`, `ec.europa.eu`, `pard.mhra.gov.uk`, `swissdamed.ch`, `www.dati.salute.gov.it`, `www.dati.salute.gov.it`, `webgate.ec.europa.eu`, `www.bfarm.de`, `www.aemps.gob.es`, `ansm.sante.fr`.

Hosts a habilitar: `ansm.sante.fr`, `api.datalake.sante.service.ec.europa.eu`, `ec.europa.eu`, `health.ec.europa.eu`, `pard.mhra.gov.uk`, `swissdamed.ch`, `webgate.ec.europa.eu`, `www.aemps.gob.es`, `www.bfarm.de`, `www.dati.salute.gov.it`.

| Fuente | Motivo | Nota |
|---|---|---|
| EUDAMED_PORTAL | sin descarga automática | Sin términos específicos leídos para la API interna. No se descarga en bloque hasta verificar el aviso legal del portal; el Data Lake es la vía oficial. |
| MHRA_PARD | sin descarga automática | Contenido de gov.uk suele publicarse bajo Open Government Licence v3.0; pendiente confirmar que aplica a PARD y que la exportación masiva está permitida. |
| SWISSDAMED | sin descarga automática | Las condiciones generales del sitio de Swissmedic prohíben reproducir su información sin autorización expresa y mencionan expresamente la extracción automatizada (scraping/data mining). No se pudo confirmar si rigen para swissdamed. Hasta confirmarlo NO se descarga ni se usa ningún dato derivado de swissdamed (incluido csv/srn_unique.csv de swissdamed2sqlite). |
| NANDO | sin descarga automática | Reutilización con atribución (Decisión 2011/833/UE), pendiente confirmar en el aviso legal del sitio. |
| DE_BFARM | sin descarga automática | No evaluado: no hay descarga pública. |
| ES_AEMPS | sin descarga automática | No evaluado: no hay descarga pública. |
| FR_ANSM | sin descarga automática | No aplica. |
| EMDN | bloqueado por la política de red del entorno (proxy 403) |  |
| EUDAMED_DATALAKE | bloqueado por la política de red del entorno (proxy 403) |  |
| IT_BDRDM | bloqueado por la política de red del entorno (proxy 403) |  |
| IT_CND | bloqueado por la política de red del entorno (proxy 403) |  |
| eudamed-udi | paginación incompleta en caché (se volverá a pedir) |  |
