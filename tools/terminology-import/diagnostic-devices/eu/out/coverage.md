# Cobertura — equipos de diagnóstico, registros de Europa

Generado: 2026-10-24T03:12:03.872Z

| Métrica | Valor |
|---|---|
| Filas leídas de las fuentes | 0 |
| Equipos en alcance (tras deduplicar) | 0 |
| Duplicados descartados | 0 |
| Fabricantes distintos | 0 |
| Marcas distintas (fabricante + marca) | 0 |
| Conceptos EMDN cargados | 0 |
| Conceptos EMDN en alcance | 0 |
| Tipos terminales en alcance sin ningún equipo | 0 |

## Equipos por fuente
| Fuente | Equipos |
|---|---|
| — | 0 |

## Equipos por categoría EMDN
| Categoría | Equipos |
|---|---|
| — | 0 |

## Equipos por grupo EMDN
| Grupo | Equipos |
|---|---|
| — | 0 |

## Filas excluidas por regla de alcance
| Regla | Filas |
|---|---|
| — | 0 |

## Alcance EMDN
- Incluidas enteras: W
- Tipos incluidos fuera de W: ninguno todavía
- En revisión tipo por tipo: C, G, N, Q, R, U, V, Z
- Excluidas enteras: A, B, D, F, H, J, K, L, M, P, S, T, X, Y

## Huecos
**Bloqueadas por la política de red del entorno** (sondeo 2026-10-24T03:11:54.583Z): `health.ec.europa.eu`, `api.datalake.sante.service.ec.europa.eu`, `ec.europa.eu`, `pard.mhra.gov.uk`, `swissdamed.ch`, `www.dati.salute.gov.it`, `www.dati.salute.gov.it`, `webgate.ec.europa.eu`, `www.bfarm.de`, `www.aemps.gob.es`, `ansm.sante.fr`.

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
| EUDAMED_DATALAKE | paginación incompleta en caché (se volverá a pedir) |  |
| EMDN | EMDN no disponible en caché |  |
