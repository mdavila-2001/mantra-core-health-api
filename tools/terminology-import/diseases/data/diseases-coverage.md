## Pasadas (nuevos = sin cruce publicado de equivalencia hacia una pasada anterior)

| Pasada | Fuente | Tipo | Versión | Ítems | Conceptos nuevos | Entidades nuevas |
|---|---|---|---|---:|---:|---:|
| 1 | `mondo` | ontología | 2026-10-06 | 23774 | 23774 | 20495 |
| 2 | `orphanet` | ontología | 2026-06-23 | 9757 | 1534 | 1533 |
| 3 | `doid` | ontología | 2026-09-30 | 12335 | 277 | 277 |
| 4 | `ncit-disease` | ontología | 26.02d | 22379 | 14511 | 14511 |
| 5 | `icd11-mms` | ontología | 2026-01 | 37052 | 29257 | 23811 |
| 6 | `efo-disease` | ontología | 3.95.0 | 1159 | 495 | 495 |
| 7 | `hpo-annotations` | claves citadas | — | 12880 | 67 | 67 |
| 8 | `nando` | medida (no se carga) | — | 2768 | 685 | 685 |
| 9 | `phenopacket-store` | claves citadas | — | 780 | 1 | 1 |
| 10 | `oncotree` | medida (no se carga) | — | 865 | 189 | 189 |
| 11 | `hetionet` | medida (no se carga) | — | 137 | 0 | 0 |
| 12 | `who-icd10-to-icd11` | claves citadas | — | 12597 | 886 | 886 |
| 13 | `mesh-c` | medida (no se carga) | — | 5067 | 1562 | 1562 |
| 14 | `gard` | medida (no se carga) | — | 6109 | 2598 | 2598 |
| 15 | `hpo-common-diseases` | claves citadas | — | 3647 | 394 | 394 |
| 16 | `monarch-clingen` | medida (no se carga) | — | 118 | 0 | 0 |
| 17 | `monarch-clinvar` | medida (no se carga) | — | 5052 | 0 | 0 |
| 18 | `monarch-alliance` | medida (no se carga) | — | 2160 | 0 | 0 |
| 19 | `monarch-cureid` | medida (no se carga) | — | 25 | 0 | 0 |

## Conceptos por sistema

| Sistema | Clave cruzada | Conceptos | Vigentes | Con nombre ES | Con definición | Definición ES |
|---|---|---:|---:|---:|---:|---:|
| `decipher` | sí | 61 | 61 | 0 | 0 | 0 |
| `doid` | no | 14854 | 12335 | 0 | 10684 | 0 |
| `efo-disease` | no | 1159 | 1159 | 0 | 1133 | 0 |
| `icd10-who` | sí | 12640 | 12640 | 0 | 0 | 0 |
| `icd11-foundation` | sí | 4631 | 4631 | 0 | 0 | 0 |
| `icd11-mms` | no | 37052 | 37052 | 0 | 0 | 0 |
| `mesh` | sí | 9320 | 9320 | 0 | 0 | 0 |
| `mondo` | no | 27695 | 23774 | 0 | 16927 | 0 |
| `ncit-disease` | no | 22379 | 22379 | 0 | 22376 | 0 |
| `omim` | sí | 10871 | 10871 | 0 | 0 | 0 |
| `orphanet` | no | 11645 | 9757 | 11645 | 6898 | 6868 |
| `umls` | sí | 32589 | 32589 | 0 | 0 | 0 |

## Cobertura contra MONDO

| Sistema | Vigentes | Enlazados a MONDO | % |
|---|---:|---:|---:|
| `orphanet` | 9757 | 8223 | 84.3 |
| `doid` | 12335 | 12055 | 97.7 |
| `ncit-disease` | 22379 | 7849 | 35.1 |
| `icd11-mms` | 37052 | 7723 | 20.8 |
| `efo-disease` | 1159 | 443 | 38.2 |

MONDO vigentes con al menos una equivalencia publicada hacia otro sistema cargado: 17923.

## CIE-11 MMS por capítulo

| Capítulo | Bloques | Categorías | Categorías enlazadas a MONDO |
|---|---:|---:|---:|
| 01 Certain infectious or parasitic diseases | 43 | 1025 | 630 |
| 02 Neoplasms | 42 | 1247 | 862 |
| 03 Diseases of the blood or blood-forming organs | 13 | 262 | 160 |
| 04 Diseases of the immune system | 6 | 257 | 202 |
| 05 Endocrine, nutritional or metabolic diseases | 25 | 637 | 467 |
| 06 Mental, behavioural or neurodevelopmental disorders | 25 | 858 | 445 |
| 07 Sleep-wake disorders | 6 | 79 | 64 |
| 08 Diseases of the nervous system | 28 | 842 | 581 |
| 09 Diseases of the visual system | 25 | 703 | 488 |
| 10 Diseases of the ear or mastoid process | 13 | 151 | 79 |
| 11 Diseases of the circulatory system | 24 | 583 | 306 |
| 12 Diseases of the respiratory system | 8 | 344 | 190 |
| 13 Diseases of the digestive system | 26 | 970 | 647 |
| 14 Diseases of the skin | 77 | 785 | 469 |
| 15 Diseases of the musculoskeletal system or connective tissue | 15 | 426 | 149 |
| 16 Diseases of the genitourinary system | 19 | 545 | 243 |
| 17 Conditions related to sexual health | 3 | 68 | 0 |
| 18 Pregnancy, childbirth or the puerperium | 9 | 522 | 32 |
| 19 Certain conditions originating in the perinatal period | 17 | 625 | 110 |
| 20 Developmental anomalies | 30 | 1323 | 1049 |
| 21 Symptoms, signs or clinical findings, not elsewhere classified | 47 | 1241 | 249 |
| 22 Injury, poisoning or certain other consequences of external causes | 30 | 1982 | 90 |
| 23 External causes of morbidity or mortality | 85 | 909 | 9 |
| 24 Factors influencing health status or contact with health services | 45 | 851 | 0 |
| 25 Codes for special purposes | 2 | 20 | 8 |
| 26 Supplementary Chapter Traditional Medicine Conditions | 125 | 1120 | 0 |
| V Supplementary section for functioning assessment | 28 | 130 | 0 |
| X Extension Codes | 544 | 17159 | 145 |

## orphanet por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| Orphanet classification of rare genetic diseases | 6763 |
| Orphanet classification of rare developmental anomalies during embryogenesis | 3654 |
| Orphanet classification of rare neurological diseases | 3376 |
| Orphanet classification of rare transplant-related disorders | 1647 |
| Orphanet classification of rare ophthalmic disorders | 1282 |
| Orphanet classification of rare inborn errors of metabolism | 1123 |
| Orphanet classification of rare neoplastic diseases | 1120 |
| Orphanet classification of rare skin diseases | 1048 |
| Orphanet classification of rare bone diseases | 904 |
| Orphanet classification of rare endocrine diseases | 700 |
| Orphanet classification of rare hematological diseases | 627 |
| Orphanet classification of rare renal diseases | 498 |
| Orphanet classification of rare otorhinolaryngological diseases | 457 |
| Orphanet classification of rare immunological diseases | 422 |
| Orphanet classification of rare gastroenterological diseases | 379 |
| Orphanet classification of rare circulatory system diseases | 369 |
| Orphanet classification of rare systemic and rheumatological diseases | 364 |
| Orphanet classification of rare gynecological and obstetric diseases | 308 |
| Orphanet classification of rare respiratory diseases | 289 |
| Orphanet classification of rare cardiac malformations | 257 |
| Orphanet classification of rare cardiac diseases | 241 |
| Orphanet classification of rare abdominal surgical diseases | 236 |
| Orphanet classification of rare hepatic diseases | 233 |
| Orphanet classification of rare infectious diseases | 224 |
| Orphanet classification of rare urogenital diseases | 222 |
| Orphanet classification of rare surgical maxillo-facial diseases | 214 |
| Classification of pediatric cancer (Functional) | 208 |
| Orphanet classification of rare infertility disorders | 160 |
| Orphanet classification of rare odontological diseases | 130 |
| Orphanet classification of rare systemic or rheumatologic diseases of childhood | 128 |
| Orphanet classification of rare surgical thoracic diseases | 97 |
| Orphanet classification of rare disorders due to toxic effects | 65 |
| Orphanet classification of rare teratologic disorders | 39 |
| Orphanet classification of rare allergic disease | 14 |
| Orphanet classification of rare disorder without a determined diagnosis | 1 |

## mondo por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| MONDO:7770008 disease by etiologic mechanism | 17811 |
| MONDO:7770007 disease by developmental or physiological process | 7323 |
| MONDO:0005071 nervous system disorder | 5536 |
| MONDO:0002254 syndromic disease | 3359 |
| MONDO:0002081 musculoskeletal system disorder | 3201 |
| MONDO:0002051 integumentary system disorder | 1710 |
| MONDO:0024458 disorder of visual system | 1701 |
| MONDO:0004995 cardiovascular disorder | 1629 |
| MONDO:0005151 endocrine system disorder | 1629 |
| MONDO:0005046 immune system disorder | 1589 |
| MONDO:0002022 disorder of orbital region | 1584 |
| MONDO:0005039 reproductive system disorder | 1485 |
| MONDO:0004335 digestive system disorder | 1432 |
| MONDO:0005570 hematologic disorder | 1341 |
| MONDO:0003900 connective tissue disorder | 914 |
| MONDO:0005087 respiratory system disorder | 804 |
| MONDO:0002118 urinary system disorder | 772 |
| MONDO:0024623 otorhinolaryngologic disease | 355 |
| MONDO:0002409 auditory system disorder | 345 |
| MONDO:0006858 mouth disorder | 296 |
| MONDO:0002657 breast disorder | 184 |

## doid por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| DOID:7 disease of anatomical entity | 9234 |
| DOID:630 genetic disease | 5236 |
| DOID:14566 disease of cellular proliferation | 2858 |
| DOID:225 syndrome | 1069 |
| DOID:0014667 disease of metabolism | 901 |
| DOID:150 disease of mental health | 625 |
| DOID:0080015 physical disorder | 620 |
| DOID:0050117 disease by infectious agent | 547 |

## ncit-disease por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| C27551 Disorder by Site | 18908 |
| C3262 Neoplasm | 15356 |
| C53529 Non-Neoplastic Disorder | 5418 |
| C4873 Rare Disorder | 1348 |
| C28193 Syndrome | 1257 |
| C89328 Pediatric Disorder | 1066 |
| C8278 Cancer-Related Condition | 629 |
| C3101 Genetic Disorder | 370 |
| C2893 Psychiatric Disorder | 262 |
| C3340 Polyp | 110 |
| C35470 Behavioral Disorder | 62 |
| C26684 Radiation-Induced Disorder | 27 |

## Cruces publicados (origen → destino, por equivalencia)

| Par | Equivalencias |
|---|---|
| doid → efo-disease | sin equivalencia declarada: 5 |
| doid → mesh | sin equivalencia declarada: 4100 |
| doid → ncit-disease | sin equivalencia declarada: 4750 |
| doid → omim | sin equivalencia declarada: 6236 |
| doid → orphanet | sin equivalencia declarada: 2357 |
| doid → umls | sin equivalencia declarada: 7218 |
| efo-disease → doid | sin equivalencia declarada: 126 |
| efo-disease → icd10-who | sin equivalencia declarada: 177 |
| efo-disease → mesh | sin equivalencia declarada: 300 |
| efo-disease → mondo | sin equivalencia declarada: 17 |
| efo-disease → ncit-disease | sin equivalencia declarada: 223 |
| efo-disease → omim | sin equivalencia declarada: 165 |
| efo-disease → orphanet | sin equivalencia declarada: 152 |
| efo-disease → umls | sin equivalencia declarada: 82 |
| icd10-who → icd11-mms | sin equivalencia declarada: 11649 |
| icd11-mms → icd10-who | sin equivalencia declarada: 16831 |
| icd11-mms → icd11-foundation | equivalent: 2193 |
| mondo → decipher | sin equivalencia declarada: 1 · equivalent: 60 |
| mondo → doid | equivalent: 11960 · sin equivalencia declarada: 124 |
| mondo → efo-disease | equivalent: 9 |
| mondo → icd10-who | equivalent: 209 |
| mondo → icd11-foundation | equivalent: 4628 · narrower: 2 · wider: 2 |
| mondo → mesh | equivalent: 8075 · sin equivalencia declarada: 25 · wider: 2 · narrower: 1 |
| mondo → ncit-disease | equivalent: 7106 · sin equivalencia declarada: 4 · narrower: 2 · wider: 2 · inexact: 1 |
| mondo → omim | equivalent: 10661 · sin equivalencia declarada: 136 |
| mondo → orphanet | equivalent: 9759 · sin equivalencia declarada: 708 |
| mondo → umls | equivalent: 21661 |
| ncit-disease → umls | sin equivalencia declarada: 13981 |
| orphanet → icd10-who | wider: 7034 · equivalent: 605 · narrower: 800 · inexact: 11 |
| orphanet → icd11-mms | wider: 5156 · equivalent: 1497 · narrower: 206 |
| orphanet → mesh | equivalent: 3209 |
| orphanet → mondo | equivalent: 8918 |
| orphanet → omim | equivalent: 3781 · narrower: 4138 · wider: 797 · inexact: 29 |
| orphanet → umls | equivalent: 9586 |
