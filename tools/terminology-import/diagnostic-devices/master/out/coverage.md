# Cobertura de la consolidación de equipos de diagnóstico

Generado: 2026-10-24T20:12:37Z. Se genera con `build.mjs`; no lo edite a mano.

## Regiones

| Región | Estado | Rama / carpeta | Commit | Filas leídas |
|---|---|---|---|---:|
| us | consolidada | origin/justin/seed-dx-devices-us | b699958585e5 | 215690 |
| eu | consolidada | origin/claude/adoring-curie-xdkt83 | 0ac247f88b65 | 503648 |
| row | consolidada | origin/claude/inspiring-planck-xhpf4w | 24cbabb54cbb | 14239561 |

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
| eudamed-udi | eu | 303085 | 303085 | 0 | 0 |
| it-salute-bdrdm | eu | 200563 | 200563 | 0 | 0 |
| anvisa-produtos | row | 100681 | 100681 | 0 | 0 |
| anvisa-produtos-modelos | row | 3274089 | 3274089 | 0 | 0 |
| pmda-approvals | row | 35298 | 35298 | 0 | 0 |
| hc-mdall | row | 2333236 | 2333236 | 0 | 0 |
| tga-daen | row | 18917 | 18917 | 0 | 0 |
| cdsco-approved-devices | row | 180124 | 180124 | 0 | 0 |
| tfda-devices | row | 93430 | 93430 | 0 | 0 |
| tfda-tudid | row | 688258 | 688258 | 0 | 0 |
| invima-dispositivos | row | 71434 | 71434 | 0 | 0 |
| who-pq-ivd | row | 435 | 435 | 0 | 0 |
| hsa-smdr | row | 20857 | 20857 | 0 | 0 |
| hsa-class-a | row | 1127525 | 1127525 | 0 | 0 |
| nmpa-udi | row | 6294994 | 6294994 | 0 | 0 |
| sahpra-covid-ivd | row | 283 | 283 | 0 | 0 |

## Taxonomía

| Medida | Valor |
|---|---:|
| Nodos | 106.607 |
| Mapeos publicados | 218 |
| Tipos de diagnóstico con al menos un modelo | 6.372 |
| Tipos (con o sin decisión) en modelos del catálogo | 47.946 |

Product codes de la FDA: openFDA 2026-10-21 (7096) contra git:ej86/fda-ai-medical-device-analytics@8840a03632ff (2026-08-28) (7088); solo en la oficial 8, solo en la copia 0; difieren nombre 10, clase 4, regulación 4.

EMDN v2026 oficial (8516 términos) contra la V2 (8454): nuevos 74, solo en la V2 12 (quedan marcados `notInVersion`), término cambiado 148, decisión de diagnóstico cambiada 0.

| Nomenclatura | Nodos |
|---|---:|
| in:cdsco-device-name | 75.151 |
| emdn | 8.529 |
| fda-product-code | 7.099 |
| jmdn | 3.874 |
| cn:nmpa-classification | 3.216 |
| br:anvisa-nome-tecnico | 2.867 |
| cnd | 2.299 |
| gmdn-pt | 1.743 |
| tw:tfda-classification | 1.366 |
| tw:tfda-category | 346 |
| gmdn | 79 |
| sg:hsa-speciality | 19 |
| who:assay-format | 11 |
| co:invima-grupo | 4 |
| za:sahpra-covid-test-kit-list | 4 |

| Nomenclatura:rama de diagnóstico | Nodos |
|---|---:|
| emdn:ivd | 2.275 |
| fda-product-code:ivd | 2.148 |
| cnd:ivd | 1.681 |
| fda-product-code:diagnostic | 777 |
| emdn:diagnostic | 245 |
| fda-product-code:monitoring | 198 |
| gmdn:diagnostic | 78 |
| co:invima-grupo:ivd | 2 |
| gmdn:ivd | 1 |

| Nomenclatura:decisión:criterio | Nodos |
|---|---:|
| in:cdsco-device-name:null:null | 75.151 |
| emdn:null:null | 5.831 |
| jmdn:null:null | 3.874 |
| cn:nmpa-classification:null:null | 3.216 |
| fda-product-code:false:cfr-non-diagnostic-subpart | 3.096 |
| br:anvisa-nome-tecnico:null:null | 2.867 |
| emdn:true:emdn-category-w | 2.275 |
| fda-product-code:true:cfr-ivd-part | 2.081 |
| gmdn-pt:null:null | 1.743 |
| cnd:true:cnd-category-w | 1.681 |
| tw:tfda-classification:null:null | 1.366 |
| fda-product-code:true:cfr-subpart-title | 975 |
| fda-product-code:null:no-regulation | 832 |
| cnd:null:null | 618 |
| tw:tfda-category:null:null | 346 |
| emdn:true:emdn-group-title-inherited | 213 |
| emdn:null:emdn-group-title-mixed-inherited | 174 |
| gmdn:true:crosswalk-published | 79 |
| fda-product-code:true:fda-review-panel-ivd | 67 |
| fda-product-code:false:cfr-blood-establishment | 37 |
| emdn:true:emdn-group-title | 32 |
| sg:hsa-speciality:null:null | 19 |
| who:assay-format:null:null | 11 |
| fda-product-code:false:cfr-non-device-part | 5 |
| emdn:null:emdn-group-title-mixed | 4 |
| fda-product-code:null:cfr-section-outside-verified-ranges | 4 |
| za:sahpra-covid-test-kit-list:null:null | 4 |
| co:invima-grupo:null:null | 2 |
| co:invima-grupo:true:invima-grupo-ivd | 2 |
| fda-product-code:null:fda-code-not-in-pcd | 2 |

## Catálogo

| Medida | Valor |
|---|---:|
| Filas de diagnóstico consolidadas | 1.110.490 |
| … de ellas sin tipo propio, sumadas por ser del mismo modelo | 7.350 |
| Filas no diagnósticas (descartadas) | 2.769 |
| Filas sin decisión (tipo sin criterio publicado) | 13.847.164 |
| … de ellas sin ningún tipo | 3.413.059 |
| Fabricantes | 27.736 |
| Marcas | 316.241 |
| Modelos | 729.132 |
| Registros | 1.110.490 |

| Jurisdicción | Modelos con registro |
|---|---:|
| EU | 181.668 |
| US | 130.393 |
| IT | 118.098 |
| BR | 113.974 |
| CN | 95.911 |
| IN | 45.419 |
| CA | 44.314 |
| TW | 3.797 |
| CO | 3.212 |
| WHO | 435 |
| AU | 420 |
| SG | 318 |
| ZA | 217 |

| Jurisdicciones por modelo | Modelos |
|---|---:|
| 1 | 720.310 |
| 2 | 8.611 |
| 3 | 200 |
| 4 | 11 |

## Fabricantes: fusiones y revisión

| Regla de fusión | Fusiones |
|---|---:|
| same-name-same-country | 23.715 |
| same-name-no-country | 5.758 |
| same-name-unique-country | 4.561 |
| same-registry-id | 1.019 |

| Caso para revisión (no fusionado) | Casos |
|---|---:|
| possible-group-shared-first-word | 8.946 |
| same-name-different-country | 2.277 |
| same-name-ambiguous-country | 1.260 |
| name-match-conflicting-ids | 510 |

## Listados del sector (asociaciones y ferias)

| Medida | Valor |
|---|---:|
| Organizaciones | 46 |
| Menciones con URL | 552 |
| Empresas distintas | 370 |
| … que cruzan con un fabricante de los registros | 221 |
| … solo en listados del sector (candidatas) | 149 |

