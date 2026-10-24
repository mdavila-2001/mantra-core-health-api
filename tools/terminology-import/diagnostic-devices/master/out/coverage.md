# Cobertura de la consolidación de equipos de diagnóstico

Generado: 2026-10-24T16:08:46Z. Se genera con `build.mjs`; no lo edite a mano.

## Regiones

| Región | Estado | Rama / carpeta | Commit | Filas leídas |
|---|---|---|---|---:|
| us | consolidada | origin/justin/seed-dx-devices-us | b699958585e5 | 215690 |
| eu | consolidada | origin/claude/adoring-curie-xdkt83 | 2e7f6e46f8db | 716 |
| row | consolidada | origin/claude/inspiring-planck-xhpf4w | 33e67ca12cc5 | 3534775 |

## Fuentes

| Fuente | Región | Leídas | Válidas | Inválidas | Duplicadas |
|---|---|---:|---:|---:|---:|
| fda-ai-enabled-devices | master | 1524 | 1524 | 0 | 0 |
| fda-510k | us | 71955 | 71955 | 0 | 0 |
| fda-denovo | us | 240 | 240 | 0 | 0 |
| fda-pma | us | 2646 | 2646 | 0 | 0 |
| fda-rl | us | 110614 | 110614 | 0 | 0 |
| fda-gudid | us | 3130 | 3130 | 0 | 0 |
| fda-maude | us | 12930 | 12930 | 0 | 0 |
| fda-recall | us | 13692 | 13692 | 0 | 0 |
| cdc-livd-sars-cov-2 | us | 483 | 483 | 0 | 0 |
| eudamed-udi | eu | 716 | 716 | 0 | 0 |
| anvisa-produtos | row | 93770 | 93770 | 0 | 0 |
| anvisa-produtos-modelos | row | 1027762 | 1027762 | 0 | 0 |
| pmda-approvals | row | 35298 | 35298 | 0 | 0 |
| hc-mdall | row | 2333236 | 2333236 | 0 | 0 |
| tga-daen | row | 18917 | 18917 | 0 | 0 |
| cdsco-import-licences | row | 25792 | 25792 | 0 | 0 |

## Taxonomía

| Medida | Valor |
|---|---:|
| Nodos | 33.624 |
| Mapeos publicados | 218 |
| Tipos de diagnóstico con al menos un modelo | 3.039 |

| Nomenclatura | Nodos |
|---|---:|
| in:cdsco-device-name | 11.371 |
| emdn | 8.455 |
| fda-product-code | 7.099 |
| br:anvisa-nome-tecnico | 2.785 |
| jmdn | 2.092 |
| gmdn-pt | 1.743 |
| gmdn | 79 |

| Nomenclatura:rama de diagnóstico | Nodos |
|---|---:|
| emdn:ivd | 2.263 |
| fda-product-code:ivd | 2.148 |
| fda-product-code:diagnostic | 777 |
| emdn:diagnostic | 229 |
| fda-product-code:monitoring | 198 |
| gmdn:diagnostic | 78 |
| gmdn:ivd | 1 |

| Nomenclatura:decisión:criterio | Nodos |
|---|---:|
| in:cdsco-device-name:null:null | 11.371 |
| emdn:null:null | 5.786 |
| fda-product-code:false:cfr-non-diagnostic-subpart | 3.096 |
| br:anvisa-nome-tecnico:null:null | 2.785 |
| emdn:true:emdn-category-w | 2.263 |
| jmdn:null:null | 2.092 |
| fda-product-code:true:cfr-ivd-part | 2.077 |
| gmdn-pt:null:null | 1.743 |
| fda-product-code:true:cfr-subpart-title | 975 |
| fda-product-code:null:no-regulation | 832 |
| emdn:true:emdn-group-title-inherited | 199 |
| emdn:null:emdn-group-title-mixed-inherited | 173 |
| gmdn:true:crosswalk-published | 79 |
| fda-product-code:true:fda-review-panel-ivd | 71 |
| fda-product-code:false:cfr-blood-establishment | 37 |
| emdn:true:emdn-group-title | 30 |
| fda-product-code:false:cfr-non-device-part | 5 |
| emdn:null:emdn-group-title-mixed | 4 |
| fda-product-code:null:cfr-section-outside-verified-ranges | 4 |
| fda-product-code:null:fda-code-not-in-pcd | 2 |

## Catálogo

| Medida | Valor |
|---|---:|
| Filas de diagnóstico consolidadas | 261.340 |
| … de ellas sin tipo propio, sumadas por ser del mismo modelo | 400 |
| Filas no diagnósticas (descartadas) | 2.769 |
| Filas sin decisión (tipo sin criterio publicado) | 3.488.596 |
| … de ellas sin ningún tipo | 2.286.254 |
| Fabricantes | 20.755 |
| Marcas | 88.949 |
| Modelos | 175.071 |
| Registros | 261.340 |

| Jurisdicción | Modelos con registro |
|---|---:|
| US | 130.412 |
| CA | 43.847 |
| EU | 434 |
| AU | 420 |
| BR | 241 |
| IN | 39 |

| Jurisdicciones por modelo | Modelos |
|---|---:|
| 1 | 174.756 |
| 2 | 308 |
| 3 | 7 |

## Fabricantes: fusiones y revisión

| Regla de fusión | Fusiones |
|---|---:|
| same-name-same-country | 10.756 |
| same-name-no-country | 2.014 |
| same-name-unique-country | 1.957 |
| same-registry-id | 109 |

| Caso para revisión (no fusionado) | Casos |
|---|---:|
| possible-group-shared-first-word | 7.712 |
| same-name-different-country | 1.244 |
| same-name-ambiguous-country | 461 |
| name-match-conflicting-ids | 233 |

## Listados del sector (asociaciones y ferias)

| Medida | Valor |
|---|---:|
| Organizaciones | 46 |
| Menciones con URL | 552 |
| Empresas distintas | 370 |
| … que cruzan con un fabricante de los registros | 194 |
| … solo en listados del sector (candidatas) | 176 |

