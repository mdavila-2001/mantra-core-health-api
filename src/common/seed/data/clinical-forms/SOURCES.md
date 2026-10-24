# Fuentes del catálogo de fichas clínicas

Las fuentes de cada ficha están en su `provenance` (título, organismo, URL, licencia, fecha) y,
para los campos agregados en la ampliación internacional, también en la ayuda (`description`) de
cada campo. Esta lista las reúne. Registro de pasadas, licencias por escala y huecos:
[`docs/seed-research/clinical-forms.md`](../../../../../docs/seed-research/clinical-forms.md).

## Fuentes de la base (v2, v4.2.0 y NNAC)

| Fuente                                                                                                                     | Organismo                                 | Licencia                                              | Dónde se describe                               |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| NT N.º 022-MINSA/DGSP-V.02, Gestión de la Historia Clínica                                                                 | MINSA Perú                                | Norma técnica estatal, acceso público                 | `README.md`, `tools/clinical-forms/fuentes.mjs` |
| Guías y paquetes técnicos de la OMS/OPS (HEARTS, mhGAP, ANC 2016, PNC 2022, Labour Care Guide, MEC, AIEPI, dengue y otros) | OMS / OPS                                 | CC BY-NC-SA 3.0 IGO                                   | `tools/clinical-forms/fuentes.mjs`              |
| SRQ-20 y AUDIT                                                                                                             | OMS                                       | Publicación OMS                                       | `README.md`                                     |
| Normas Nacionales de Atención Clínica 2012 y 2025 (RM 0456)                                                                | Ministerio de Salud y Deportes de Bolivia | Documento técnico-normativo estatal de acceso público | `tools/clinical-forms/nnac/README.md`           |
| KDIGO, GINA, GOLD, EULAR, AAO, ACR BI-RADS                                                                                 | Sociedades científicas                    | Sólo categorías clínicas, no texto                    | `tools/clinical-forms/fuentes.mjs`              |
| NIHSS, CTCAE, ECOG                                                                                                         | NINDS, NCI, ECOG-ACRIN                    | Dominio público / uso libre citando                   | `tools/clinical-forms/fuentes.mjs`              |

## Fuentes de la ampliación internacional (2026-10-24)

Todas se descargaron de GitHub y se congelaron en el repositorio con su commit; el generador no
necesita red.

| Fuente                                                                                                                                                                                                         | Versión congelada                                                      | Licencia                                                      | Instantánea                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| openEHR International Clinical Knowledge Manager — espejo [`openEHR/CKM-mirror`](https://github.com/openEHR/CKM-mirror), incluidos los CKM nacionales espejados de Nasjonal IKT (Noruega) y Clinical Models UK | commit `c3fdc43` (2026-10-20); 21 arquetipos, cada uno con su revisión | CC BY-SA 4.0 o 3.0 según el arquetipo; sin vínculos SNOMED CT | `tools/clinical-forms/openehr/ckm-snapshot.json` |
| OMS, Digital adaptation kit for postnatal care — [`WorldHealthOrganization/smart-dak-pnc`](https://github.com/WorldHealthOrganization/smart-dak-pnc), core data dictionary                                     | commit `1c490e4` (2025-09-17)                                          | CC BY-NC-SA 3.0 IGO                                           | `tools/clinical-forms/who-dak/dak-snapshot.json` |
| OMS, Digital Adaptation Kit for HIV 2023, Web Annex A — [`smart-hiv`](https://github.com/WorldHealthOrganization/smart-hiv)                                                                                    | commit `b1e7735` (2026-03-04)                                          | CC BY-NC-SA 3.0 IGO                                           | ídem                                             |
| OMS, DAK de planificación familiar — [`smart-fp`](https://github.com/WorldHealthOrganization/smart-fp)                                                                                                         | commit `b69bbec` (2025-11-19)                                          | CC BY-NC-SA 3.0 IGO                                           | ídem                                             |
| OMS, DAK de atención prenatal — [`smart-anc`](https://github.com/WorldHealthOrganization/smart-anc)                                                                                                            | commit `301a6b8` (2026-10-16)                                          | CC BY-NC-SA 3.0 IGO                                           | ídem                                             |
| OMS, Digital adaptation kit for immunizations — [`smart-immunizations`](https://github.com/WorldHealthOrganization/smart-immunizations)                                                                        | commit `bd7fa72` (2026-10-01)                                          | CC BY-NC-SA 3.0 IGO                                           | ídem                                             |
| HL7 FHIR International Patient Summary — [`HL7/fhir-ips`](https://github.com/HL7/fhir-ips), perfil Composition                                                                                                 | commit `df27097` (2026-06-16)                                          | Licencia FHIR de HL7 (CC0)                                    | citado en la ayuda de los campos                 |

Cada escala tomada del CKM cita, además, su publicación original en la ayuda del campo (Apgar 1953,
Pisters 2010, Child 1964 / Pugh 1973, Vincent 1996, Bishop 1964, Lee 1999, Charlson 1987,
Wagner 1981, Karnofsky 1949, Brott 1989, Schroeder 1987, Six 2008 / Backus 2013, Johnston 2007,
Downton 1991, Marshall y Chung 1999, Marshall y Tanner 1969–70, Kondrup 2003, Beighton 1973,
Epstein 2016, Ferriman y Gallwey 1961 / Hatch 1981).

Toda traducción del inglés es **propia y no oficial**, y así lo dice la ayuda de cada campo; los
campos de las DAK llevan además el descargo que exige la licencia de la OMS para las adaptaciones.

## Revisadas y descartadas

HL7 SDC (ejemplos de Questionnaire), DAK de ITS de la OMS (`smart-sti`, value sets en borrador) y
los sitios oficiales de guías bloqueados por la red de la sesión: ver el registro de pasadas.
