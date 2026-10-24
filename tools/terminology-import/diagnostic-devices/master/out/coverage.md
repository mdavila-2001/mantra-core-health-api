# Cobertura de la consolidación de equipos de diagnóstico

Generado: 2026-10-24T03:59:13Z. Se genera con `build.mjs`; no lo edite a mano.

## Regiones

| Región | Estado | Rama / carpeta | Commit | Filas leídas |
|---|---|---|---|---:|
| us | consolidada | origin/justin/seed-dx-devices-us | 3ba3358ecbcc | 189072 |
| eu | consolidada | origin/claude/adoring-curie-xdkt83 | e1601ac209c9 | 716 |
| row | pendiente | ninguna rama remota tiene tools/terminology-import/diagnostic-devices/row/out/manifest.json |  | 0 |

## Fuentes

| Fuente | Región | Leídas | Válidas | Inválidas | Duplicadas |
|---|---|---:|---:|---:|---:|
| fda-ai-enabled-devices | master | 1524 | 1524 | 0 | 0 |
| fda-510k | us | 71955 | 71955 | 0 | 0 |
| fda-denovo | us | 240 | 240 | 0 | 0 |
| fda-pma | us | 2646 | 2646 | 0 | 0 |
| fda-rl | us | 110614 | 110614 | 0 | 0 |
| fda-gudid | us | 3130 | 3130 | 0 | 0 |
| cdc-livd-sars-cov-2 | us | 487 | 483 | 4 | 0 |
| eudamed-udi | eu | 716 | 716 | 0 | 0 |

## Taxonomía

| Medida | Valor |
|---|---:|
| Nodos | 15.625 |
| Mapeos publicados | 218 |
| Tipos de diagnóstico con al menos un modelo | 2.976 |

| Nomenclatura | Nodos |
|---|---:|
| emdn | 8.455 |
| fda-product-code | 7.091 |
| gmdn | 79 |

| Nomenclatura:rama de diagnóstico | Nodos |
|---|---:|
| emdn:ivd | 2.263 |
| fda-product-code:ivd | 2.147 |
| fda-product-code:diagnostic | 777 |
| emdn:diagnostic | 229 |
| fda-product-code:monitoring | 198 |
| gmdn:diagnostic | 78 |
| gmdn:ivd | 1 |

| Nomenclatura:decisión:criterio | Nodos |
|---|---:|
| emdn:null:null | 5.786 |
| fda-product-code:false:cfr-non-diagnostic-subpart | 3.089 |
| emdn:true:emdn-category-w | 2.263 |
| fda-product-code:true:cfr-ivd-part | 2.076 |
| fda-product-code:true:cfr-subpart-title | 975 |
| fda-product-code:null:no-regulation | 831 |
| emdn:true:emdn-group-title-inherited | 199 |
| emdn:null:emdn-group-title-mixed-inherited | 173 |
| gmdn:true:crosswalk-published | 79 |
| fda-product-code:true:fda-review-panel-ivd | 71 |
| fda-product-code:false:cfr-blood-establishment | 37 |
| emdn:true:emdn-group-title | 30 |
| fda-product-code:false:cfr-non-device-part | 5 |
| emdn:null:emdn-group-title-mixed | 4 |
| fda-product-code:null:cfr-section-outside-verified-ranges | 4 |
| fda-product-code:null:fda-code-not-in-pcd | 3 |

## Catálogo

| Medida | Valor |
|---|---:|
| Filas de diagnóstico consolidadas | 186.837 |
| Filas no diagnósticas (descartadas) | 2.371 |
| Filas sin decisión (tipo sin criterio publicado) | 2.100 |
| … de ellas sin ningún tipo | 483 |
| Fabricantes | 18.978 |
| Marcas | 71.481 |
| Modelos | 81.440 |
| Registros | 186.837 |

| Jurisdicción | Modelos con registro |
|---|---:|
| US | 81.011 |
| EU | 429 |

| Jurisdicciones por modelo | Modelos |
|---|---:|
| 1 | 81.440 |

## Fabricantes: fusiones y revisión

| Regla de fusión | Fusiones |
|---|---:|
| same-name-same-country | 4.843 |
| same-name-unique-country | 716 |
| same-name-no-country | 250 |
| same-registry-id | 107 |

| Caso para revisión (no fusionado) | Casos |
|---|---:|
| possible-group-shared-first-word | 5.091 |
| same-name-different-country | 827 |
| name-match-conflicting-ids | 233 |
| same-name-ambiguous-country | 104 |

## Listados del sector (asociaciones y ferias)

| Medida | Valor |
|---|---:|
| Organizaciones | 46 |
| Menciones con URL | 552 |
| Empresas distintas | 370 |
| … que cruzan con un fabricante de los registros | 148 |
| … solo en listados del sector (candidatas) | 222 |

