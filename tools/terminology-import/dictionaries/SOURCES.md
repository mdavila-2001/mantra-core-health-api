# Fuentes de los diccionarios médicos generales

Archivos que baja `fetch-dictionaries.mjs` (fuera de git, en `glossary-data-build/dictionaries-sources/`),
tal como quedaron en `manifest.json` en la corrida del **2026-10-24**. Cada URL apunta a una etiqueta de
release o a un commit, nunca a una rama: dos corridas leen los mismos bytes. La licencia de cada ontología
OBO es la que declara el registro de OBO Foundry (`registry/ontologies.jsonld`, commit
`2e6d1f43e5ca74100c64920ec11cb9fb7680fc59`) y coincide con el `LICENSE` de su repositorio.

Total: 51 archivos, ~1,5 GB (los crudos no se versionan; se borran al normalizar). Las filas anteriores a la tabla de C7 son de la corrida del 2026-10-24. Se citan por fuente en `dictionary-provenance` de cada concepto (archivo,
SHA-256, fecha, licencia, URI del término).

| Fuente (id) | Archivo | Versión fijada | Bytes | SHA-256 | Descargado (UTC) | Licencia | Carga |
|---|---|---|---:|---|---|---|---|
| ncbitaxon-medical | [mondo-edit.obo](https://raw.githubusercontent.com/monarch-initiative/mondo/v2026-10-06/src/ontology/mondo-edit.obo) | mondo v2026-10-06 | 46165069 | `0c1db51e6d84b7a5e9999257022838d2b416030cacdc62386191a3db09442195` | 2026-10-24 00:47 | CC BY 4.0 | default |
| ncbitaxon-medical | [ncbitaxon_import.obo](https://raw.githubusercontent.com/monarch-initiative/mondo/v2026-10-06/imports/ncbitaxon_import.obo) | mondo v2026-10-06 | 359627 | `a970a8ee729bc2dd9e509a51531b80e387bc5c52e32ed4c096970a146ddb7dfb` | 2026-10-24 00:47 | CC BY 4.0 | default |
| ncbitaxon-medical | [doid-merged.json](https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/v2026-09-30/src/ontology/doid-merged.json) | doid v2026-09-30 | 24179774 | `49570c8f38bf7d7af663012384011841ce80ddb2a6c3035d5ba35117131a0bc0` | 2026-10-24 00:47 | CC0 1.0 | default |
| uberon | [uberon-edit.obo](https://raw.githubusercontent.com/obophenotype/uberon/v2026-10-01/src/ontology/uberon-edit.obo) | v2026-10-01 | 12358690 | `77a0bbaa472f9358a98bfd08d9127fd3bd845bc364bcb3cc4459fd5a6687d497` | 2026-10-24 00:47 | CC BY 3.0 | default |
| cl | [cl.obo](https://raw.githubusercontent.com/obophenotype/cell-ontology/v2026-06-08/cl.obo) | v2026-06-08 | 17353259 | `7e19b4aef8e7fe7720b0c4474c6a5b8713c904ea9ab7b7d5d96f2cb28b8fc51f` | 2026-10-24 00:47 | CC BY 4.0 | default |
| ehdaa2 | [ehdaa2.obo](https://raw.githubusercontent.com/obophenotype/human-developmental-anatomy-ontology/cebc2be955caf6fe347df8a7e844e8c64ad35c97/src/ontology/ehdaa2.obo) | cebc2be955caf6fe347df8a7e844e8c64ad35c97 | 933914 | `544bde20316d27ebdc44397cdecec8b0958973e5999e21117ab13a6ab8866495` | 2026-10-24 00:47 | CC BY 4.0 | default |
| aeo | [aeo.obo](https://raw.githubusercontent.com/obophenotype/human-developmental-anatomy-ontology/cebc2be955caf6fe347df8a7e844e8c64ad35c97/src/ontology/aeo.obo) | cebc2be955caf6fe347df8a7e844e8c64ad35c97 | 73204 | `2b2be65370ce2c5f29d1195155fdce5c08da1896acbcd60ab8d2f0323ee4e8e7` | 2026-10-24 00:55 | CC BY 4.0 | default |
| caro | [caro.obo](https://raw.githubusercontent.com/obophenotype/caro/v2023-03-15/caro.obo) | v2023-03-15 | 596405 | `edb091304843d5932ff83fe958a1cd6790ed15dbc43053078193cfeb738a9563` | 2026-10-24 00:55 | CC BY 4.0 | default |
| hsapdv | [hsapdv.obo](https://raw.githubusercontent.com/obophenotype/developmental-stage-ontologies/v2025-01-23/src/ontology/components/hsapdv.obo) | v2025-01-23 | 143585 | `2fd1c669eb8c96a90ed67ae66603ac1322709832f4d0c23de8bb4a59e8741da9` | 2026-10-24 00:47 | CC BY 3.0 | default |
| so | [so.obo](https://raw.githubusercontent.com/The-Sequence-Ontology/SO-Ontologies/4340c143bac3578bba0c013d02e8c5f0e51ad14a/Ontology_Files/so.obo) | 4340c143bac3578bba0c013d02e8c5f0e51ad14a | 1058091 | `22a8f3ec2b49125dbb6cee8456f0bca86dd8c98f433165ffa4b554da4f155204` | 2026-10-24 00:47 | CC BY 4.0 | default |
| ogms | [ogms-edit.owl](https://raw.githubusercontent.com/OGMS/ogms/1a8c3d5e5b1b052090890112de5faeec6b3b3599/src/ontology/ogms-edit.owl) | 1a8c3d5e5b1b052090890112de5faeec6b3b3599 | 71723 | `a34e058aa6336e3a32f336a4919ccb5a420450039fa8bb7e3550996c3de7f17a` | 2026-10-24 01:09 | CC BY 4.0 | default |
| ido | [ido.owl](https://raw.githubusercontent.com/infectious-disease-ontology/infectious-disease-ontology/3c365c38f9d72ab9d61094a3aa3ce912259cb0ba/ido.owl) | 3c365c38f9d72ab9d61094a3aa3ce912259cb0ba | 767134 | `de5d35114bb65b7475551388e8a7899d202c4d69672bd9e39466605119fafb50` | 2026-10-24 01:09 | CC BY 3.0 | default |
| omrse | [omrse-edit.owl](https://raw.githubusercontent.com/mcwdsi/OMRSE/v2026-09-03/src/ontology/omrse-edit.owl) | v2026-09-03 | 349166 | `a09d34536adb407d97a16da4652288ac4fbb5eaa774ea4ceef474db5dd4ae209` | 2026-10-24 01:09 | CC BY 4.0 | default |
| trans | [trans.obo](https://raw.githubusercontent.com/DiseaseOntology/PathogenTransmissionOntology/v2026-03-13/src/ontology/trans.obo) | v2026-03-13 | 14505 | `a8bb259d256e9711f8d628b53f15f5a09c333cf606362c520703383b51b94224` | 2026-10-24 00:47 | CC0 1.0 | default |
| apollo_sv | [apollo_sv.obo](https://raw.githubusercontent.com/ApolloDev/apollo-sv/v2026-07-19/apollo_sv.obo) | v2026-07-19 | 1063442 | `b5c7e2849633752572acdac2ae2ef7b858452692e7ab99285aceca03da3a516a` | 2026-10-24 00:47 | CC BY 4.0 | default |
| stato | [stato.obo](https://raw.githubusercontent.com/ISA-tools/stato/v2026-04-20/releases/2026-04-20/stato.obo) | v2026-04-20 | 1300340 | `452565fbd6fba485f3bd81a972f481736029f36989eb59c0c3d4526317aee08e` | 2026-10-24 00:47 | CC BY 3.0 | default |
| ecto | [ecto-base.obo](https://raw.githubusercontent.com/EnvironmentOntology/environmental-exposure-ontology/v2026-07-28/ecto-base.obo) | v2026-07-28 | 1620370 | `eeaa8440524a820331075e3711016285738c85961cdba8c83ba63ffd462bfbc7` | 2026-10-24 00:47 | CC0 1.0 | opt-in |
| exo | [exo.obo](https://raw.githubusercontent.com/CTDbase/exposure-ontology/v2025-08-29/exo.obo) | v2025-08-29 | 67331 | `fe87d8b005a2ee33182a61618c485cb4b97e96b02a4daff2078f8fbdee8953e2` | 2026-10-24 00:47 | CC BY 4.0 | default |
| geno | [geno-base.obo](https://raw.githubusercontent.com/monarch-initiative/GENO-ontology/v2026-02-02/geno-base.obo) | v2026-02-02 | 224429 | `9b5f2a369d7c854cfa38664842b7a9b0be022ec46211f55536ad5b16dedb176f` | 2026-10-24 01:05 | CC BY 4.0 | default |
| oba | [oba.obo](https://raw.githubusercontent.com/obophenotype/bio-attribute-ontology/v2026-10-10/oba.obo) | v2026-10-10 | 37709017 | `3a307dd85dde57235c4d54614abd29d0be1f505a7fd5a1725ee37da28ab8079c` | 2026-10-24 01:05 | CC BY 4.0 | opt-in |
| nbo | [nbo-base.obo](https://raw.githubusercontent.com/obo-behavior/behavior-ontology/v2023-07-04/nbo-base.obo) | v2023-07-04 | 352666 | `4fb9509b35f88d3823ca926b3f0bacf5f4bb0c167378447b84abab55d4c8b590` | 2026-10-24 01:05 | CC BY 3.0 | opt-in |
| envo | [envo.obo](https://raw.githubusercontent.com/EnvironmentOntology/envo/v2026-10-23/envo.obo) | v2026-10-23 | 3015236 | `3b10403c67f51eac849623bc96de757744a3bf29815b3341d0cd1a0f547f4932` | 2026-10-24 01:05 | CC0 1.0 | opt-in |
| bto | [bto-base.obo](https://raw.githubusercontent.com/BRENDA-Enzymes/BTO/v2022-10-26/bto-base.obo) | v2022-10-26 | 2109317 | `4592acc80e34a6177bdb84ca37cb235fa8cd79388a51682cebd45c2be8cff81e` | 2026-10-24 01:14 | CC BY 4.0 | opt-in |
| occo | [occo.owl](https://raw.githubusercontent.com/Occupation-Ontology/OccO/v2025-10-06/occo.owl) | v2025-10-06 | 5465131 | `97462cabc824526898e486c6d780d62ab13b81ec98d30d4f05df41178b2d9f37` | 2026-10-24 01:14 | CC BY 4.0 | opt-in |
| aro | [aro.obo](https://raw.githubusercontent.com/arpcard/aro/f0f7f45053e52bb756e0077883eaa93ccfff2b75/src/ontology/aro.obo) | f0f7f45053e52bb756e0077883eaa93ccfff2b75 | 3318162 | `d12ec5d36c55f371079c392492b034d115adb256f8d2ff4a84041c6202f4a1c4` | 2026-10-24 01:18 | CC BY 4.0 | default |
| pbpko | [pbpko-base.obo](https://raw.githubusercontent.com/InSilicoVida-Research-Lab/pbpko/v2026-07-15/pbpko-base.obo) | v2026-07-15 | 509079 | `51dad1c239ea4e998d3edbf138a3fe38f8d524f411dcb593107ef69f9cfac3e3` | 2026-10-24 01:18 | CC BY 4.0 | default |
| opl | [opl.owl](https://raw.githubusercontent.com/OPL-ontology/OPL/v2023-08-28/opl.owl) | v2023-08-28 | 941059 | `6291a89589f01196cb4848bf215450e7b83c2a6af4422102f239895fa41c9dee` | 2026-10-24 01:18 | CC BY 4.0 | default |
| obcs | [obcs.owl](https://raw.githubusercontent.com/obcs/obcs/v2023-12-08/obcs.owl) | v2023-12-08 | 1880209 | `15c9fc46a03ed693f60c23cfcc73c1172967262c3b552c2c836c5b9273c1e008` | 2026-10-24 01:18 | CC BY 4.0 | default |
| hancestro | [hancestro-base.obo](https://raw.githubusercontent.com/EBISPOT/hancestro/v2025-10-14/hancestro-base.obo) | v2025-10-14 | 240082 | `5ca91be8006e846146c842d1c13367e049057c4ad01b51434cec0841f07c0e8e` | 2026-10-24 01:18 | CC BY 4.0 | opt-in |
| hso | [hso.owl](https://raw.githubusercontent.com/SVA-SE/HSO/2cb6a9badc1e5a33369ffcc28928d4ac99efc71e/hso.owl) | 2cb6a9badc1e5a33369ffcc28928d4ac99efc71e | 1360745 | `759a191213d53226f35a9b0f76125d49bb2bdf5cfea534953215e5f476d8c7e6` | 2026-10-24 01:18 | CC BY 3.0 | opt-in |
| mf | [MF.owl](https://raw.githubusercontent.com/jannahastings/mental-functioning-ontology/ba59d2c92dfa5c3190c8cba636687c1ef2fa06f2/ontology/MF.owl) | ba59d2c92dfa5c3190c8cba636687c1ef2fa06f2 | 430780 | `1c0166102ddfc57a5415b541b86a4894116e00a36f66d49fd2bafb647f67b587` | 2026-10-24 01:18 | CC BY 3.0 | opt-in |
| mfoem | [MFOEM.owl](https://raw.githubusercontent.com/jannahastings/emotion-ontology/7f4bddd2dee96ef635880987315a1cf947b57ed8/ontology/MFOEM.owl) | 7f4bddd2dee96ef635880987315a1cf947b57ed8 | 640327 | `b3b5f3a74be326350df3fffd24992dee9b990af3da0690a9d302cc1de2940894` | 2026-10-24 01:18 | CC BY 3.0 | opt-in |
| pw | [pathway_v2026-05-16.obo](https://raw.githubusercontent.com/rat-genome-database/PW-Pathway-Ontology/5dfd607e558beb1a20f78001e6d388cf9466593b/pathway_v2026-05-16.obo) | 5dfd607e558beb1a20f78001e6d388cf9466593b | 1347139 | `612231cd72e61149c76b1d4f872f4b567a10a1ac366c0c4abd20a191f3111318` | 2026-10-24 01:18 | CC BY 4.0 | opt-in |
| omp | [omp.obo](https://raw.githubusercontent.com/microbialphenotypes/OMP-ontology/04c460f93961a3697cfc0d3995d351ff9c3b135f/omp.obo) | 04c460f93961a3697cfc0d3995d351ff9c3b135f | 956565 | `d31f1a993c392ef038278b1f3ed98689d32e0c7b67db8591a238e7a927997061` | 2026-10-24 01:20 | CC BY 3.0 | opt-in |
| ohpi | [ohpi-base.obo](https://raw.githubusercontent.com/OHPI/ohpi/8f9169aa3766fa4e3a9bc4473d1f67aa38eafb60/ohpi-base.obo) | 8f9169aa3766fa4e3a9bc4473d1f67aa38eafb60 | 19155 | `6ba16a917ccf426053a328422b7b4fd7955976254efc2e192f6fc80cf8cb0d6e` | 2026-10-24 01:20 | CC BY 4.0 | opt-in |
| ohmi | [ohmi.owl](https://raw.githubusercontent.com/ohmi-ontology/ohmi/96cf9d5ef1795fbe009d90300f92b6ac958a48c3/ohmi.owl) | 96cf9d5ef1795fbe009d90300f92b6ac958a48c3 | 3113369 | `f7c809d9dba32784fd22b8449418b82e2ac5dff7e89bdc67aacfb10df66c3706` | 2026-10-24 01:20 | CC BY 4.0 | opt-in |
| mod | [PSI-MOD.obo](https://raw.githubusercontent.com/HUPO-PSI/psi-mod-CV/v1.039.0/PSI-MOD.obo) | v1.039.0 | 1798361 | `4f2be91dbbce1ca7fe68f2c72c2403323daeeeede58e8c0c4349e5b9d4281577` | 2026-10-24 01:20 | CC BY 4.0 | opt-in |
| rbo | [rbo-base.obo](https://raw.githubusercontent.com/Radiobiology-Informatics-Consortium/RBO/131f012c756373a9cfd02d0a07b08d5dad7e6a58/rbo-base.obo) | 131f012c756373a9cfd02d0a07b08d5dad7e6a58 | 52694 | `fb3417841be1b74e7bd6e49cb287ad5872633b395eed6e4481a738a20db1cef3` | 2026-10-24 01:20 | CC BY 3.0 | opt-in |
| taxrank | [taxrank.obo](https://raw.githubusercontent.com/phenoscape/taxrank/v2025-09-24/taxrank.obo) | v2025-09-24 | 15848 | `8cf42bd61ac683366ddde5018a7900804b8c942636e61f0793de4a289788e7c0` | 2026-10-24 01:20 | CC0 1.0 | opt-in |
| clo | [clo.owl](https://raw.githubusercontent.com/CLO-Ontology/CLO/v2026-06-19/clo.owl) | v2026-06-19 | 37965858 | `64b8167d3bdf789d902906053fcec29c0644d34e22378032fa0d2e03915d8920` | 2026-10-24 01:22 | CC BY 4.0 | opt-in |
| go | [go-edit.obo](https://raw.githubusercontent.com/geneontology/go-ontology/325856eea99660d02585bfb3d20d938c8d1b1371/src/ontology/go-edit.obo) | 325856eea99660d02585bfb3d20d938c8d1b1371 | 35432122 | `9c7290aa9e1652e1bed952ec96bfbe85547f6739a8cd5099a62f0a8dadd6df8a` | 2026-10-24 00:47 | CC BY 4.0 | opt-in |
| pato | [pato-base.obo](https://raw.githubusercontent.com/pato-ontology/pato/v2026-10-01/pato-base.obo) | v2026-10-01 | 786491 | `97d736330bde5a69e7dd333bd737f0288a27e85453b25bdfef1c19fe0dd4e01a` | 2026-10-24 00:47 | CC BY 3.0 | opt-in |
| fma | [fma.owl](https://bitbucket.org/uwsig/fma/raw/0e89b8ae8a647e5ee75d3119a20cb69abfbfc25f/fma.owl) | bitbucket uwsig/fma@0e89b8ae8a647e5ee75d3119a20cb69abfbfc25f | 201448396 | `3c2222348c9084b35ab3a4c27ab78b661adae17aa25cd349b3b74b22a763b9e4` | 2026-10-24 01:05 | Licencia abierta de la Universidad de Washington (2006: licencia perpetua, mundial, no exclusiva y sin regalías para reproducir, modificar y distribuir); Bioregistry la registra como CC BY 3.0 | default |
| hgnc | [hgnc_complete_set.json](https://storage.googleapis.com/public-download-files/hgnc/json/json/hgnc_complete_set.json) | fecha de descarga | 33242047 | `72bfe0c05800163c040a2cf663c70501f9ac9236469fbd0b552f2cd37a4d7f67` | 2026-10-24 00:47 | CC0 1.0 (HGNC: «freely available … no restrictions on their use») | default |
| abbreviations-metainventory | [Metainventory_Version1.0.0.csv](https://raw.githubusercontent.com/lisavirginia/clinical-abbreviations/v1.0.2/metainventory/Metainventory_Version1.0.0.csv) | v1.0.2 | 40035867 | `35ebc2b7e40f43448ce47cb74f6195f32facb04a32bd42aeda33bed8280ba257` | 2026-10-24 00:47 | CC BY 4.0 | default |

Fuentes sumadas el **2026-10-28** (carril C7; antes bloqueadas por red; las seis primeras filas son archivos nuevos y la última completa etiquetas de taxones):

| Fuente (id) | Archivo | Versión fijada | Bytes | SHA-256 | Descargado (UTC) | Licencia | Carga |
|---|---|---|---:|---|---|---|---|
| chebi | [chebi.obo](https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi.obo) | release 256 (`data-version: 256`, 2026-10-06) | 271094615 | `1fd3e7d0b9ba51934b20ebcda01eefe6e14f3b3b835a737a4665414da2122c50` | 2026-10-28 01:07 | CC BY 4.0 (`terms:license` del propio archivo) | default |
| pro | [pro_reasoned.obo](https://proconsortium.org/download/current/pro_reasoned.obo) | release 73.1 (`data-version`, 2026-09-15; URL «current», sin fijar) | 205871685 | `8e33bb64b847ebce998a94f45e4ebf4c050afcd2b6b4d782b89ce753360929df` | 2026-10-28 01:07 | CC BY 4.0 (`remark` y `dc:license` del archivo) | default |
| ncit-general | [ncit.obo](https://github.com/ncit-obo-org/ncit-obo-edition/releases/download/v2026-03-19/ncit.obo) | v2026-03-19 (`owl:versionInfo 26.02d`) | 248162694 | `8fdc2d29c9ebd91ada8330ed023b0c56ae787a31e6aedff453ee9bfef6fc18f6` | 2026-10-28 01:09 | CC BY 4.0 (Términos de uso del NCI Thesaurus, leídos el 2026-10-28) | default |
| mesh-subset | [desc2026.xml](https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.xml) | 2026 | 312952703 | `449792ed59ba4d60035e44724352f7361ec0dc945b67dcd821a50ff32f81bcdb` | 2026-10-28 01:09 | datos de MeSH de uso libre citando a NLM | default |
| emdn | [EMDN_v2026_EN.xlsx](https://webgate.ec.europa.eu/dyna2/emdn/build/EMDN%20v2026_EN..xlsx) | 2026 | 382642 | `a973dcdd8ae291248c9d06d355d3cc859d89a5584004db9354721c9c596bc1bd` | 2026-10-28 01:07 | CC BY 4.0 por el aviso legal de la Comisión (el archivo no trae aviso propio) | default |
| abremes | [AbreMES-DB.zip](https://zenodo.org/api/records/2207130/files/AbreMES-DB.zip/content) | zenodo 2207130 (2018-11-20) | 22225927 | `e8921fe9c66527e1e71bad7178b3efe3dd2a4e0f7e2a2a12535b8b8a3fb16e74` | 2026-10-28 01:08 | CC BY 4.0 (`license.id` del registro de Zenodo, leído el 2026-10-28) | default |
| ncbitaxon-medical | [taxdmp_2026-10-01.zip](https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump_archive/taxdmp_2026-10-01.zip) | NCBI Taxonomy 2026-10-01 | 79650311 | `d744af371c0b9fc7269d80b49546b6ac4c9ddc52a2fd97bcbfd02783edb5c9eb` | 2026-10-28 01:08 | Dominio público (NCBI) | default |

## Notas de licencia

- **CC BY 3.0 / 4.0** (Uberon, CL, SO, GO, Mondo, ARO, …): reutilización con atribución. La atribución
  viaja por concepto (`dictionary-provenance.sourceName`, `license`, `licenseUrl`, `uri`). Si una
  pantalla muestra estos términos tiene que mostrar la fuente.
- **CC0 1.0** (DOID, NCBITaxon, TRANS, ECTO, ENVO, TAXRANK) y **HGNC** («freely available … no
  restrictions»): sin condiciones; igual se cita.
- **FMA**: «intellectual property of the University of Washington» (comentario del propio `fma.owl`),
  distribuida desde 2006 con una licencia abierta de la UW (perpetua, mundial, no exclusiva, sin regalías,
  para reproducir, modificar y distribuir); Bioregistry la registra como CC BY 3.0 y OBO Foundry como
  «CUSTOM». La página oficial de licencia (`si.washington.edu`) no fue alcanzable desde la sesión.
  **Confirmada por el propietario el 2026-10-24.** El archivo es el último publicado en
  `bitbucket.org/uwsig/fma` (commit de 2015; el repositorio se actualizó por última vez en 2018).
- **Metainventario de abreviaturas**: CC BY 4.0 (`LICENSE.txt` del repositorio). Incluye registros
  derivados de UMLS-LRABR (léxico SPECIALIST de la NLM, de uso libre) y de ADAM; ésos son los que quedan
  opt-in.
- **Etiquetas ES de Wikidata** (`import-wikidata-es-labels.mjs`, corrido el 2026-10-28): CC0; son nombres de la
  comunidad, no traducciones oficiales, y se cargan como sinónimos ES (nunca preferidos) con su ítem Q. Wikidata es una fuente
  viva sin versiones: `wikidata-es-labels.meta.json` guarda el SHA-256 de cada una de las 406 respuestas leídas y el de la lista
  (`inputsSha256`); las respuestas crudas se borran. 61 312 filas (54 414 conceptos cargados por defecto); ver el recuento por propiedad en el meta.
- **ChEBI, PRO, NCIt**: CC BY 4.0, leída del propio archivo (ChEBI `terms:license`, PRO `remark` y `dc:license`) y de los
  Términos de uso de NCI (`ThesaurusTermsofUse.htm`: «released under the Creative Commons Attribution 4.0 International license»).
  NCIt aquí es la **edición OBO** (subconjunto «no-enfermedad»); el nombre «NCI Thesaurus» es marca registrada del NCI.
  Del contenido de ChEBI **no se cargan** los sinónimos ni xrefs cuyo origen es KEGG, DrugBank, HMDB (no comercial) ni ChEMBL (CC BY-SA): ver `RESTRICTED_ORIGIN` en `lib/sources.mjs`.
- **MeSH**: «NLM freely provides MeSH data»; se cita a NLM y la versión (2026). No cubre las traducciones (MTMS/DeCS).
- **EMDN**: el sitio de la Comisión la publica de acceso libre; el aviso legal de la Comisión (leído el 2026-10-28) licencia su
  contenido bajo CC BY 4.0 «salvo indicación contraria» y el archivo no trae aviso propio. Es solo inglés y en MAYÚSCULAS, tal cual.
- **AbreMES-DB**: CC BY 4.0 (registro de Zenodo; el pedido original hablaba de MIT). Es una extracción automática (no curada): se
  carga por defecto lo visto ≥ 3 veces (6 180 de 58 519 pares); el resto queda construido y opt-in.

## Fuentes que NO se usaron

| Fuente | Motivo |
|---|---|
| DeCS/MeSH en castellano (BIREME/OPS) | `decs.bvsalud.org`, `api.bvsalud.org` e `id.nlm.nih.gov` bloqueados por la política de red de la sesión (403). |
| Diccionario de Términos Médicos (RANM) / Diccionario panhispánico (RAE-RANM) | Con copyright: no se copian; además `dtme.ranm.es` y `dpej.rae.es` bloqueados. A lo sumo, enlace. |
| Cosnautas / Tremédica, TERMCAT, IATE | De pago (Cosnautas) o hosts bloqueados (`www.termcat.cat`, `iate.europa.eu`). |
| Terminologia Anatomica 2 (FIPAT) | `fipat.library.dal.ca` (la página de licencia y estado de TA2) da 502 del proxy (`CONNECT tunnel failed`) el 2026-10-28; `ta2viewer.openanatomy.org` responde 200 pero es una SPA sin descarga masiva y remite a FIPAT para la licencia. Sin licencia verificada no se carga. El TA98 en latín entra vía FMA. |
| MRO (MHC Restriction Ontology) | No se investigó en esta pasada (queda como hueco abierto; sin consulta de producto identificada). |
| NCIt completa (EVS) | `evs.nci.nih.gov/ftp1/NCI_Thesaurus/` responde 200, pero esta pasada solo carga la OBO Edition «no-enfermedad» (`ncit-general`); la cobertura de NCIt para enfermedades está en `diseases/` (no se verificó el solapamiento en esta pasada). |
| GenEpiO | El `genepio.obo` publicado tiene 14 bytes; sólo hay OWL de 2021. |
| PCL (Provisional Cell Ontology) | El `pcl-edit.owl` en git no declara clases. |
| GMDN | Exige membresía (licencia). No se crean cuentas. |
| ICNP, NANDA-I, NIC, NOC | Enfermería: la carga otra sesión (`justin/seed-nursing-care`). NANDA-I (NANDA International) y NIC/NOC (Elsevier) tienen copyright. |
| UMLS Metathesaurus | Exige cuenta UTS: **sin cuenta** (no se creó). |
| SNOMED CT | Bolivia no es miembro de SNOMED International; además se descartan los xrefs `SCTID` de las OBO. |
| MedlinePlus en español | Ya está en el glosario (`import-medlineplus-es.mjs`); `medlineplus.gov` bloqueado. |
| PubMed / Europe PMC | `eutils.ncbi.nlm.nih.gov` y `www.ebi.ac.uk` bloqueados: no se pudo buscar literatura para detectar huecos. |
| Wiktionary / Wikipedia (prefijos, sufijos, raíces, epónimos) | Bloqueados; no hay otra fuente estructurada y abierta alcanzable. Los epónimos anatómicos salen de FMA (267 estructuras). |
