# Cobertura de la consolidación de equipos de diagnóstico

Generado: 2026-10-24T18:15:19Z. Se genera con `build.mjs`; no lo edite a mano.

## Regiones

| Región | Estado | Rama / carpeta | Commit | Filas leídas |
|---|---|---|---|---:|
| us | consolidada | origin/justin/seed-dx-devices-us | b699958585e5 | 215690 |
| eu | consolidada | origin/claude/adoring-curie-xdkt83 | 63de12cbc0ab | 716 |
| row | consolidada | origin/claude/inspiring-planck-xhpf4w | fef932d6f0bf | 6569701 |

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
| anvisa-produtos | row | 100681 | 100681 | 0 | 0 |
| anvisa-produtos-modelos | row | 3274089 | 3274089 | 0 | 0 |
| pmda-approvals | row | 35298 | 35298 | 0 | 0 |
| hc-mdall | row | 2333236 | 2333236 | 0 | 0 |
| tga-daen | row | 18917 | 18917 | 0 | 0 |
| cdsco-import-licences | row | 25792 | 25792 | 0 | 0 |
| tfda-devices | row | 93430 | 93430 | 0 | 0 |
| tfda-tudid | row | 688258 | 688258 | 0 | 0 |

## Taxonomía

| Medida | Valor |
|---|---:|
| Nodos | 37.274 |
| Mapeos publicados | 218 |
| Tipos de diagnóstico con al menos un modelo | 3.897 |

Product codes de la FDA: openFDA 2026-10-21 (7096) contra git:ej86/fda-ai-medical-device-analytics@8840a03632ff (2026-08-28) (7088); solo en la oficial 8, solo en la copia 0; difieren nombre 10, clase 4, regulación 4.

EMDN v2026 oficial (8516 términos) contra la V2 (8454): nuevos 74, solo en la V2 12 (quedan marcados `notInVersion`), término cambiado 148, decisión de diagnóstico cambiada 0.

| Nomenclatura | Nodos |
|---|---:|
| in:cdsco-device-name | 11.371 |
| emdn | 8.529 |
| fda-product-code | 7.099 |
| jmdn | 3.874 |
| br:anvisa-nome-tecnico | 2.867 |
| gmdn-pt | 1.743 |
| tw:tfda-classification | 1.366 |
| tw:tfda-category | 346 |
| gmdn | 79 |

| Nomenclatura:rama de diagnóstico | Nodos |
|---|---:|
| emdn:ivd | 2.275 |
| fda-product-code:ivd | 2.148 |
| fda-product-code:diagnostic | 777 |
| emdn:diagnostic | 245 |
| fda-product-code:monitoring | 198 |
| gmdn:diagnostic | 78 |
| gmdn:ivd | 1 |

| Nomenclatura:decisión:criterio | Nodos |
|---|---:|
| in:cdsco-device-name:null:null | 11.371 |
| emdn:null:null | 5.831 |
| jmdn:null:null | 3.874 |
| fda-product-code:false:cfr-non-diagnostic-subpart | 3.096 |
| br:anvisa-nome-tecnico:null:null | 2.867 |
| emdn:true:emdn-category-w | 2.275 |
| fda-product-code:true:cfr-ivd-part | 2.081 |
| gmdn-pt:null:null | 1.743 |
| tw:tfda-classification:null:null | 1.366 |
| fda-product-code:true:cfr-subpart-title | 975 |
| fda-product-code:null:no-regulation | 832 |
| tw:tfda-category:null:null | 346 |
| emdn:true:emdn-group-title-inherited | 213 |
| emdn:null:emdn-group-title-mixed-inherited | 174 |
| gmdn:true:crosswalk-published | 79 |
| fda-product-code:true:fda-review-panel-ivd | 67 |
| fda-product-code:false:cfr-blood-establishment | 37 |
| emdn:true:emdn-group-title | 32 |
| fda-product-code:false:cfr-non-device-part | 5 |
| emdn:null:emdn-group-title-mixed | 4 |
| fda-product-code:null:cfr-section-outside-verified-ranges | 4 |
| fda-product-code:null:fda-code-not-in-pcd | 2 |

## Catálogo

| Medida | Valor |
|---|---:|
| Filas de diagnóstico consolidadas | 376.114 |
| … de ellas sin tipo propio, sumadas por ser del mismo modelo | 536 |
| Filas no diagnósticas (descartadas) | 2.769 |
| Filas sin decisión (tipo sin criterio publicado) | 6.408.748 |
| … de ellas sin ningún tipo | 2.286.312 |
| Fabricantes | 21.528 |
| Marcas | 107.407 |
| Modelos | 288.325 |
| Registros | 376.114 |

| Jurisdicción | Modelos con registro |
|---|---:|
| US | 130.010 |
| BR | 113.912 |
| CA | 43.845 |
| EU | 434 |
| AU | 420 |
| IN | 42 |
| TW | 9 |

| Jurisdicciones por modelo | Modelos |
|---|---:|
| 1 | 287.984 |
| 2 | 335 |
| 3 | 6 |

## Fabricantes: fusiones y revisión

| Regla de fusión | Fusiones |
|---|---:|
| same-name-same-country | 16.082 |
| same-name-no-country | 2.044 |
| same-name-unique-country | 1.990 |
| same-registry-id | 970 |

| Caso para revisión (no fusionado) | Casos |
|---|---:|
| possible-group-shared-first-word | 9.005 |
| same-name-different-country | 1.563 |
| same-name-ambiguous-country | 514 |
| name-match-conflicting-ids | 234 |

## Listados del sector (asociaciones y ferias)

| Medida | Valor |
|---|---:|
| Organizaciones | 46 |
| Menciones con URL | 552 |
| Empresas distintas | 370 |
| … que cruzan con un fabricante de los registros | 197 |
| … solo en listados del sector (candidatas) | 173 |

